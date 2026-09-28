package industry

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

// IndustryPack encapsulates a domain-specific financial model, chart of accounts, and trial-balanced vouchers.
type IndustryPack struct {
	ID             string                   `json:"id"`
	Name           string                   `json:"name"`
	DisplayName    string                   `json:"display_name"`
	Description    string                   `json:"description"`
	Icon           string                   `json:"icon"`
	PrimaryMetric  string                   `json:"primary_metric"`
	Metrics        []model.MetricDefinition `json:"metrics"`
	JournalEntries []model.JournalEntry     `json:"journal_entries"`
}

// SwitchResult returns the confirmation of an industry switch operation.
type SwitchResult struct {
	Status        string                   `json:"status"`
	IndustryID    string                   `json:"industry_id"`
	IndustryName  string                   `json:"industry_name"`
	TrialBalance  model.TrialBalanceResult `json:"trial_balance"`
	MetricsCount  int                      `json:"metrics_count"`
	EntriesCount  int                      `json:"entries_count"`
	EffectiveDate string                   `json:"effective_date"`
}

// Registry holds all available industry packs.
var Registry = map[string]func() IndustryPack{
	"general":   GeneralPack,
	"saas":      SaaSPack,
	"ecommerce": EcommercePack,
	"retail":    RetailPack,
}

// ListPacks returns metadata for all available industry packs.
func ListPacks() []IndustryPack {
	packs := []IndustryPack{
		GeneralPack(),
		SaaSPack(),
		EcommercePack(),
		RetailPack(),
	}
	// Omit heavy journal entries in summary listing
	res := make([]IndustryPack, len(packs))
	for i, p := range packs {
		res[i] = IndustryPack{
			ID:            p.ID,
			Name:          p.Name,
			DisplayName:   p.DisplayName,
			Description:   p.Description,
			Icon:          p.Icon,
			PrimaryMetric: p.PrimaryMetric,
			Metrics:       p.Metrics,
		}
	}
	return res
}

// LoadPack switches the active industry:
// 1. Clears existing demo entries in fact_general_ledger.
// 2. Inserts balanced journal entries for actual and budget.
// 3. Verifies strict double-entry trial balance (ABS(Debits - Credits) < 0.001).
// 4. Clears and registers the industry's metrics in the semantic catalog.
func LoadPack(ctx context.Context, industryID string, catalog *semantic.Catalog, db *storage.DB) (*SwitchResult, error) {
	packFn, exists := Registry[industryID]
	if !exists {
		return nil, fmt.Errorf("industry pack '%s' not found", industryID)
	}
	pack := packFn()

	// 1. Verify trial balance of journal entries before inserting
	var totalDebit, totalCredit float64
	for _, entry := range pack.JournalEntries {
		totalDebit += entry.DebitAmount
		totalCredit += entry.CreditAmount
	}
	discrepancy := math.Abs(totalDebit - totalCredit)
	if discrepancy > 0.001 {
		return nil, fmt.Errorf("industry pack '%s' fails trial balance: debits=%.2f, credits=%.2f, diff=%.4f",
			industryID, totalDebit, totalCredit, discrepancy)
	}

	// 2. Clear previous entries
	if _, err := db.ExecContext(ctx, "DELETE FROM fact_general_ledger;"); err != nil {
		return nil, fmt.Errorf("failed to clear fact_general_ledger: %w", err)
	}

	// 3. Insert new balanced entries
	if err := db.InsertEntries(ctx, pack.JournalEntries); err != nil {
		return nil, fmt.Errorf("failed to insert journal entries: %w", err)
	}

	// 4. Update semantic catalog
	catalog.Clear()
	for _, m := range pack.Metrics {
		catalog.RegisterMetric(m)
	}
	if _, err := catalog.TopologicalSort(); err != nil {
		return nil, fmt.Errorf("failed to sort metrics for industry '%s': %w", industryID, err)
	}

	tbResult := model.TrialBalanceResult{
		TotalDebits:  totalDebit,
		TotalCredits: totalCredit,
		Difference:   discrepancy,
		IsBalanced:   discrepancy <= 0.001,
		RowCount:     len(pack.JournalEntries),
	}

	return &SwitchResult{
		Status:        "ok",
		IndustryID:    pack.ID,
		IndustryName:  pack.DisplayName,
		TrialBalance:  tbResult,
		MetricsCount:  len(pack.Metrics),
		EntriesCount:  len(pack.JournalEntries),
		EffectiveDate: time.Now().Format("2006-01-02"),
	}, nil
}

