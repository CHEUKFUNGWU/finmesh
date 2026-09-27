package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"math"

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
	// Tool 1: query_financial_metric
	queryTool := mcp.NewTool("query_financial_metric",
		mcp.WithDescription("Query deterministic financial metrics (revenue, cogs, opex, etc.) from the semantic catalog across scenarios and date ranges."),
		mcp.WithString("metric_name", mcp.Required(), mcp.Description("Registered metric identifier, e.g. revenue, cogs")),
		mcp.WithString("scenario", mcp.Description("Scenario: actual, budget, forecast (default: actual)")),
		mcp.WithString("start_date", mcp.Description("Optional filter start date YYYY-MM-DD")),
		mcp.WithString("end_date", mcp.Description("Optional filter end date YYYY-MM-DD")),
	)
	f.server.AddTool(queryTool, f.handleQueryMetric)

	// Tool 2: get_metric_catalog
	catalogTool := mcp.NewTool("get_metric_catalog",
		mcp.WithDescription("Introspect the semantic metric catalog, retrieving definitions, formulas, categories and dependency chains."),
		mcp.WithString("category", mcp.Description("Optional filter by category: Revenue, Profitability, Opex, KPI")),
	)
	f.server.AddTool(catalogTool, f.handleGetCatalog)

	// Tool 3: explain_variance
	varianceTool := mcp.NewTool("explain_variance",
		mcp.WithDescription("Calculate Price-Volume-Mix (PVM) mathematical variance breakdown between baseline and comparison scenarios."),
		mcp.WithString("metric_name", mcp.Required(), mcp.Description("Metric identifier to analyze")),
		mcp.WithString("baseline_scenario", mcp.Required(), mcp.Description("Baseline scenario, e.g. budget")),
		mcp.WithString("comparison_scenario", mcp.Required(), mcp.Description("Comparison scenario, e.g. actual")),
	)
	f.server.AddTool(varianceTool, f.handleExplainVariance)

	// Tool 4: drilldown_transaction_ledger
	ledgerTool := mcp.NewTool("drilldown_transaction_ledger",
		mcp.WithDescription("Retrieve underlying general ledger journal lines for audit drill-down and zero-hallucination verification."),
		mcp.WithString("account_category", mcp.Description("Filter by category: Revenue, COGS, Opex, Asset, Liability")),
		mcp.WithString("scenario", mcp.Description("Filter by scenario: actual, budget, forecast")),
		mcp.WithNumber("limit", mcp.Description("Max rows to fetch (default 20)")),
	)
	f.server.AddTool(ledgerTool, f.handleDrilldownLedger)

	// Tool 5: simulate_whatif
	whatifTool := mcp.NewTool("simulate_whatif",
		mcp.WithDescription("Perform real-time sensitivity calculation on drivers and propagate cascaded impact on profit and runway."),
		mcp.WithString("driver_name", mcp.Required(), mcp.Description("Driver name, e.g. price_adjustment, churn_rate_delta")),
		mcp.WithNumber("delta_percent", mcp.Required(), mcp.Description("Percentage delta adjustment (e.g. 0.10 for +10%)")),
		mcp.WithNumber("base_revenue", mcp.Required(), mcp.Description("Base period revenue amount")),
	)
	f.server.AddTool(whatifTool, f.handleSimulateWhatIf)
}

func (f *FinMeshMCPServer) handleQueryMetric(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	metricName, err := req.RequireString("metric_name")
	if err != nil {
		return mcp.NewToolResultError("missing metric_name parameter"), nil
	}
	scenario := req.GetString("scenario", "actual")
	startDate := req.GetString("start_date", "")
	endDate := req.GetString("end_date", "")

	result, err := f.compiler.ExecuteMetric(ctx, model.MetricQuery{
		MetricName: metricName,
		Scenario:   scenario,
		StartDate:  startDate,
		EndDate:    endDate,
	})
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("metric execution failed: %v", err)), nil
	}

	bytes, _ := json.MarshalIndent(result, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleGetCatalog(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	categoryFilter := req.GetString("category", "")
	all := f.catalog.AllMetrics()

	var filtered []model.MetricDefinition
	for _, m := range all {
		if categoryFilter == "" || m.Category == categoryFilter {
			filtered = append(filtered, m)
		}
	}

	bytes, _ := json.MarshalIndent(filtered, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleExplainVariance(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	metricName, err := req.RequireString("metric_name")
	if err != nil {
		return mcp.NewToolResultError("missing metric_name parameter"), nil
	}
	baseline, err := req.RequireString("baseline_scenario")
	if err != nil {
		return mcp.NewToolResultError("missing baseline_scenario parameter"), nil
	}
	comparison, err := req.RequireString("comparison_scenario")
	if err != nil {
		return mcp.NewToolResultError("missing comparison_scenario parameter"), nil
	}

	breakdown, err := f.compiler.ExecuteVariance(ctx, metricName, baseline, comparison)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("variance calculation failed: %v", err)), nil
	}

	bytes, _ := json.MarshalIndent(breakdown, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleDrilldownLedger(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	category := req.GetString("account_category", "")
	scenario := req.GetString("scenario", "actual")
	limit := req.GetInt("limit", 20)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	query := fmt.Sprintf(`
		SELECT voucher_id, line_no, posting_date, account_code, account_name,
		       account_category, debit_amount, credit_amount, department_id, scenario
		FROM fact_general_ledger
		WHERE scenario = '%s'
	`, scenario)

	if category != "" {
		query += fmt.Sprintf(" AND account_category = '%s'", category)
	}
	query += fmt.Sprintf(" ORDER BY posting_date DESC, voucher_id LIMIT %d", limit)

	rows, err := f.db.Query(query)
	if err != nil {
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

	bytes, _ := json.MarshalIndent(results, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}

func (f *FinMeshMCPServer) handleSimulateWhatIf(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	driverName, err := req.RequireString("driver_name")
	if err != nil {
		return mcp.NewToolResultError("missing driver_name parameter"), nil
	}
	deltaPercent, err := req.RequireFloat("delta_percent")
	if err != nil {
		return mcp.NewToolResultError("missing delta_percent parameter"), nil
	}
	baseRevenue, err := req.RequireFloat("base_revenue")
	if err != nil {
		return mcp.NewToolResultError("missing base_revenue parameter"), nil
	}

	// Dynamic sensitivity simulation
	simulatedRevenue := math.Round(baseRevenue*(1.0+deltaPercent)*100) / 100
	revenueDelta := math.Round((simulatedRevenue-baseRevenue)*100) / 100

	simResponse := map[string]interface{}{
		"driver_name":       driverName,
		"delta_percent":     deltaPercent,
		"base_revenue":      baseRevenue,
		"simulated_revenue": simulatedRevenue,
		"revenue_delta":     revenueDelta,
		"status":            "success",
	}

	bytes, _ := json.MarshalIndent(simResponse, "", "  ")
	return mcp.NewToolResultText(string(bytes)), nil
}
