package industry_test

import (
	"context"
	"math"
	"testing"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/industry"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

func TestIndustryPacks_DoubleEntryTrialBalance(t *testing.T) {
	packs := []industry.IndustryPack{
		industry.GeneralPack(),
		industry.SaaSPack(),
		industry.EcommercePack(),
		industry.RetailPack(),
	}

	for _, p := range packs {
		t.Run(p.ID, func(t *testing.T) {
			if len(p.JournalEntries) == 0 {
				t.Fatalf("industry pack '%s' has 0 journal entries", p.ID)
			}

			// 1. Check double entry balance across actual and budget
			actualDebit, actualCredit := 0.0, 0.0
			budgetDebit, budgetCredit := 0.0, 0.0

			for _, e := range p.JournalEntries {
				if e.Scenario == "actual" {
					actualDebit += e.DebitAmount
					actualCredit += e.CreditAmount
				} else if e.Scenario == "budget" {
					budgetDebit += e.DebitAmount
					budgetCredit += e.CreditAmount
				}
			}

			actualDiff := math.Abs(actualDebit - actualCredit)
			if actualDiff > 0.001 {
				t.Errorf("industry pack '%s' actuals unbalanced: debits=%.2f, credits=%.2f, diff=%.4f",
					p.ID, actualDebit, actualCredit, actualDiff)
			}

			budgetDiff := math.Abs(budgetDebit - budgetCredit)
			if budgetDiff > 0.001 {
				t.Errorf("industry pack '%s' budget unbalanced: debits=%.2f, credits=%.2f, diff=%.4f",
					p.ID, budgetDebit, budgetCredit, budgetDiff)
			}

			// 2. Validate DAG of metrics
			catalog := semantic.NewCatalog()
			for _, m := range p.Metrics {
				catalog.RegisterMetric(m)
			}
			sorted, err := catalog.TopologicalSort()
			if err != nil {
				t.Errorf("industry pack '%s' metrics DAG has cycles or errors: %v", p.ID, err)
			}
			if len(sorted) != len(p.Metrics) {
				t.Errorf("industry pack '%s' sorted length %d != metrics count %d",
					p.ID, len(sorted), len(p.Metrics))
			}
		})
	}
}

func TestLoadPack_Integration(t *testing.T) {
	db, err := storage.NewInMemoryDB()
	if err != nil {
		t.Fatalf("failed to create in-memory db: %v", err)
	}
	defer db.Close()

	catalog := semantic.NewCatalog()
	ctx := context.Background()

	// Switch to SaaS pack
	res, err := industry.LoadPack(ctx, "saas", catalog, db)
	if err != nil {
		t.Fatalf("failed to load saas pack: %v", err)
	}
	if !res.TrialBalance.IsBalanced {
		t.Errorf("expected trial balance to be balanced, got %+v", res.TrialBalance)
	}
	if res.IndustryID != "saas" {
		t.Errorf("expected industry saas, got %s", res.IndustryID)
	}

	// Verify catalog has 'arr'
	m, ok := catalog.GetMetric("arr")
	if !ok {
		t.Errorf("expected metric 'arr' to be present in catalog")
	} else if m.Category != "Revenue" {
		t.Errorf("expected ARR category to be Revenue, got %s", m.Category)
	}

	// Switch to Ecommerce pack
	ecmRes, err := industry.LoadPack(ctx, "ecommerce", catalog, db)
	if err != nil {
		t.Fatalf("failed to load ecommerce pack: %v", err)
	}
	if !ecmRes.TrialBalance.IsBalanced {
		t.Errorf("expected ecommerce trial balance to be balanced")
	}

	// Verify old 'arr' is replaced by 'gmv'
	_, hasArr := catalog.GetMetric("arr")
	if hasArr {
		t.Errorf("expected 'arr' to be cleared after switching to ecommerce")
	}
	_, hasGmv := catalog.GetMetric("gmv")
	if !hasGmv {
		t.Errorf("expected 'gmv' to be present after switching to ecommerce")
	}
}
