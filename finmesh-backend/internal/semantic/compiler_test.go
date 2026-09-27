package semantic

import (
	"context"
	"testing"
	"time"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

func TestCatalogTopologicalSort(t *testing.T) {
	yamlContent := `
version: 1
metrics:
  - name: revenue
    display_name: Revenue
    category: Revenue
    formula: "SUM(credit_amount) - SUM(debit_amount)"
    default_filter: "account_category = 'Revenue'"

  - name: cogs
    display_name: Cost of Goods Sold
    category: Profitability
    formula: "SUM(debit_amount) - SUM(credit_amount)"
    default_filter: "account_category = 'COGS'"

  - name: gross_profit
    display_name: Gross Profit
    category: Profitability
    formula: "revenue - cogs"
    depends_on: [revenue, cogs]
`
	cat, err := LoadYAML([]byte(yamlContent))
	if err != nil {
		t.Fatalf("failed to load valid yaml: %v", err)
	}

	order, err := cat.TopologicalSort()
	if err != nil {
		t.Fatalf("unexpected error sorting dag: %v", err)
	}

	// gross_profit must appear after both revenue and cogs
	posRevenue := -1
	posCOGS := -1
	posGP := -1

	for idx, name := range order {
		if name == "revenue" {
			posRevenue = idx
		}
		if name == "cogs" {
			posCOGS = idx
		}
		if name == "gross_profit" {
			posGP = idx
		}
	}

	if posGP < posRevenue || posGP < posCOGS {
		t.Errorf("gross_profit index (%d) should be after revenue (%d) and cogs (%d)", posGP, posRevenue, posCOGS)
	}
}

func TestCatalogCycleDetection(t *testing.T) {
	yamlCycle := `
version: 1
metrics:
  - name: metric_a
    formula: "metric_b + 1"
    depends_on: [metric_b]

  - name: metric_b
    formula: "metric_a + 1"
    depends_on: [metric_a]
`
	_, err := LoadYAML([]byte(yamlCycle))
	if err == nil {
		t.Fatal("expected cycle detection error, got nil")
	}
}

func TestCompilerExecuteMetric(t *testing.T) {
	db, err := storage.NewInMemoryDB()
	if err != nil {
		t.Fatalf("failed to create in-memory duckdb: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	entries := []model.JournalEntry{
		{
			VoucherID:       "V1",
			LineNo:          1,
			PostingDate:     time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC),
			AccountCode:     "1001",
			AccountName:     "Cash",
			AccountCategory: "Asset",
			DebitAmount:     100000.0,
			CreditAmount:    0.0,
			Scenario:        "actual",
			BatchID:         "b1",
		},
		{
			VoucherID:       "V1",
			LineNo:          2,
			PostingDate:     time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC),
			AccountCode:     "6001",
			AccountName:     "Subscription Revenue",
			AccountCategory: "Revenue",
			DebitAmount:     0.0,
			CreditAmount:    100000.0,
			Scenario:        "actual",
			BatchID:         "b1",
		},
		{
			VoucherID:       "V2",
			LineNo:          1,
			PostingDate:     time.Date(2026, 1, 12, 0, 0, 0, 0, time.UTC),
			AccountCode:     "6401",
			AccountName:     "Cloud Hosting",
			AccountCategory: "COGS",
			DebitAmount:     25000.0,
			CreditAmount:    0.0,
			Scenario:        "actual",
			BatchID:         "b1",
		},
		{
			VoucherID:       "V2",
			LineNo:          2,
			PostingDate:     time.Date(2026, 1, 12, 0, 0, 0, 0, time.UTC),
			AccountCode:     "1001",
			AccountName:     "Cash",
			AccountCategory: "Asset",
			DebitAmount:     0.0,
			CreditAmount:    25000.0,
			Scenario:        "actual",
			BatchID:         "b1",
		},
	}

	if err := db.InsertEntries(ctx, entries); err != nil {
		t.Fatalf("failed to insert test entries: %v", err)
	}

	cat := NewCatalog()
	cat.RegisterMetric(model.MetricDefinition{
		Name:          "revenue",
		DisplayName:   "Total Revenue",
		Category:      "Revenue",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(credit_amount) - SUM(debit_amount)",
		DefaultFilter: "account_category = 'Revenue'",
	})
	cat.RegisterMetric(model.MetricDefinition{
		Name:          "cogs",
		DisplayName:   "Cost of Goods Sold",
		Category:      "Profitability",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(debit_amount) - SUM(credit_amount)",
		DefaultFilter: "account_category = 'COGS'",
	})

	compiler := NewCompiler(cat, db)

	// Test Revenue
	revRes, err := compiler.ExecuteMetric(ctx, model.MetricQuery{
		MetricName: "revenue",
		Scenario:   "actual",
	})
	if err != nil {
		t.Fatalf("failed to query revenue: %v", err)
	}
	if revRes.Value != 100000.0 {
		t.Errorf("expected revenue 100000, got %v", revRes.Value)
	}

	// Test Derived Metric: gross_profit = revenue - cogs
	cat.RegisterMetric(model.MetricDefinition{
		Name:        "gross_profit",
		DisplayName: "Gross Profit",
		Category:    "Profitability",
		Formula:     "revenue - cogs",
		DependsOn:   []string{"revenue", "cogs"},
	})

	gpRes, err := compiler.ExecuteMetric(ctx, model.MetricQuery{
		MetricName: "gross_profit",
		Scenario:   "actual",
	})
	if err != nil {
		t.Fatalf("failed to query derived gross_profit: %v", err)
	}
	if gpRes.Value != 75000.0 {
		t.Errorf("expected gross_profit 75000, got %v", gpRes.Value)
	}

	// Test Malicious Input Rejection
	_, err = compiler.ExecuteMetric(ctx, model.MetricQuery{
		MetricName: "revenue",
		Scenario:   "actual'; DROP TABLE fact_general_ledger; --",
	})
	if err == nil {
		t.Error("expected error on malicious scenario input, got nil")
	}
}
