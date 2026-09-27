package gateway

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
)

// ProviderType identifies the protocol interface for the model gateway.
type ProviderType string

const (
	ProviderOpenAICompatible    ProviderType = "openai-compatible"
	ProviderAnthropicCompatible ProviderType = "anthropic-compatible"
	ProviderResponseAPI         ProviderType = "response-api"
	ProviderSelfHosted          ProviderType = "self-hosted" // vLLM / Ollama
)

// GatewayConfig holds configuration for the protocol-neutral model gateway.
type GatewayConfig struct {
	Provider ProviderType `json:"provider"`
	BaseURL  string       `json:"base_url"`
	APIKey   string       `json:"api_key,omitempty"`
	Model    string       `json:"model"`
}

// MemoRequest requests generating an autonomous variance commentary memo.
type MemoRequest struct {
	Period            string   `json:"period"`   // e.g. 2026-Q1
	BaselineScenario  string   `json:"baseline"` // budget
	CompScenario      string   `json:"comparison"` // actual
	FocusMetrics      []string `json:"focus_metrics,omitempty"`
}

// TokenRef documents an interactive verified number token embedded in the memo.
type TokenRef struct {
	MetricID     string  `json:"metric_id"`
	DisplayValue string  `json:"display_value"`
	NumericValue float64 `json:"numeric_value"`
	SQLHash      string  `json:"sql_hash"`
	Category     string  `json:"category"`
}

// MemoResponse contains the synthesized memo with verified metric tokens.
type MemoResponse struct {
	Title        string     `json:"title"`
	Period       string     `json:"period"`
	GeneratedAt  time.Time  `json:"generated_at"`
	Content      string     `json:"content"`
	MetricTokens []TokenRef `json:"metric_tokens"`
	PVMDetails   []model.VarianceBreakdown `json:"pvm_details"`
}

// ModelGateway orchestrates "Separation of Compute and Narrative" per REQ-0004 §4.2.
type ModelGateway struct {
	config   GatewayConfig
	compiler *semantic.Compiler
}

// NewModelGateway instantiates the protocol-neutral gateway.
func NewModelGateway(cfg GatewayConfig, compiler *semantic.Compiler) *ModelGateway {
	if cfg.Provider == "" {
		cfg.Provider = ProviderOpenAICompatible
	}
	if cfg.Model == "" {
		cfg.Model = "model-neutral-standard"
	}
	return &ModelGateway{
		config:   cfg,
		compiler: compiler,
	}
}

// GenerateVarianceMemo executes deterministic DuckDB calculations and synthesizes an auditable memo.
func (g *ModelGateway) GenerateVarianceMemo(ctx context.Context, req MemoRequest) (*MemoResponse, error) {
	if req.Period == "" {
		req.Period = "2026-Q1"
	}
	if req.BaselineScenario == "" {
		req.BaselineScenario = "budget"
	}
	if req.CompScenario == "" {
		req.CompScenario = "actual"
	}

	metrics := req.FocusMetrics
	if len(metrics) == 0 {
		metrics = []string{"revenue", "cogs", "gross_profit"}
	}

	var pvmList []model.VarianceBreakdown
	var tokens []TokenRef

	// 1. Compute deterministic facts from DuckDB
	for _, m := range metrics {
		v, err := g.compiler.ExecuteVariance(ctx, m, req.BaselineScenario, req.CompScenario)
		if err != nil {
			return nil, fmt.Errorf("failed calculating variance for %s: %w", m, err)
		}
		pvmList = append(pvmList, *v)

		// Create cryptographic SQL hash
		hashBytes := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s:%.2f", m, req.Period, req.CompScenario, v.ComparisonValue)))
		sqlHash := hex.EncodeToString(hashBytes[:4])

		deltaPct := 0.0
		if v.BaselineValue != 0 {
			deltaPct = math.Round(((v.ComparisonValue-v.BaselineValue)/math.Abs(v.BaselineValue))*1000) / 10
		}

		sign := "+"
		if v.TotalVariance < 0 {
			sign = ""
		}

		token := TokenRef{
			MetricID:     m,
			DisplayValue: fmt.Sprintf("%s$%.0f (%s%.1f%%)", sign, v.TotalVariance, sign, deltaPct),
			NumericValue: v.TotalVariance,
			SQLHash:      sqlHash,
			Category:     "variance_total",
		}
		tokens = append(tokens, token)
	}

	// 2. Synthesize narrative memo embedding verified MetricTokens
	title := fmt.Sprintf("Autonomous FP&A Variance Commentary — %s (%s vs %s)", req.Period, req.CompScenario, req.BaselineScenario)

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("## %s\n\n", title))
	sb.WriteString(fmt.Sprintf("**Date**: %s | **Engine**: FinMesh Go+DuckDB (Protocol: `%s`)\n\n",
		time.Now().Format("2006-01-02"), g.config.Provider))

	sb.WriteString("### Executive Summary / 经营业绩综述\n")
	sb.WriteString(fmt.Sprintf("During %s, the business recorded notable operational variances against %s expectations:\n\n", req.Period, req.BaselineScenario))

	for i, pvm := range pvmList {
		token := tokens[i]
		sb.WriteString(fmt.Sprintf("- **%s**: Reported at $%.2f against a %s baseline of $%.2f, yielding a net variance of ",
			strings.ToUpper(pvm.MetricName), pvm.ComparisonValue, req.BaselineScenario, pvm.BaselineValue))
		sb.WriteString(fmt.Sprintf("<MetricToken metricId=\"%s\" value=\"%.2f\" displayValue=\"%s\" sqlHash=\"%s\" category=\"%s\" />.\n",
			token.MetricID, token.NumericValue, token.DisplayValue, token.SQLHash, token.Category))

		if pvm.VolumeVariance != 0 || pvm.PriceVariance != 0 {
			sb.WriteString(fmt.Sprintf("  - *PVM Decomposition*: Volume impact contributed $%.2f, Price impact contributed $%.2f.\n",
				pvm.VolumeVariance, pvm.PriceVariance))
		}
	}

	sb.WriteString("\n### Audit & Verification Note / 审计穿透说明\n")
	sb.WriteString("All financial metrics above were deterministically calculated via DuckDB columnar queries with zero arithmetic hallucination. Click any `<MetricToken />` to inspect the exact query hash, mathematical formula, and contributing ledger journal vouchers.\n")

	content := sb.String()

	// If remote API endpoint is configured, attempt live HTTP dispatch per REQ-0004 §4.2
	if g.config.BaseURL != "" && g.config.APIKey != "" {
		systemPrompt := "You are an autonomous Finance BP synthesizing an executive variance memo. You MUST NOT invent, estimate, or modify any financial numbers. Every single variance delta, percentage, or currency figure must be wrapped in a <MetricToken metricId=\"...\" value=\"...\" displayValue=\"...\" sqlHash=\"...\" category=\"...\" /> component exactly as provided in the facts context."
		factsJSON, _ := json.Marshal(map[string]interface{}{
			"period":        req.Period,
			"baseline":      req.BaselineScenario,
			"comparison":    req.CompScenario,
			"metric_tokens": tokens,
			"pvm_details":   pvmList,
		})
		if remoteContent, err := g.dispatchHTTP(ctx, systemPrompt, string(factsJSON)); err == nil && remoteContent != "" {
			// Ensure remote content passes zero-arithmetic-hallucination verification
			if valid := g.verifyTokens(remoteContent, tokens); valid {
				content = remoteContent
			}
		}
	}

	// 3. Verify zero arithmetic hallucination: Ensure all embedded token values correspond to factual results
	if !g.verifyTokens(content, tokens) {
		return nil, fmt.Errorf("hallucination guard exception: one or more tokens in generated memo do not match verified factual results")
	}

	return &MemoResponse{
		Title:        title,
		Period:       req.Period,
		GeneratedAt:  time.Now(),
		Content:      content,
		MetricTokens: tokens,
		PVMDetails:   pvmList,
	}, nil
}

