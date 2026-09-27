package api

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/util"
)

var (
	categoryRegex = regexp.MustCompile(`account_category\s*=\s*'([^']+)'`)
	yearRegex     = regexp.MustCompile(`^\d{4}$`)
)

// APIHandler coordinates REST API requests for Excel Add-ins and presentation services.
type APIHandler struct {
	catalog  *semantic.Catalog
	compiler *semantic.Compiler
	db       *storage.DB
}

// NewAPIHandler constructs a new APIHandler instance.
func NewAPIHandler(catalog *semantic.Catalog, compiler *semantic.Compiler, db *storage.DB) *APIHandler {
	return &APIHandler{
		catalog:  catalog,
		compiler: compiler,
		db:       db,
	}
}

// RegisterRoutes binds all API routes to the given HTTP ServeMux.
func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/metrics/batch", h.withCORS(h.handleMetricsBatch))
	mux.HandleFunc("/api/v1/metrics/catalog", h.withCORS(h.handleMetricsCatalog))
	mux.HandleFunc("/api/v1/metrics/drilldown", h.withCORS(h.handleMetricsDrilldown))
	mux.HandleFunc("/api/v1/scenarios/override", h.withCORS(h.handleScenarioOverride))
}

func (h *APIHandler) withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

// BatchQueryItem represents an individual formula evaluation request.
type BatchQueryItem struct {
	MetricName string `json:"metric_name"`
	Period     string `json:"period"`
	Scenario   string `json:"scenario,omitempty"`
	Department string `json:"department,omitempty"`
}

// BatchRequest payload containing multiple cell queries.
type BatchRequest struct {
	Queries []BatchQueryItem `json:"queries"`
}

// BatchResultItem represents the result of evaluating an individual formula.
type BatchResultItem struct {
	MetricName  string  `json:"metric_name"`
	Period      string  `json:"period"`
	Scenario    string  `json:"scenario"`
	Department  string  `json:"department,omitempty"`
	Value       float64 `json:"value"`
	Formula     string  `json:"formula,omitempty"`
	SQLHash     string  `json:"sql_hash,omitempty"`
	Status      string  `json:"status"` // "ok" or "error"
	Error       string  `json:"error,omitempty"`
	ExecutionMs float64 `json:"execution_ms"`
}

// BatchResponse payload returning all cell query evaluations.
type BatchResponse struct {
	Results   []BatchResultItem `json:"results"`
	TotalTime float64           `json:"total_time_ms"`
	Count     int               `json:"count"`
}

