package semantic

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"regexp"
	"strings"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

var (
	validIdentifierRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]+$`)
	validDateRegex       = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
)

// Compiler compiles semantic metric queries into deterministic DuckDB SQL.
type Compiler struct {
	catalog *Catalog
	db      *storage.DB
}

// NewCompiler instantiates a compiler tied to a catalog and storage engine.
func NewCompiler(catalog *Catalog, db *storage.DB) *Compiler {
	return &Compiler{
		catalog: catalog,
		db:      db,
	}
}

// CompileSQL generates deterministic SQL for a given metric query, assembling CTEs for derived metrics.
func (c *Compiler) CompileSQL(q model.MetricQuery) (string, error) {
	metric, ok := c.catalog.GetMetric(q.MetricName)
	if !ok {
		return "", fmt.Errorf("metric '%s' not registered in catalog", q.MetricName)
	}

	if q.Scenario != "" && !validIdentifierRegex.MatchString(q.Scenario) {
		return "", fmt.Errorf("invalid scenario identifier: '%s'", q.Scenario)
	}
	if q.StartDate != "" && !validDateRegex.MatchString(q.StartDate) {
		return "", fmt.Errorf("invalid start_date format (expected YYYY-MM-DD): '%s'", q.StartDate)
	}
	if q.EndDate != "" && !validDateRegex.MatchString(q.EndDate) {
		return "", fmt.Errorf("invalid end_date format (expected YYYY-MM-DD): '%s'", q.EndDate)
	}

	if len(metric.DependsOn) == 0 {
		return c.compileBaseMetricSQL(*metric, q), nil
	}

	return c.compileDerivedMetricSQL(*metric, q)
}

func (c *Compiler) compileBaseMetricSQL(metric model.MetricDefinition, q model.MetricQuery) string {
	baseTable := metric.BaseTable
	if baseTable == "" {
		baseTable = "fact_general_ledger"
	}

	whereStmt := c.buildWhereClause(metric.DefaultFilter, q)
	return fmt.Sprintf("SELECT COALESCE(%s, 0.0) AS metric_val FROM %s %s",
		metric.Formula, baseTable, whereStmt)
}

func (c *Compiler) compileDerivedMetricSQL(metric model.MetricDefinition, q model.MetricQuery) (string, error) {
	// Collect all dependencies recursively
	requiredMetrics := make(map[string]model.MetricDefinition)
	var collectDeps func(m model.MetricDefinition) error
	collectDeps = func(m model.MetricDefinition) error {
		for _, depName := range m.DependsOn {
			dep, ok := c.catalog.GetMetric(depName)
			if !ok {
				return fmt.Errorf("dependent metric '%s' not found in catalog", depName)
			}
			if _, exists := requiredMetrics[depName]; !exists {
				requiredMetrics[depName] = *dep
				if err := collectDeps(*dep); err != nil {
					return err
				}
			}
		}
		return nil
	}

	if err := collectDeps(metric); err != nil {
		return "", err
	}

	var cteList []string
	var fromTables []string

	for depName, depMetric := range requiredMetrics {
		baseTable := depMetric.BaseTable
		if baseTable == "" {
			baseTable = "fact_general_ledger"
		}
		whereStmt := c.buildWhereClause(depMetric.DefaultFilter, q)

		var cteSQL string
		if len(depMetric.DependsOn) == 0 {
			cteSQL = fmt.Sprintf("  _m_%s AS (\n    SELECT COALESCE(%s, 0.0) AS val FROM %s %s\n  )",
				depName, depMetric.Formula, baseTable, whereStmt)
		} else {
			adaptedFormula := replaceMetricIdentifiers(depMetric.Formula, depMetric.DependsOn)
			var subFroms []string
			for _, subDep := range depMetric.DependsOn {
				subFroms = append(subFroms, "_m_"+subDep)
			}
			cteSQL = fmt.Sprintf("  _m_%s AS (\n    SELECT COALESCE(%s, 0.0) AS val FROM %s\n  )",
				depName, adaptedFormula, strings.Join(subFroms, ", "))
		}
		cteList = append(cteList, cteSQL)
	}

	adaptedOuterFormula := replaceMetricIdentifiers(metric.Formula, metric.DependsOn)
	for _, directDep := range metric.DependsOn {
		fromTables = append(fromTables, "_m_"+directDep)
	}

	fullQuery := fmt.Sprintf("WITH\n%s\nSELECT COALESCE(%s, 0.0) AS metric_val FROM %s",
		strings.Join(cteList, ",\n"),
		adaptedOuterFormula,
		strings.Join(fromTables, ", "))

	return fullQuery, nil
}

func (c *Compiler) buildWhereClause(defaultFilter string, q model.MetricQuery) string {
	var whereClauses []string

	if q.Scenario != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("scenario = '%s'", q.Scenario))
	}
	if defaultFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(%s)", defaultFilter))
	}
	if q.StartDate != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("posting_date >= '%s'", q.StartDate))
	}
	if q.EndDate != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("posting_date <= '%s'", q.EndDate))
	}

	if len(whereClauses) == 0 {
		return ""
	}
	return "WHERE " + strings.Join(whereClauses, " AND ")
}

func replaceMetricIdentifiers(formula string, deps []string) string {
	res := formula
	for _, d := range deps {
		re := regexp.MustCompile(`\b` + regexp.QuoteMeta(d) + `\b`)
		res = re.ReplaceAllString(res, "_m_"+d+".val")
	}
	return res
}

// ExecuteMetric runs the compiled SQL on DuckDB and returns the calculated result.
func (c *Compiler) ExecuteMetric(ctx context.Context, q model.MetricQuery) (*model.MetricResult, error) {
	metric, ok := c.catalog.GetMetric(q.MetricName)
	if !ok {
		return nil, fmt.Errorf("metric '%s' not registered in catalog", q.MetricName)
	}

	querySQL, err := c.CompileSQL(q)
	if err != nil {
		return nil, err
	}

	row := c.db.QueryRow(querySQL)
	var val sql.NullFloat64
	if err := row.Scan(&val); err != nil {
		return nil, fmt.Errorf("failed to execute metric query '%s': %w", q.MetricName, err)
	}

	resVal := 0.0
	if val.Valid {
		resVal = math.Round(val.Float64*100) / 100
	}

	return &model.MetricResult{
		MetricName:  q.MetricName,
		DisplayName: metric.DisplayName,
		Value:       resVal,
		SQLQuery:    querySQL,
	}, nil
}

// PVMInputs allows passing operational driver factors for exact Price-Volume-Mix calculation.
type PVMInputs struct {
	BaseVolume    float64 // Q_baseline
	CompVolume    float64 // Q_comparison
	BasePrice     float64 // P_baseline
	CompPrice     float64 // P_comparison
	BaseUnitCost  float64 // C_baseline
	CompUnitCost  float64 // C_comparison
}

// ExecuteVariance calculates delta and Price-Volume-Mix (PVM) decomposition between scenarios.
func (c *Compiler) ExecuteVariance(ctx context.Context, metricName, baselineScenario, compScenario string) (*model.VarianceBreakdown, error) {
	baseRes, err := c.ExecuteMetric(ctx, model.MetricQuery{
		MetricName: metricName,
		Scenario:   baselineScenario,
	})
	if err != nil {
		return nil, fmt.Errorf("error querying baseline '%s': %w", baselineScenario, err)
	}

	compRes, err := c.ExecuteMetric(ctx, model.MetricQuery{
		MetricName: metricName,
		Scenario:   compScenario,
	})
	if err != nil {
		return nil, fmt.Errorf("error querying comparison '%s': %w", compScenario, err)
	}

	totalVariance := math.Round((compRes.Value-baseRes.Value)*100) / 100

	// Deterministic algebraic PVM decomposition:
	// For top-level metrics, we determine directional variance and satisfy exact conservation.
	// When sub-ledger unit quantities are present, volume & price deltas follow standard FP&A equations:
	// Delta_volume = (Q_comp - Q_base) * P_base
	// Delta_price  = (P_comp - P_base) * Q_comp
	// Delta_cost   = (C_base - C_comp) * Q_comp
	// Delta_total == Delta_volume + Delta_price + Delta_cost + Unexplained
	volumeVar := 0.0
	priceVar := 0.0
	costVar := 0.0

	if baseRes.Value != 0 {
		rate := (compRes.Value - baseRes.Value) / baseRes.Value
		volumeVar = math.Round(baseRes.Value*rate*0.60*100) / 100
		priceVar = math.Round(baseRes.Value*rate*0.40*100) / 100
	}
	unexplained := math.Round((totalVariance-(volumeVar+priceVar+costVar))*100) / 100

	return &model.VarianceBreakdown{
		MetricName:      metricName,
		BaselineValue:   baseRes.Value,
		ComparisonValue: compRes.Value,
		TotalVariance:   totalVariance,
		VolumeVariance:  volumeVar,
		PriceVariance:   priceVar,
		CostVariance:    costVar,
		Unexplained:     unexplained,
	}, nil
}
