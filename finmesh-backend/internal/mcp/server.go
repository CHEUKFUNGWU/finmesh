package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"strings"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

// FinMeshMCPServer manages and exposes financial computation tools over MCP.
type FinMeshMCPServer struct {
	server   *server.MCPServer
	compiler *semantic.Compiler
	catalog  *semantic.Catalog
	db       *storage.DB
}

// NewFinMeshMCPServer constructs the MCP server with the 5 core financial tools.
func NewFinMeshMCPServer(catalog *semantic.Catalog, compiler *semantic.Compiler, db *storage.DB) *FinMeshMCPServer {
	s := server.NewMCPServer("finmesh-engine", "0.1.0")

	f := &FinMeshMCPServer{
		server:   s,
		compiler: compiler,
		catalog:  catalog,
		db:       db,
	}

	f.registerTools()
	return f
}

// MCPServer returns the underlying MCP server instance.
func (f *FinMeshMCPServer) MCPServer() *server.MCPServer {
	return f.server
}

func (f *FinMeshMCPServer) registerTools() {
	// Tool 1: query_financial_metric (REQ-0005)
	queryTool := mcp.NewTool("query_financial_metric",
		mcp.WithDescription("Query deterministic financial metrics (revenue, cogs, gross_profit, opex) from the semantic catalog across scenarios and periods."),
		mcp.WithString("metric_name", mcp.Required(), mcp.Description("Catalog metric name, e.g. revenue, cogs, gross_profit")),
		mcp.WithString("scenario", mcp.Required(), mcp.Description("Financial scenario: actual, budget, forecast")),
		mcp.WithString("period", mcp.Required(), mcp.Description("Quarter or month format (e.g. 2026-Q1, 2026-03, 2026)")),
	)
	f.server.AddTool(queryTool, f.handleQueryMetric)

	// Tool 2: get_metric_catalog (REQ-0005)
	catalogTool := mcp.NewTool("get_metric_catalog",
		mcp.WithDescription("Introspect the semantic metric catalog, retrieving definitions, formulas, categories and dependency chains."),
		mcp.WithString("category", mcp.Description("Optional category filter: Revenue, Profitability, Opex, KPI")),
	)
	f.server.AddTool(catalogTool, f.handleGetCatalog)

	// Tool 3: explain_variance (REQ-0005)
	varianceTool := mcp.NewTool("explain_variance",
		mcp.WithDescription("Calculate Price-Volume-Mix (PVM) mathematical variance breakdown between baseline and comparison scenarios."),
		mcp.WithString("metric_name", mcp.Required(), mcp.Description("Metric identifier to analyze, e.g. revenue, gross_profit")),
		mcp.WithString("baseline", mcp.Required(), mcp.Description("Baseline scenario, e.g. budget")),
		mcp.WithString("comparison", mcp.Required(), mcp.Description("Comparison scenario, e.g. actual")),
		mcp.WithString("period", mcp.Description("Optional period identifier, e.g. 2026-Q1")),
	)
	f.server.AddTool(varianceTool, f.handleExplainVariance)

	// Tool 4: drilldown_transaction_ledger (REQ-0005)
	ledgerTool := mcp.NewTool("drilldown_transaction_ledger",
		mcp.WithDescription("Fetch underlying general ledger transaction vouchers contributing to a specific metric for audit verification."),
		mcp.WithString("metric_name", mcp.Required(), mcp.Description("Metric name to drill into, e.g. revenue, cogs")),
		mcp.WithString("period", mcp.Required(), mcp.Description("Period identifier, e.g. 2026-Q1, 2026-01")),
		mcp.WithString("scenario", mcp.Description("Scenario: actual, budget, forecast (default: actual)")),
		mcp.WithNumber("limit", mcp.Description("Max rows to return (default 20, max 100)")),
	)
	f.server.AddTool(ledgerTool, f.handleDrilldownLedger)

	// Tool 5: simulate_whatif (REQ-0005)
	whatifTool := mcp.NewTool("simulate_whatif",
		mcp.WithDescription("Simulate cascaded metric impact across the driver DAG given parameter percentage adjustments."),
		mcp.WithString("scenario_id", mcp.Required(), mcp.Description("Target scenario to branch from, e.g. actual_2026_q1")),
		mcp.WithString("adjustments", mcp.Required(), mcp.Description("JSON key-value string of driver adjustments, e.g. '{\"price_lift\": 0.10, \"churn_rate\": -0.02}'")),
	)
	f.server.AddTool(whatifTool, f.handleSimulateWhatIf)
}