// GeneralPack provides standard corporate FP&A baseline.
func GeneralPack() IndustryPack {
	entries := []model.JournalEntry{
		// Actual Q1
		{VoucherID: "GEN-ACT-001", LineNo: 1, PostingDate: time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 1250000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "gen_seed"},
		{VoucherID: "GEN-ACT-001", LineNo: 2, PostingDate: time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "Operating Revenue", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 1250000.0, Scenario: "actual", BatchID: "gen_seed"},

		{VoucherID: "GEN-ACT-002", LineNo: 1, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Cost of Goods Sold", AccountCategory: "COGS", DebitAmount: 525000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "gen_seed"},
		{VoucherID: "GEN-ACT-002", LineNo: 2, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 525000.0, Scenario: "actual", BatchID: "gen_seed"},

		{VoucherID: "GEN-ACT-003", LineNo: 1, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Operating Expenses (OpEx)", AccountCategory: "Opex", DebitAmount: 410000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "gen_seed"},
		{VoucherID: "GEN-ACT-003", LineNo: 2, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 410000.0, Scenario: "actual", BatchID: "gen_seed"},

		// Budget Q1
		{VoucherID: "GEN-BGT-001", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 1375000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "gen_seed"},
		{VoucherID: "GEN-BGT-001", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "Operating Revenue", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 1375000.0, Scenario: "budget", BatchID: "gen_seed"},

		{VoucherID: "GEN-BGT-002", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Cost of Goods Sold", AccountCategory: "COGS", DebitAmount: 555000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "gen_seed"},
		{VoucherID: "GEN-BGT-002", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 555000.0, Scenario: "budget", BatchID: "gen_seed"},

		{VoucherID: "GEN-BGT-003", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Operating Expenses (OpEx)", AccountCategory: "Opex", DebitAmount: 450000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "gen_seed"},
		{VoucherID: "GEN-BGT-003", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 450000.0, Scenario: "budget", BatchID: "gen_seed"},
	}

	metrics := []model.MetricDefinition{
		{Name: "revenue", DisplayName: "Total Revenue", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount) - SUM(debit_amount)", DefaultFilter: "account_category = 'Revenue'"},
		{Name: "cogs", DisplayName: "Cost of Goods Sold", Category: "COGS", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_category = 'COGS'"},
		{Name: "opex", DisplayName: "Operating Expenses", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_category = 'Opex'"},
		{Name: "gross_profit", DisplayName: "Gross Profit", Category: "Profitability", Formula: "revenue - cogs", DependsOn: []string{"revenue", "cogs"}},
		{Name: "net_income", DisplayName: "Net Income", Category: "Profitability", Formula: "gross_profit - opex", DependsOn: []string{"gross_profit", "opex"}},
	}

	return IndustryPack{
		ID:             "general",
		Name:           "General Corporate FP&A",
		DisplayName:    "通用财务损益 (General FP&A)",
		Description:    "标准企业权责发生制损益模型，涵盖营业收入、营业成本、毛利、费用与净利润。",
		Icon:           "Layers",
		PrimaryMetric:  "revenue",
		Metrics:        metrics,
		JournalEntries: entries,
	}
}

// SaaSPack provides enterprise B2B SaaS recurring revenue and unit economics.
func SaaSPack() IndustryPack {
	entries := []model.JournalEntry{
		// Actual Q1: ARR = $2.4M (Sub: $2.1M, Services: $0.3M), Cloud COGS = $320k, Staff COGS = $160k, S&M = $720k, R&D = $520k, G&A = $200k
		{VoucherID: "SAS-ACT-001", LineNo: 1, PostingDate: time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 2100000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "saas_seed"},
		{VoucherID: "SAS-ACT-001", LineNo: 2, PostingDate: time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "SaaS Subscription ARR", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 2100000.0, Scenario: "actual", BatchID: "saas_seed"},

		{VoucherID: "SAS-ACT-002", LineNo: 1, PostingDate: time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 300000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "saas_seed"},
		{VoucherID: "SAS-ACT-002", LineNo: 2, PostingDate: time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC), AccountCode: "4002", AccountName: "Implementation & Advisory Services", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 300000.0, Scenario: "actual", BatchID: "saas_seed"},

		{VoucherID: "SAS-ACT-003", LineNo: 1, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Cloud Infrastructure (AWS/GCP)", AccountCategory: "COGS", DebitAmount: 320000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "saas_seed"},
		{VoucherID: "SAS-ACT-003", LineNo: 2, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 320000.0, Scenario: "actual", BatchID: "saas_seed"},

		{VoucherID: "SAS-ACT-004", LineNo: 1, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "5002", AccountName: "Customer Success & Implementation", AccountCategory: "COGS", DebitAmount: 160000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "saas_seed"},
		{VoucherID: "SAS-ACT-004", LineNo: 2, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 160000.0, Scenario: "actual", BatchID: "saas_seed"},

		{VoucherID: "SAS-ACT-005", LineNo: 1, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Sales & Marketing (S&M CAC)", AccountCategory: "Opex", DebitAmount: 720000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "saas_seed"},
		{VoucherID: "SAS-ACT-005", LineNo: 2, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 720000.0, Scenario: "actual", BatchID: "saas_seed"},

		{VoucherID: "SAS-ACT-006", LineNo: 1, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "6002", AccountName: "Research & Development (R&D)", AccountCategory: "Opex", DebitAmount: 520000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "saas_seed"},
		{VoucherID: "SAS-ACT-006", LineNo: 2, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 520000.0, Scenario: "actual", BatchID: "saas_seed"},

		{VoucherID: "SAS-ACT-007", LineNo: 1, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "6003", AccountName: "General & Administrative (G&A)", AccountCategory: "Opex", DebitAmount: 200000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "saas_seed"},
		{VoucherID: "SAS-ACT-007", LineNo: 2, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 200000.0, Scenario: "actual", BatchID: "saas_seed"},

		// Budget Q1: ARR = $2.6M (Sub: $2.3M, Serv: $0.3M), Cloud COGS = $340k, Staff = $160k, S&M = $800k, R&D = $550k, G&A = $200k
		{VoucherID: "SAS-BGT-001", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 2600000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "saas_seed"},
		{VoucherID: "SAS-BGT-001", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "SaaS Subscription ARR", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 2600000.0, Scenario: "budget", BatchID: "saas_seed"},

		{VoucherID: "SAS-BGT-002", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Cloud Infrastructure (AWS/GCP)", AccountCategory: "COGS", DebitAmount: 500000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "saas_seed"},
		{VoucherID: "SAS-BGT-002", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 500000.0, Scenario: "budget", BatchID: "saas_seed"},

		{VoucherID: "SAS-BGT-003", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Sales & Marketing (S&M CAC)", AccountCategory: "Opex", DebitAmount: 1550000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "saas_seed"},
		{VoucherID: "SAS-BGT-003", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Operating Cash / Bank", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 1550000.0, Scenario: "budget", BatchID: "saas_seed"},
	}

	metrics := []model.MetricDefinition{
		{Name: "arr", DisplayName: "Annual Recurring Revenue (ARR)", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount) - SUM(debit_amount)", DefaultFilter: "account_code = '4001'"},
		{Name: "services_rev", DisplayName: "Implementation Revenue", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount) - SUM(debit_amount)", DefaultFilter: "account_code = '4002'"},
		{Name: "total_revenue", DisplayName: "Total Revenue", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount) - SUM(debit_amount)", DefaultFilter: "account_category = 'Revenue'"},
		{Name: "cloud_cogs", DisplayName: "Cloud Infrastructure COGS", Category: "COGS", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '5001'"},
		{Name: "total_cogs", DisplayName: "Total COGS", Category: "COGS", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_category = 'COGS'"},
		{Name: "sm_spend", DisplayName: "Sales & Marketing (S&M)", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '6001'"},
		{Name: "rd_spend", DisplayName: "Research & Development (R&D)", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '6002'"},
		{Name: "total_opex", DisplayName: "Total OpEx", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_category = 'Opex'"},
		{Name: "gross_profit", DisplayName: "Gross Profit", Category: "Profitability", Formula: "total_revenue - total_cogs", DependsOn: []string{"total_revenue", "total_cogs"}},
		{Name: "operating_income", DisplayName: "Operating Income (EBIT)", Category: "Profitability", Formula: "gross_profit - total_opex", DependsOn: []string{"gross_profit", "total_opex"}},
	}

	return IndustryPack{
		ID:             "saas",
		Name:           "Enterprise SaaS (B2B)",
		DisplayName:    "企业级 SaaS (Enterprise SaaS)",
		Description:    "经常性收入生命周期管理，聚焦 ARR Bridge、NRR、获客回本周期 (CAC Payback) 与云基础设施成本。",
		Icon:           "Sparkles",
		PrimaryMetric:  "arr",
		Metrics:        metrics,
		JournalEntries: entries,
	}
}

// EcommercePack provides DTC and E-commerce tiered contribution margins (CM1-CM3).
func EcommercePack() IndustryPack {
	entries := []model.JournalEntry{
		// Actual Q1: GMV = $3.8M, Returns = $760k (Net Sales = $3.04M), Product COGS = $1,216k (CM1 = $1,824k),
		// Fulfillment/Freight = $456k (CM2 = $1,368k), Ad Spend = $729.6k (CM3 = $638.4k), HQ OpEx = $380k, Profit = $258.4k
		{VoucherID: "ECM-ACT-001", LineNo: 1, PostingDate: time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 3040000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ecm_seed"},
		{VoucherID: "ECM-ACT-001", LineNo: 2, PostingDate: time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC), AccountCode: "4002", AccountName: "Returns & Refund Allowances", AccountCategory: "Revenue", DebitAmount: 760000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ecm_seed"},
		{VoucherID: "ECM-ACT-001", LineNo: 3, PostingDate: time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "Gross Merchandise Value (GMV)", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 3800000.0, Scenario: "actual", BatchID: "ecm_seed"},

		{VoucherID: "ECM-ACT-002", LineNo: 1, PostingDate: time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Purchased Inventory / First-leg Freight", AccountCategory: "COGS", DebitAmount: 1216000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ecm_seed"},
		{VoucherID: "ECM-ACT-002", LineNo: 2, PostingDate: time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 1216000.0, Scenario: "actual", BatchID: "ecm_seed"},

		{VoucherID: "ECM-ACT-003", LineNo: 1, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "5002", AccountName: "Warehousing, Packaging & Last-mile Freight", AccountCategory: "COGS", DebitAmount: 456000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ecm_seed"},
		{VoucherID: "ECM-ACT-003", LineNo: 2, PostingDate: time.Date(2026, 3, 20, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 456000.0, Scenario: "actual", BatchID: "ecm_seed"},

		{VoucherID: "ECM-ACT-004", LineNo: 1, PostingDate: time.Date(2026, 3, 25, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Performance Marketing Ad Spend", AccountCategory: "Opex", DebitAmount: 729600.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ecm_seed"},
		{VoucherID: "ECM-ACT-004", LineNo: 2, PostingDate: time.Date(2026, 3, 25, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 729600.0, Scenario: "actual", BatchID: "ecm_seed"},

		{VoucherID: "ECM-ACT-005", LineNo: 1, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "6002", AccountName: "General E-Commerce Platform OpEx", AccountCategory: "Opex", DebitAmount: 380000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ecm_seed"},
		{VoucherID: "ECM-ACT-005", LineNo: 2, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 380000.0, Scenario: "actual", BatchID: "ecm_seed"},

		// Budget Q1: GMV = $4.2M, Net Sales = $3.4M, COGS = $1.35M, Freight = $480k, Ads = $780k, OpEx = $400k
		{VoucherID: "ECM-BGT-001", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 3400000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "ecm_seed"},
		{VoucherID: "ECM-BGT-001", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "Gross Merchandise Value (GMV)", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 3400000.0, Scenario: "budget", BatchID: "ecm_seed"},

		{VoucherID: "ECM-BGT-002", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Purchased Inventory / First-leg Freight", AccountCategory: "COGS", DebitAmount: 1830000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "ecm_seed"},
		{VoucherID: "ECM-BGT-002", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 1830000.0, Scenario: "budget", BatchID: "ecm_seed"},

		{VoucherID: "ECM-BGT-003", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Performance Marketing Ad Spend", AccountCategory: "Opex", DebitAmount: 1180000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "ecm_seed"},
		{VoucherID: "ECM-BGT-003", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Payment Gateway / Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 1180000.0, Scenario: "budget", BatchID: "ecm_seed"},
	}

	metrics := []model.MetricDefinition{
		{Name: "gmv", DisplayName: "Gross Merchandise Value (GMV)", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount)", DefaultFilter: "account_code = '4001'"},
		{Name: "net_sales", DisplayName: "Net Delivered Sales", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount) - SUM(debit_amount)", DefaultFilter: "account_category = 'Revenue'"},
		{Name: "product_cogs", DisplayName: "Product COGS", Category: "COGS", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '5001'"},
		{Name: "fulfillment_cost", DisplayName: "Fulfillment & Last-mile Freight", Category: "COGS", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '5002'"},
		{Name: "ad_spend", DisplayName: "Performance Ad Spend", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '6001'"},
		{Name: "hq_opex", DisplayName: "HQ & System OpEx", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '6002'"},
		{Name: "cm1", DisplayName: "Contribution Margin 1 (CM1)", Category: "Profitability", Formula: "net_sales - product_cogs", DependsOn: []string{"net_sales", "product_cogs"}},
		{Name: "cm2", DisplayName: "Contribution Margin 2 (CM2)", Category: "Profitability", Formula: "cm1 - fulfillment_cost", DependsOn: []string{"cm1", "fulfillment_cost"}},
		{Name: "cm3", DisplayName: "Contribution Margin 3 (CM3)", Category: "Profitability", Formula: "cm2 - ad_spend", DependsOn: []string{"cm2", "ad_spend"}},
		{Name: "operating_profit", DisplayName: "Operating Profit", Category: "Profitability", Formula: "cm3 - hq_opex", DependsOn: []string{"cm3", "hq_opex"}},
	}

	return IndustryPack{
		ID:             "ecommerce",
		Name:           "E-Commerce & DTC",
		DisplayName:    "电商与 DTC (E-Commerce / DTC)",
		Description:    "多层阶梯贡献毛利模型 (CM1/CM2/CM3)，穿透解构流量投放 ROAS、履约仓配与退货逆向损耗。",
		Icon:           "ShoppingCart",
		PrimaryMetric:  "gmv",
		Metrics:        metrics,
		JournalEntries: entries,
	}
}

// RetailPack provides omnichannel FMCG and retail gross-to-net (GTN) governance.
func RetailPack() IndustryPack {
	entries := []model.JournalEntry{
		// Actual Q1: Gross Sales = $5.2M, Off-Invoice = $420k, Rebates = $310k, Promo/Scan-backs = $310k (Net = $4.16M),
		// Manufacturing COGS = $2.08M (GP = $2.08M), Store Fixed OpEx = $1,190k, HQ OpEx = $420k, Operating Income = $470k
		{VoucherID: "RET-ACT-001", LineNo: 1, PostingDate: time.Date(2026, 3, 12, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Commercial Bank Deposit", AccountCategory: "Asset", DebitAmount: 4160000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ret_seed"},
		{VoucherID: "RET-ACT-001", LineNo: 2, PostingDate: time.Date(2026, 3, 12, 0, 0, 0, 0, time.UTC), AccountCode: "4101", AccountName: "Off-Invoice Commercial Discounts", AccountCategory: "Revenue", DebitAmount: 420000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ret_seed"},
		{VoucherID: "RET-ACT-001", LineNo: 3, PostingDate: time.Date(2026, 3, 12, 0, 0, 0, 0, time.UTC), AccountCode: "4102", AccountName: "Channel Performance Rebates", AccountCategory: "Revenue", DebitAmount: 310000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ret_seed"},
		{VoucherID: "RET-ACT-001", LineNo: 4, PostingDate: time.Date(2026, 3, 12, 0, 0, 0, 0, time.UTC), AccountCode: "4103", AccountName: "Trade Promotions & Scan-backs", AccountCategory: "Revenue", DebitAmount: 310000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ret_seed"},
		{VoucherID: "RET-ACT-001", LineNo: 5, PostingDate: time.Date(2026, 3, 12, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "Gross Sales at List Price", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 5200000.0, Scenario: "actual", BatchID: "ret_seed"},

		{VoucherID: "RET-ACT-002", LineNo: 1, PostingDate: time.Date(2026, 3, 18, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Standard Production COGS & Raw Materials", AccountCategory: "COGS", DebitAmount: 2080000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ret_seed"},
		{VoucherID: "RET-ACT-002", LineNo: 2, PostingDate: time.Date(2026, 3, 18, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Commercial Bank Deposit", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 2080000.0, Scenario: "actual", BatchID: "ret_seed"},

		{VoucherID: "RET-ACT-003", LineNo: 1, PostingDate: time.Date(2026, 3, 25, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Store Rent & Frontline Staffing", AccountCategory: "Opex", DebitAmount: 1190000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ret_seed"},
		{VoucherID: "RET-ACT-003", LineNo: 2, PostingDate: time.Date(2026, 3, 25, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Commercial Bank Deposit", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 1190000.0, Scenario: "actual", BatchID: "ret_seed"},

		{VoucherID: "RET-ACT-004", LineNo: 1, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "6002", AccountName: "Headquarters & Supply Chain OpEx", AccountCategory: "Opex", DebitAmount: 420000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "ret_seed"},
		{VoucherID: "RET-ACT-004", LineNo: 2, PostingDate: time.Date(2026, 3, 31, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Commercial Bank Deposit", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 420000.0, Scenario: "actual", BatchID: "ret_seed"},

		// Budget Q1: Gross Sales = $5.5M, Net = $4.4M, COGS = $2.2M, Store OpEx = $1.2M, HQ OpEx = $450k
		{VoucherID: "RET-BGT-001", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Commercial Bank Deposit", AccountCategory: "Asset", DebitAmount: 4400000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "ret_seed"},
		{VoucherID: "RET-BGT-001", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "4001", AccountName: "Gross Sales at List Price", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 4400000.0, Scenario: "budget", BatchID: "ret_seed"},

		{VoucherID: "RET-BGT-002", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "5001", AccountName: "Standard Production COGS & Raw Materials", AccountCategory: "COGS", DebitAmount: 2200000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "ret_seed"},
		{VoucherID: "RET-BGT-002", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Commercial Bank Deposit", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 2200000.0, Scenario: "budget", BatchID: "ret_seed"},

		{VoucherID: "RET-BGT-003", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "Store Rent & Frontline Staffing", AccountCategory: "Opex", DebitAmount: 1650000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "ret_seed"},
		{VoucherID: "RET-BGT-003", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Commercial Bank Deposit", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 1650000.0, Scenario: "budget", BatchID: "ret_seed"},
	}

	metrics := []model.MetricDefinition{
		{Name: "gross_sales", DisplayName: "Gross Sales (List Price)", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount)", DefaultFilter: "account_code = '4001'"},
		{Name: "trade_discounts", DisplayName: "Off-Invoice Trade Discounts", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount)", DefaultFilter: "account_code = '4101'"},
		{Name: "rebates", DisplayName: "Channel Performance Rebates", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount)", DefaultFilter: "account_code = '4102'"},
		{Name: "scan_backs", DisplayName: "Trade Promotions & Scan-backs", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount)", DefaultFilter: "account_code = '4103'"},
		{Name: "net_sales", DisplayName: "Net Revenue (GTN)", Category: "Revenue", BaseTable: "fact_general_ledger", Formula: "SUM(credit_amount) - SUM(debit_amount)", DefaultFilter: "account_category = 'Revenue'"},
		{Name: "cogs", DisplayName: "Standard Production COGS", Category: "COGS", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_category = 'COGS'"},
		{Name: "store_opex", DisplayName: "Store Fixed OpEx (Rent & Staff)", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '6001'"},
		{Name: "hq_opex", DisplayName: "Headquarters OpEx", Category: "Opex", BaseTable: "fact_general_ledger", Formula: "SUM(debit_amount) - SUM(credit_amount)", DefaultFilter: "account_code = '6002'"},
		{Name: "gross_profit", DisplayName: "Gross Profit", Category: "Profitability", Formula: "net_sales - cogs", DependsOn: []string{"net_sales", "cogs"}},
		{Name: "operating_income", DisplayName: "Operating Income", Category: "Profitability", Formula: "gross_profit - store_opex - hq_opex", DependsOn: []string{"gross_profit", "store_opex", "hq_opex"}},
	}

	return IndustryPack{
		ID:             "retail",
		Name:           "Omnichannel Retail & FMCG",
		DisplayName:    "连锁零售与快消 (Retail / FMCG)",
		Description:    "毛利瀑布流 GTN 贸易支出治理（票面即时折让、阶梯返点、扫码促销）与单店模型监控。",
		Icon:           "Store",
		PrimaryMetric:  "gross_sales",
		Metrics:        metrics,
		JournalEntries: entries,
	}
}
