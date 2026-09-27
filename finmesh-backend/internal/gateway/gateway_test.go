package gateway

import (
	"context"
	"testing"
	"time"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

func TestModelGatewayVarianceMemo(t *testing.T) {
	db, err := storage.NewInMemoryDB()
	if err != nil {
		t.Fatalf("failed creating test db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// Seed actual and budget data
	actuals := []model.JournalEntry{
		{
			VoucherID:       "ACT-1",
			LineNo:          1,
			PostingDate:     time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC),
			AccountCode:     "6001",
			AccountName:     "Revenue",
			AccountCategory: "Revenue",
			DebitAmount:     0.0,
			CreditAmount:    120000.0,
			Scenario:        "actual",
			BatchID:         "b1",
		},
		{
			VoucherID:       "ACT-1",
			LineNo:          2,
			PostingDate:     time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC),
			AccountCode:     "5001",
			AccountName:     "COGS",
			AccountCategory: "COGS",
			DebitAmount:     30000.0,
			CreditAmount:    0.0,
			Scenario:        "actual",
			BatchID:         "b1",
		},
	}
	budgets := []model.JournalEntry{
		{
			VoucherID:       "BUD-1",
			LineNo:          1,
			PostingDate:     time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
			AccountCode:     "6001",
			AccountName:     "Revenue",
			AccountCategory: "Revenue",
			DebitAmount:     0.0,
			CreditAmount:    100000.0,
			Scenario:        "budget",
			BatchID:         "b1",
		},
		{
			VoucherID:       "BUD-1",
			LineNo:          2,
			PostingDate:     time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
			AccountCode:     "5001",
			AccountName:     "COGS",
			AccountCategory: "COGS",
			DebitAmount:     25000.0,
			CreditAmount:    0.0,
			Scenario:        "budget",
			BatchID:         "b1",
		},
	}

	if err := db.InsertEntries(ctx, actuals); err != nil {
		t.Fatalf("failed inserting actuals: %v", err)
	}
	if err := db.InsertEntries(ctx, budgets); err != nil {
		t.Fatalf("failed inserting budgets: %v", err)
	}

	cat := semantic.NewCatalog()
	cat.RegisterMetric(model.MetricDefinition{
		Name:          "revenue",
		DisplayName:   "Revenue",
		Category:      "Revenue",
		Formula:       "SUM(credit_amount) - SUM(debit_amount)",
		DefaultFilter: "account_category = 'Revenue'",
	})
	cat.RegisterMetric(model.MetricDefinition{
		Name:          "cogs",
		DisplayName:   "COGS",
		Category:      "Profitability",
		Formula:       "SUM(debit_amount) - SUM(credit_amount)",
		DefaultFilter: "account_category = 'COGS'",
	})
	cat.RegisterMetric(model.MetricDefinition{
		Name:        "gross_profit",
		DisplayName: "Gross Profit",
		Category:    "Profitability",
		Formula:     "revenue - cogs",
		DependsOn:   []string{"revenue", "cogs"},
	})

	compiler := semantic.NewCompiler(cat, db)

	gw := NewModelGateway(GatewayConfig{
		Provider: ProviderOpenAICompatible,
		BaseURL:  "https://api.openai.com/v1",
		Model:    "gpt-4o",
	}, compiler)

	resp, err := gw.GenerateVarianceMemo(ctx, MemoRequest{
		Period:           "2026-Q1",
		BaselineScenario: "budget",
		CompScenario:     "actual",
		FocusMetrics:     []string{"revenue", "cogs", "gross_profit"},
	})

	if err != nil {
		t.Fatalf("GenerateVarianceMemo failed: %v", err)
	}

	if len(resp.MetricTokens) != 3 {
		t.Errorf("expected 3 metric tokens, got %d", len(resp.MetricTokens))
	}

	// Verify Revenue variance = 120000 - 100000 = +20000
	if resp.MetricTokens[0].NumericValue != 20000.0 {
		t.Errorf("expected revenue variance 20000, got %v", resp.MetricTokens[0].NumericValue)
	}

	// Verify Gross Profit variance = (120000-30000) - (100000-25000) = 90000 - 75000 = +15000
	if resp.MetricTokens[2].NumericValue != 15000.0 {
		t.Errorf("expected gross profit variance 15000, got %v", resp.MetricTokens[2].NumericValue)
	}
}