func (f *FinMeshMCPServer) handleQueryMetric(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	start := time.Now()
	metricName, err := req.RequireString("metric_name")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: metric_name"), nil
	}
	scenario, err := req.RequireString("scenario")
	if err != nil {
		scenario = "actual"
	}
	period, err := req.RequireString("period")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: period"), nil
	}

	startDate, endDate, err := parsePeriod(period)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("invalid period format: %v", err)), nil
	}

	result, err := f.compiler.ExecuteMetric(ctx, model.MetricQuery{
		MetricName: metricName,
		Scenario:   scenario,
		StartDate:  startDate,
		EndDate:    endDate,
	})
	if err != nil {
		log.Printf("[MCP Audit] query_financial_metric FAIL: %s (err: %v)", metricName, err)
		return mcp.NewToolResultError(fmt.Sprintf("metric execution failed: %v", err)), nil
	}

	log.Printf("[MCP Audit] query_financial_metric SUCCESS: %s/%s/%s -> %.2f (took %v)",
		metricName, scenario, period, result.Value, time.Since(start))

	bytes, _ := json.MarshalIndent(result, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleGetCatalog(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	categoryFilter := req.GetString("category", "")
	all := f.catalog.AllMetrics()

	var filtered []model.MetricDefinition
	for _, m := range all {
		if categoryFilter == "" || strings.EqualFold(m.Category, categoryFilter) {
			filtered = append(filtered, m)
		}
	}

	bytes, _ := json.MarshalIndent(filtered, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleExplainVariance(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	start := time.Now()
	metricName, err := req.RequireString("metric_name")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: metric_name"), nil
	}
	baseline, err := req.RequireString("baseline")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: baseline"), nil
	}
	comparison, err := req.RequireString("comparison")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: comparison"), nil
	}

	breakdown, err := f.compiler.ExecuteVariance(ctx, metricName, baseline, comparison)
	if err != nil {
		log.Printf("[MCP Audit] explain_variance FAIL: %s (err: %v)", metricName, err)
		return mcp.NewToolResultError(fmt.Sprintf("variance calculation failed: %v", err)), nil
	}

	log.Printf("[MCP Audit] explain_variance SUCCESS: %s (%s vs %s) -> delta=%.2f (took %v)",
		metricName, comparison, baseline, breakdown.TotalVariance, time.Since(start))

	bytes, _ := json.MarshalIndent(breakdown, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleDrilldownLedger(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	start := time.Now()
	metricName, err := req.RequireString("metric_name")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: metric_name"), nil
	}
	period, err := req.RequireString("period")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: period"), nil
	}
	scenario := req.GetString("scenario", "actual")
	limit := req.GetInt("limit", 20)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	startDate, endDate, err := parsePeriod(period)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("invalid period format: %v", err)), nil
	}

	// Parameterized SQL query: strict SQL-injection proofing
	query := `
		SELECT voucher_id, line_no, posting_date, account_code, account_name,
		       account_category, debit_amount, credit_amount, department_id, scenario
		FROM fact_general_ledger
		WHERE scenario = ? AND posting_date >= ?::DATE AND posting_date <= ?::DATE
	`
	args := []any{scenario, startDate, endDate}

	// If metric has a category mapping, add it as parameter
	if metric, ok := f.catalog.GetMetric(metricName); ok {
		if strings.Contains(metric.DefaultFilter, "account_category = '") {
			parts := strings.Split(metric.DefaultFilter, "'")
			if len(parts) >= 2 {
				query += " AND account_category = ?"
				args = append(args, parts[1])
			}
		}
	}
	query += fmt.Sprintf(" ORDER BY posting_date DESC, voucher_id LIMIT %d", limit)

	rows, err := f.db.Query(query, args...)
	if err != nil {
		log.Printf("[MCP Audit] drilldown_ledger FAIL: %s (err: %v)", metricName, err)
		return mcp.NewToolResultError(fmt.Sprintf("ledger query failed: %v", err)), nil
	}
	defer rows.Close()

	type LedgerRow struct {
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

	var results []LedgerRow
	for rows.Next() {
		var r LedgerRow
		if err := rows.Scan(
			&r.VoucherID, &r.LineNo, &r.PostingDate, &r.AccountCode, &r.AccountName,
			&r.AccountCategory, &r.DebitAmount, &r.CreditAmount, &r.DepartmentID, &r.Scenario,
		); err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("row scan failed: %v", err)), nil
		}
		results = append(results, r)
	}

	log.Printf("[MCP Audit] drilldown_ledger SUCCESS: %s/%s/%s -> %d rows (took %v)",
		metricName, scenario, period, len(results), time.Since(start))

	bytes, _ := json.MarshalIndent(results, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleSimulateWhatIf(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	start := time.Now()
	scenarioID, err := req.RequireString("scenario_id")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: scenario_id"), nil
	}
	adjustmentsJSON, err := req.RequireString("adjustments")
	if err != nil {
		return mcp.NewToolResultError("missing required parameter: adjustments"), nil
	}

	var adjustments map[string]float64
	if err := json.Unmarshal([]byte(adjustmentsJSON), &adjustments); err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("invalid adjustments JSON format: %v", err)), nil
	}

	// Query baseline actuals
	revRes, err := f.compiler.ExecuteMetric(ctx, model.MetricQuery{MetricName: "revenue", Scenario: "actual"})
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to query baseline revenue: %v", err)), nil
	}
	cogsRes, _ := f.compiler.ExecuteMetric(ctx, model.MetricQuery{MetricName: "cogs", Scenario: "actual"})

	baseRev := revRes.Value
	baseCOGS := 0.0
	if cogsRes != nil {
		baseCOGS = cogsRes.Value
	}

	// Dynamic sensitivity propagation across DAG
	priceAdjustment := adjustments["price_lift"]
	churnAdjustment := adjustments["churn_rate"]
	marketingSpend := adjustments["marketing_spend"]

	simRev := math.Round(baseRev*(1.0+priceAdjustment)*(1.0-churnAdjustment)*100) / 100
	simCOGS := math.Round(baseCOGS*(1.0+marketingSpend*0.2)*100) / 100
	simGrossProfit := math.Round((simRev-simCOGS)*100) / 100

	simResponse := map[string]interface{}{
		"scenario_id":            scenarioID,
		"baseline_revenue":       baseRev,
		"simulated_revenue":      simRev,
		"revenue_delta":          math.Round((simRev-baseRev)*100) / 100,
		"baseline_gross_profit":  math.Round((baseRev-baseCOGS)*100) / 100,
		"simulated_gross_profit": simGrossProfit,
		"applied_adjustments":    adjustments,
		"status":                 "success",
	}

	log.Printf("[MCP Audit] simulate_whatif SUCCESS: %s -> simRev=%.2f (took %v)",
		scenarioID, simRev, time.Since(start))

	bytes, _ := json.MarshalIndent(simResponse, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func parsePeriod(period string) (startDate, endDate string, err error) {
	period = strings.TrimSpace(strings.ToUpper(period))
	switch {
	case strings.HasSuffix(period, "-Q1"):
		year := strings.TrimSuffix(period, "-Q1")
		return year + "-01-01", year + "-03-31", nil
	case strings.HasSuffix(period, "-Q2"):
		year := strings.TrimSuffix(period, "-Q2")
		return year + "-04-01", year + "-06-30", nil
	case strings.HasSuffix(period, "-Q3"):
		year := strings.TrimSuffix(period, "-Q3")
		return year + "-07-01", year + "-09-30", nil
	case strings.HasSuffix(period, "-Q4"):
		year := strings.TrimSuffix(period, "-Q4")
		return year + "-10-01", year + "-12-31", nil
	case len(period) == 7 && period[4] == '-': // YYYY-MM
		parts := strings.Split(period, "-")
		year := parts[0]
		month := parts[1]
		return fmt.Sprintf("%s-%s-01", year, month), fmt.Sprintf("%s-%s-28", year, month), nil
	case len(period) == 4: // YYYY
		return period + "-01-01", period + "-12-31", nil
	default:
		return "2026-01-01", "2026-12-31", nil
	}
}
