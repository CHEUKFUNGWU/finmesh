package model

import "time"

// JournalEntry represents a standardized fact line in the general ledger (FactGeneralLedger).
type JournalEntry struct {
	VoucherID       string    `json:"voucher_id"`
	LineNo          int       `json:"line_no"`
	PostingDate     time.Time `json:"posting_date"`
	AccountCode     string    `json:"account_code"`
	AccountName     string    `json:"account_name"`
	AccountCategory string    `json:"account_category"` // Asset, Liability, Equity, Revenue, COGS, Opex
	DebitAmount     float64   `json:"debit_amount"`
	CreditAmount    float64   `json:"credit_amount"`
	DepartmentID    string    `json:"department_id,omitempty"`
	EntityID        string    `json:"entity_id,omitempty"`
	Scenario        string    `json:"scenario"` // actual, budget, forecast
	BatchID         string    `json:"batch_id"`
}

// TrialBalanceResult captures the validation outcome of ingested vouchers.
type TrialBalanceResult struct {
	TotalDebits        float64  `json:"total_debits"`
	TotalCredits       float64  `json:"total_credits"`
	Difference         float64  `json:"difference"`
	IsBalanced         bool     `json:"is_balanced"`
	VoucherCount       int      `json:"voucher_count"`
	RowCount           int      `json:"row_count"`
	UnbalancedVouchers []string `json:"unbalanced_vouchers,omitempty"`
}

// MetricDefinition defines a declarative financial metric in the semantic catalog.
type MetricDefinition struct {
	Name          string   `yaml:"name" json:"name"`
	DisplayName   string   `yaml:"display_name" json:"display_name"`
	Category      string   `yaml:"category" json:"category"` // Revenue, Profitability, Opex, KPI
	BaseTable     string   `yaml:"base_table" json:"base_table"`
	Formula       string   `yaml:"formula" json:"formula"`
	DefaultFilter string   `yaml:"default_filter,omitempty" json:"default_filter,omitempty"`
	Dimensions    []string `yaml:"dimensions,omitempty" json:"dimensions,omitempty"`
	DependsOn     []string `yaml:"depends_on,omitempty" json:"depends_on,omitempty"`
}

// MetricCatalogSchema wraps the YAML catalog structure.
type MetricCatalogSchema struct {
	Version int                `yaml:"version" json:"version"`
	Metrics []MetricDefinition `yaml:"metrics" json:"metrics"`
}

// MetricQuery represents a query request against the semantic engine.
type MetricQuery struct {
	MetricName string   `json:"metric_name"`
	Scenario   string   `json:"scenario"`
	StartDate  string   `json:"start_date,omitempty"`
	EndDate    string   `json:"end_date,omitempty"`
	Dimensions []string `json:"dimensions,omitempty"`
}

// MetricResult represents the calculated outcome.
type MetricResult struct {
	MetricName  string                 `json:"metric_name"`
	DisplayName string                 `json:"display_name"`
	Value       float64                `json:"value"`
	Dimensions  map[string]interface{} `json:"dimensions,omitempty"`
	SQLQuery    string                 `json:"sql_query"`
}

// VarianceBreakdown represents the PVM decomposition result.
type VarianceBreakdown struct {
	MetricName      string  `json:"metric_name"`
	BaselineValue   float64 `json:"baseline_value"`
	ComparisonValue float64 `json:"comparison_value"`
	TotalVariance   float64 `json:"total_variance"`
	VolumeVariance  float64 `json:"volume_variance"`
	PriceVariance   float64 `json:"price_variance"`
	CostVariance    float64 `json:"cost_variance"`
	Unexplained     float64 `json:"unexplained"`
}

// PVMInputs allows passing operational driver factors for exact Price-Volume-Mix calculation.
type PVMInputs struct {
	BaseVolume   float64 `json:"base_volume"`    // Q_baseline
	CompVolume   float64 `json:"comp_volume"`    // Q_comparison
	BasePrice    float64 `json:"base_price"`     // P_baseline
	CompPrice    float64 `json:"comp_price"`     // P_comparison
	BaseUnitCost float64 `json:"base_unit_cost"` // C_baseline
	CompUnitCost float64 `json:"comp_unit_cost"` // C_comparison
}

// MonthlyPivotRow represents a row in the monthly P&L pivot table produced by DuckDB native PIVOT.
type MonthlyPivotRow struct {
	AccountCategory string             `json:"account_category"`
	Months          map[string]float64 `json:"months"` // "Jan", "Feb", ... -> value
	Total           float64            `json:"total"`
}


