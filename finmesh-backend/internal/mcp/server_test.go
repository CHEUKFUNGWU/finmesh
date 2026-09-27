package mcp

import (
	"context"
	"testing"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

func TestMCPServerTools(t *testing.T) {
	db, err := storage.NewInMemoryDB()
	if err != nil {
		t.Fatalf("failed to create duckdb: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// Seed test data
	entries := []model.JournalEntry{
		{VoucherID: "ACT-01", LineNo: 1, PostingDate: time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Cash", AccountCategory: "Asset", DebitAmount: 100000, CreditAmount: 0, Scenario: "actual", BatchID: "b1"},
		{VoucherID: "ACT-01", LineNo: 2, PostingDate: time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Revenue", AccountCategory: "Revenue", DebitAmount: 0, CreditAmount: 100000, Scenario: "actual", BatchID: "b1"},
		{VoucherID: "BGT-01", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Cash", AccountCategory: "Asset", DebitAmount: 120000, CreditAmount: 0, Scenario: "budget", BatchID: "b1"},
		{VoucherID: "BGT-01", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Revenue", AccountCategory: "Revenue", DebitAmount: 0, CreditAmount: 120000, Scenario: "budget", BatchID: "b1"},
	}
	if err := db.InsertEntries(ctx, entries); err != nil {
		t.Fatalf("failed to insert entries: %v", err)
	}

	cat := semantic.NewCatalog()
	cat.RegisterMetric(model.MetricDefinition{
		Name:          "revenue",
		DisplayName:   "Revenue",
		Category:      "Revenue",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(credit_amount) - SUM(debit_amount)",
		DefaultFilter: "account_category = 'Revenue'",
	})

	compiler := semantic.NewCompiler(cat, db)
	s := NewFinMeshMCPServer(cat, compiler, db)

	// Test 1: Query metric
	reqQuery := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "query_financial_metric",
			Arguments: map[string]interface{}{
				"metric_name": "revenue",
				"scenario":    "actual",
				"period":      "2026-Q1",
			},
		},
	}
	resQuery, err := s.handleQueryMetric(ctx, reqQuery)
	if err != nil {
		t.Fatalf("query tool error: %v", err)
	}
	if resQuery.IsError {
		t.Fatalf("query tool returned error: %v", resQuery.Content)
	}

	// Test 2: Explain variance
	reqVar := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "explain_variance",
			Arguments: map[string]interface{}{
				"metric_name": "revenue",
				"baseline":    "budget",
				"comparison":  "actual",
				"period":      "2026-Q1",
			},
		},
	}
	resVar, err := s.handleExplainVariance(ctx, reqVar)
	if err != nil {
		t.Fatalf("variance tool error: %v", err)
	}
	if resVar.IsError {
		t.Fatalf("variance tool returned error: %v", resVar.Content)
	}

	// Test 3: Simulate What-If
	reqSim := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "simulate_whatif",
			Arguments: map[string]interface{}{
				"scenario_id": "sim-q1-growth",
				"adjustments": `{"price_lift": 0.10, "churn_rate": -0.02}`,
			},
		},
	}
	resSim, err := s.handleSimulateWhatIf(ctx, reqSim)
	if err != nil {
		t.Fatalf("simulate tool error: %v", err)
	}
	if resSim.IsError {
		t.Fatalf("simulate tool returned error: %v", resSim.Content)
	}

	// Test 3b: Simulate What-If with native map object
	reqSimObj := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "simulate_whatif",
			Arguments: map[string]interface{}{
				"scenario_id": "actual",
				"adjustments": map[string]interface{}{
					"price_lift": 0.05,
					"churn_rate": 0.01,
				},
			},
		},
	}
	resSimObj, err := s.handleSimulateWhatIf(ctx, reqSimObj)
	if err != nil {
		t.Fatalf("simulate tool object error: %v", err)
	}
	if resSimObj.IsError {
		t.Fatalf("simulate tool object returned error: %v", resSimObj.Content)
	}

	// Test 4: Drilldown ledger
	reqDrill := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "drilldown_transaction_ledger",
			Arguments: map[string]interface{}{
				"metric_name": "revenue",
				"period":      "2026-Q1",
				"scenario":    "actual",
				"limit":       5,
			},
		},
	}
	resDrill, err := s.handleDrilldownLedger(ctx, reqDrill)
	if err != nil {
		t.Fatalf("drilldown tool error: %v", err)
	}
	if resDrill.IsError {
		t.Fatalf("drilldown tool returned error: %v", resDrill.Content)
	}

	// Test 5: Month-End query (2026-01) including entries through Jan 31
	reqMonth := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name: "drilldown_transaction_ledger",
			Arguments: map[string]interface{}{
				"metric_name": "revenue",
				"period":      "2026-01",
				"scenario":    "actual",
				"limit":       5,
			},
		},
	}
	resMonth, err := s.handleDrilldownLedger(ctx, reqMonth)
	if err != nil {
		t.Fatalf("month-end drilldown error: %v", err)
	}
	if resMonth.IsError {
		t.Fatalf("month-end drilldown returned error: %v", resMonth.Content)
	}
}