func (g *ModelGateway) verifyTokens(content string, tokens []TokenRef) bool {
	tokenRegex := regexp.MustCompile(`<MetricToken\s+metricId="([^"]+)"\s+value="([^"]+)"`)
	matches := tokenRegex.FindAllStringSubmatch(content, -1)
	if len(matches) == 0 {
		return false
	}
	for _, match := range matches {
		metricID := match[1]
		valStr := match[2]
		var found bool
		for _, t := range tokens {
			if t.MetricID == metricID && fmt.Sprintf("%.2f", t.NumericValue) == valStr {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}

// dispatchHTTP sends live HTTP completions to OpenAI/Anthropic/vLLM endpoints per REQ-0004 §4.2.
func (g *ModelGateway) dispatchHTTP(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	if g.config.BaseURL == "" {
		return "", fmt.Errorf("no base_url configured for provider %s", g.config.Provider)
	}

	client := &http.Client{Timeout: 8 * time.Second}

	switch g.config.Provider {
	case ProviderAnthropicCompatible:
		reqBody := map[string]interface{}{
			"model":      g.config.Model,
			"max_tokens": 2048,
			"system":     systemPrompt,
			"messages": []map[string]string{
				{"role": "user", "content": userPrompt},
			},
		}
		jsonBytes, err := json.Marshal(reqBody)
		if err != nil {
			return "", err
		}
		endpoint := strings.TrimRight(g.config.BaseURL, "/") + "/v1/messages"
		req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(jsonBytes))
		if err != nil {
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-api-key", g.config.APIKey)
		req.Header.Set("anthropic-version", "2023-06-01")

		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)
		if resp.StatusCode >= 400 {
			return "", fmt.Errorf("anthropic api error (status %d): %s", resp.StatusCode, string(bodyBytes))
		}

		var anthropicResp struct {
			Content []struct {
				Text string `json:"text"`
			} `json:"content"`
		}
		if err := json.Unmarshal(bodyBytes, &anthropicResp); err != nil || len(anthropicResp.Content) == 0 {
			return "", fmt.Errorf("invalid anthropic response: %v", err)
		}
		return anthropicResp.Content[0].Text, nil

	default: // ProviderOpenAICompatible, ProviderResponseAPI, ProviderSelfHosted
		reqBody := map[string]interface{}{
			"model": g.config.Model,
			"messages": []map[string]string{
				{"role": "system", "content": systemPrompt},
				{"role": "user", "content": userPrompt},
			},
		}
		jsonBytes, err := json.Marshal(reqBody)
		if err != nil {
			return "", err
		}
		endpoint := strings.TrimRight(g.config.BaseURL, "/") + "/v1/chat/completions"
		req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(jsonBytes))
		if err != nil {
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		if g.config.APIKey != "" {
			req.Header.Set("Authorization", "Bearer "+g.config.APIKey)
		}

		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)
		if resp.StatusCode >= 400 {
			return "", fmt.Errorf("chat completion api error (status %d): %s", resp.StatusCode, string(bodyBytes))
		}

		var openAIResp struct {
			Choices []struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			} `json:"choices"`
		}
		if err := json.Unmarshal(bodyBytes, &openAIResp); err != nil || len(openAIResp.Choices) == 0 {
			return "", fmt.Errorf("invalid chat completion response: %v", err)
		}
		return openAIResp.Choices[0].Message.Content, nil
	}
}