func (h *APIHandler) handleMetricsBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	start := time.Now()
	var req BatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"invalid json body: %v"}`, err), http.StatusBadRequest)
		return
	}

	results := make([]BatchResultItem, len(req.Queries))

	for i, q := range req.Queries {
		qStart := time.Now()
		metricName := strings.TrimSpace(strings.ToLower(q.MetricName))
		scenario := strings.TrimSpace(strings.ToLower(q.Scenario))
		if scenario == "" {
			scenario = "actual"
		}

		item := BatchResultItem{
			MetricName: metricName,
			Period:     q.Period,
			Scenario:   scenario,
			Department: q.Department,
		}

		// 1. Catalog presence check
		metricDef, exists := h.catalog.GetMetric(metricName)
		if !exists {
			item.Status = "error"
			item.Error = "#FINMESH.INVALID_METRIC!"
			item.Value = 0.0
			item.ExecutionMs = float64(time.Since(qStart).Microseconds()) / 1000.0
			results[i] = item
			continue
		}

		// 2. Parse period
		var sDate, eDate string
		if q.Period != "" {
			var err error
			sDate, eDate, err = util.ParsePeriod(q.Period)
			if err != nil {
				item.Status = "error"
				item.Error = fmt.Sprintf("#FINMESH.INVALID_PERIOD: %v", err)
				item.Value = 0.0
				item.ExecutionMs = float64(time.Since(qStart).Microseconds()) / 1000.0
				results[i] = item
				continue
			}
		}

		// 3. Execute metric
		mQuery := model.MetricQuery{
			MetricName: metricName,
			Scenario:   scenario,
			StartDate:  sDate,
			EndDate:    eDate,
		}
		if q.Department != "" {
			mQuery.Dimensions = []string{q.Department}
		}

		res, err := h.compiler.ExecuteMetric(r.Context(), mQuery)
		if err != nil {
			item.Status = "error"
			item.Error = fmt.Sprintf("#FINMESH.QUERY_ERROR: %v", err)
			item.Value = 0.0
			item.ExecutionMs = float64(time.Since(qStart).Microseconds()) / 1000.0
			results[i] = item
			continue
		}

		// 4. Compute deterministic audit hash
		hashRaw := fmt.Sprintf("%s:%s:%s:%s", metricName, scenario, q.Period, res.SQLQuery)
		hasher := sha256.New()
		hasher.Write([]byte(hashRaw))
		sqlHash := hex.EncodeToString(hasher.Sum(nil))[:8]

		item.Status = "ok"
		item.Value = res.Value
		item.Formula = metricDef.Formula
		item.SQLHash = sqlHash
		item.ExecutionMs = float64(time.Since(qStart).Microseconds()) / 1000.0
		results[i] = item
	}

	resp := BatchResponse{
		Results:   results,
		TotalTime: float64(time.Since(start).Microseconds()) / 1000.0,
		Count:     len(results),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *APIHandler) handleMetricsCatalog(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	metrics := h.catalog.AllMetrics()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"metrics": metrics,
		"count":   len(metrics),
	})
}

// ScenarioOverrideRequest for bidirectional Excel What-If writebacks.
type ScenarioOverrideRequest struct {
	ScenarioName    string             `json:"scenario_name"`
	DriverOverrides map[string]float64 `json:"driver_overrides"`
}

type ScenarioOverrideResponse struct {
	ScenarioName             string             `json:"scenario_name"`
	BaselineRevenue          float64            `json:"baseline_revenue"`
	SimulatedRevenue         float64            `json:"simulated_revenue"`
	SimulatedGrossProfit     float64            `json:"simulated_gross_profit"`
	SimulatedGrossMarginPct  float64            `json:"simulated_gross_margin_pct"`
	SimulatedRunwayMonths    float64            `json:"simulated_runway_months"`
	OverridesApplied         int                `json:"overrides_applied"`
	AppliedAdjustments       map[string]float64 `json:"applied_adjustments"`
	Status                   string             `json:"status"`
}

func (h *APIHandler) handleScenarioOverride(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req ScenarioOverrideRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"invalid json: %v"}`, err), http.StatusBadRequest)
		return
	}

	scenarioName := strings.TrimSpace(req.ScenarioName)
	if scenarioName == "" {
		scenarioName = "WhatIf_Excel"
	}

	// 1. Query baseline revenue and COGS
	revRes, err := h.compiler.ExecuteMetric(r.Context(), model.MetricQuery{MetricName: "revenue", Scenario: "actual"})
	baseRev := 180000.0
	if err == nil && revRes != nil {
		baseRev = revRes.Value
	}
	cogsRes, _ := h.compiler.ExecuteMetric(r.Context(), model.MetricQuery{MetricName: "cogs", Scenario: "actual"})
	baseCOGS := 36000.0
	if cogsRes != nil {
		baseCOGS = cogsRes.Value
	}
	opexRes, _ := h.compiler.ExecuteMetric(r.Context(), model.MetricQuery{MetricName: "opex", Scenario: "actual"})
	baseOpex := 64000.0
	if opexRes != nil {
		baseOpex = opexRes.Value
	}

	// 2. Sensitivity propagation across driver DAG
	simRev := baseRev
	simCOGS := baseCOGS
	simOpex := baseOpex

	if priceLift, ok := req.DriverOverrides["price_lift"]; ok {
		simRev *= (1.0 + priceLift)
	}
	if churn, ok := req.DriverOverrides["churn_rate"]; ok {
		simRev *= (1.0 - churn)
	}
	if cpmGrowth, ok := req.DriverOverrides["cpm_growth"]; ok {
		// Marketing acquisition effect
		simRev *= (1.0 + cpmGrowth*0.4)
		simOpex += baseOpex * (cpmGrowth * 0.2)
	}
	if hiringDelay, ok := req.DriverOverrides["hiring_delay_months"]; ok {
		// Delayed headcount costs save opex
		monthlyHeadcountCost := 20000.0
		simOpex = math.Max(10000.0, simOpex-(monthlyHeadcountCost*hiringDelay/3.0))
	}

	simGrossProfit := math.Round((simRev-simCOGS)*100) / 100
	simGrossMarginPct := 0.0
	if simRev > 0 {
		simGrossMarginPct = math.Round((simGrossProfit/simRev*100)*100) / 100
	}

	simNetBurn := (simCOGS + simOpex) - simRev
	simRunway := 24.0
	if simNetBurn > 0 {
		latestCash := 600000.0
		simRunway = math.Round((latestCash/simNetBurn)*10) / 10
	} else {
		simRunway = 99.9 // Cash flow positive
	}

	// 3. Persist the WhatIf scenario into DuckDB with balanced journal entries
	h.db.ExecContext(r.Context(), "DELETE FROM fact_general_ledger WHERE scenario = ?", scenarioName)
	now := time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC)
	batchID := "excel_override_" + strconv.FormatInt(time.Now().Unix(), 10)
	scenarioEntries := []model.JournalEntry{
		// Revenue (Debit Cash, Credit Revenue)
		{VoucherID: "XLS-REV-01", LineNo: 1, PostingDate: now, AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: math.Round(simRev*100) / 100, CreditAmount: 0.0, Scenario: scenarioName, BatchID: batchID},
		{VoucherID: "XLS-REV-01", LineNo: 2, PostingDate: now, AccountCode: "6001", AccountName: "SaaS ARR", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: math.Round(simRev*100) / 100, Scenario: scenarioName, BatchID: batchID},
		// COGS (Debit COGS, Credit Cash)
		{VoucherID: "XLS-COG-01", LineNo: 1, PostingDate: now, AccountCode: "6401", AccountName: "Cloud Infrastructure", AccountCategory: "COGS", DebitAmount: math.Round(simCOGS*100) / 100, CreditAmount: 0.0, Scenario: scenarioName, BatchID: batchID},
		{VoucherID: "XLS-COG-01", LineNo: 2, PostingDate: now, AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: math.Round(simCOGS*100) / 100, Scenario: scenarioName, BatchID: batchID},
		// Opex (Debit Opex, Credit Cash)
		{VoucherID: "XLS-OPX-01", LineNo: 1, PostingDate: now, AccountCode: "6603", AccountName: "Operating Expenses", AccountCategory: "Opex", DebitAmount: math.Round(simOpex*100) / 100, CreditAmount: 0.0, Scenario: scenarioName, BatchID: batchID},
		{VoucherID: "XLS-OPX-01", LineNo: 2, PostingDate: now, AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: math.Round(simOpex*100) / 100, Scenario: scenarioName, BatchID: batchID},
	}
	if err := h.db.InsertEntries(r.Context(), scenarioEntries); err != nil {
		log.Printf("[API Override] Warning: failed to persist scenario to DuckDB: %v", err)
	}
	h.compiler.InvalidateCache()

	resp := ScenarioOverrideResponse{
		ScenarioName:            scenarioName,
		BaselineRevenue:         baseRev,
		SimulatedRevenue:        math.Round(simRev*100) / 100,
		SimulatedGrossProfit:    simGrossProfit,
		SimulatedGrossMarginPct: simGrossMarginPct,
		SimulatedRunwayMonths:   simRunway,
		OverridesApplied:        len(req.DriverOverrides),
		AppliedAdjustments:      req.DriverOverrides,
		Status:                  "ok",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *APIHandler) handleMetricsDrilldown(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	metricName := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("metric")))
	if metricName == "" {
		http.Error(w, `{"error":"missing metric parameter"}`, http.StatusBadRequest)
		return
	}
	period := strings.TrimSpace(r.URL.Query().Get("period"))
	scenario := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("scenario")))
	if scenario == "" {
		scenario = "actual"
	}
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	var startDate, endDate string
	if period != "" {
		var err error
		startDate, endDate, err = util.ParsePeriod(period)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"invalid period: %v"}`, err), http.StatusBadRequest)
			return
		}
	} else {
		startDate = "2026-01-01"
		endDate = "2026-12-31"
	}

	query := `
		SELECT voucher_id, line_no, posting_date, account_code, account_name,
		       account_category, debit_amount, credit_amount, department_id, scenario
		FROM fact_general_ledger
		WHERE scenario = ? AND posting_date >= ?::DATE AND posting_date <= ?::DATE
	`
	args := []any{scenario, startDate, endDate}

	if metric, ok := h.catalog.GetMetric(metricName); ok {
		cat := metric.Category
		if cat != "" && cat != "Profitability" && cat != "KPI" {
			query += " AND account_category = ?"
			args = append(args, cat)
		} else if match := categoryRegex.FindStringSubmatch(metric.DefaultFilter); len(match) > 1 {
			query += " AND account_category = ?"
			args = append(args, match[1])
		}
	}
	query += fmt.Sprintf(" ORDER BY posting_date DESC, voucher_id LIMIT %d", limit)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		log.Printf("[API Drilldown] Query failed: %v", err)
		http.Error(w, fmt.Sprintf(`{"error":"database query failed: %v"}`, err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type VoucherRow struct {
		VoucherID       string  `json:"voucher_id"`
		LineNo          int     `json:"line_no"`
		PostingDate     string  `json:"posting_date"`
		AccountCode     string  `json:"account_code"`
		AccountName     string  `json:"account_name"`
		AccountCategory string  `json:"account_category"`
		DebitAmount     float64 `json:"debit_amount"`
		CreditAmount    float64 `json:"credit_amount"`
		DepartmentID    string  `json:"department_id"`
		Scenario        string  `json:"scenario"`
	}

	var entries []VoucherRow
	for rows.Next() {
		var vr VoucherRow
		if err := rows.Scan(
			&vr.VoucherID, &vr.LineNo, &vr.PostingDate, &vr.AccountCode, &vr.AccountName,
			&vr.AccountCategory, &vr.DebitAmount, &vr.CreditAmount, &vr.DepartmentID, &vr.Scenario,
		); err == nil {
			entries = append(entries, vr)
		}
	}

	mQuery := model.MetricQuery{
		MetricName: metricName,
		Scenario:   scenario,
		StartDate:  startDate,
		EndDate:    endDate,
	}
	cteSQL, _ := h.compiler.CompileSQL(mQuery)
	hasher := sha256.New()
	hasher.Write([]byte(fmt.Sprintf("%s:%s:%s:%s", metricName, scenario, period, cteSQL)))
	sqlHash := hex.EncodeToString(hasher.Sum(nil))[:8]

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"metric_name": metricName,
		"scenario":    scenario,
		"period":      period,
		"sql_hash":    sqlHash,
		"sql_query":   cteSQL,
		"entries":     entries,
		"row_count":   len(entries),
	})
}
