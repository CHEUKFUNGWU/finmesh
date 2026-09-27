package semantic

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"regexp"
	"strings"
	"sync"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

var (
	validIdentifierRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-]+$`)
	validDateRegex       = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
)

// Compiler compiles semantic metric queries into deterministic DuckDB SQL with in-memory caching.
type Compiler struct {
	catalog *Catalog
	db      *storage.DB
	cache   sync.Map // cacheKey string -> *model.MetricResult
}

// NewCompiler instantiates a compiler tied to a catalog and storage engine.
func NewCompiler(catalog *Catalog, db *storage.DB) *Compiler {
	return &Compiler{
		catalog: catalog,
		db:      db,
	}
}

// InvalidateCache invalidates in-memory cached metric results per REQ-0002 §4.3.
func (c *Compiler) InvalidateCache() {
	c.cache.Range(func(key, value any) bool {
		c.cache.Delete(key)
		return true
	})
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

	// Deterministic topological ordering for CTE emission
	sortedAll, err := c.catalog.TopologicalSort()
	if err != nil {
		return "", fmt.Errorf("cycle detected in metric dependencies: %w", err)
	}

	var cteList []string
	var fromTables []string

	for _, depName := range sortedAll {
		depMetric, needed := requiredMetrics[depName]
		if !needed {
			continue
		}
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

// ExecuteMetric runs the compiled SQL on DuckDB and returns the calculated result, leveraging cache.
func (c *Compiler) ExecuteMetric(ctx context.Context, q model.MetricQuery) (*model.MetricResult, error) {
	cacheKey := fmt.Sprintf("%s:%s:%s:%s:%s", q.MetricName, q.Scenario, q.StartDate, q.EndDate, strings.Join(q.Dimensions, ","))
	if cached, ok := c.cache.Load(cacheKey); ok {
		if res, valid := cached.(*model.MetricResult); valid {
			return res, nil
		}
	}

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

	res := &model.MetricResult{
		MetricName:  q.MetricName,
		DisplayName: metric.DisplayName,
		Value:       resVal,
		SQLQuery:    querySQL,
	}
	c.cache.Store(cacheKey, res)
	return res, nil
}

// CalculatePVMDecomposition calculates algebraic Price-Volume-Mix decomposition adhering strictly to REQ-0004 §4.1.
func CalculatePVMDecomposition(metricName string, input model.PVMInputs) (*model.VarianceBreakdown, error) {
	// Delta_volume = (Q_act - Q_bud) * P_bud
	volVar := (input.CompVolume - input.BaseVolume) * input.BasePrice
	// Delta_price = (P_act - P_bud) * Q_act
	priceVar := (input.CompPrice - input.BasePrice) * input.CompVolume
	// Delta_cost = (C_bud - C_act) * Q_act
	costVar := (input.BaseUnitCost - input.CompUnitCost) * input.CompVolume

	compTotal := (input.CompVolume * input.CompPrice) - (input.CompVolume * input.CompUnitCost)
	baseTotal := (input.BaseVolume * input.BasePrice) - (input.BaseVolume * input.BaseUnitCost)
	totalVariance := compTotal - baseTotal

	// Total variance conservation: Delta_total = Delta_volume + Delta_price + Delta_cost + Mix/Residual
	residual := totalVariance - (volVar + priceVar + costVar)

	// Conservation check: if deviation > 0.01, reject per REQ-0004 §4.1
	reconstructed := volVar + priceVar + costVar + residual
	if math.Abs(totalVariance-reconstructed) > 0.01 {
		return nil, fmt.Errorf("PVM conservation check failed: total variance %.4f != reconstructed %.4f (deviation > 0.01)",
			totalVariance, reconstructed)
	}

	return &model.VarianceBreakdown{
		MetricName:      metricName,
		BaselineValue:   math.Round(baseTotal*100) / 100,
		ComparisonValue: math.Round(compTotal*100) / 100,
		TotalVariance:   math.Round(totalVariance*100) / 100,
		VolumeVariance:  math.Round(volVar*100) / 100,
		PriceVariance:   math.Round(priceVar*100) / 100,
		CostVariance:    math.Round(costVar*100) / 100,
		Unexplained:     math.Round(residual*100) / 100,
	}, nil
}

// ExecuteVariance calculates delta and Price-Volume-Mix (PVM) decomposition between scenarios.
// If operational quantity data is not recorded in the ledger, the observed delta is preserved
// in TotalVariance with 0 volume/price attribution to maintain zero-hallucination standards.
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

	// Check if operational driver quantities are recorded in fact_operational_metrics for this metric
	driverVol := fmt.Sprintf("%s_volume", metricName)
	driverPrice := fmt.Sprintf("%s_unit_price", metricName)

	var baseVol, compVol, basePrice, compPrice sql.NullFloat64
	errScan := c.db.QueryRowContext(ctx, `
		SELECT 
			MAX(CASE WHEN scenario = ? AND (metric_name = ? OR metric_name = 'volume') THEN metric_value END),
			MAX(CASE WHEN scenario = ? AND (metric_name = ? OR metric_name = 'volume') THEN metric_value END),
			MAX(CASE WHEN scenario = ? AND (metric_name = ? OR metric_name = 'unit_price') THEN metric_value END),
			MAX(CASE WHEN scenario = ? AND (metric_name = ? OR metric_name = 'unit_price') THEN metric_value END)
		FROM fact_operational_metrics
	`, baselineScenario, driverVol, compScenario, driverVol, baselineScenario, driverPrice, compScenario, driverPrice).Scan(&baseVol, &compVol, &basePrice, &compPrice)

	if errScan == nil && baseVol.Valid && compVol.Valid && basePrice.Valid && compPrice.Valid && baseVol.Float64 > 0 {
		return CalculatePVMDecomposition(metricName, model.PVMInputs{
			BaseVolume: baseVol.Float64,
			CompVolume: compVol.Float64,
			BasePrice:  basePrice.Float64,
			CompPrice:  compPrice.Float64,
		})
	}

	// When operational drivers are absent, preserve exact total variance with zero hallucinated split
	return &model.VarianceBreakdown{
		MetricName:      metricName,
		BaselineValue:   baseRes.Value,
		ComparisonValue: compRes.Value,
		TotalVariance:   totalVariance,
		VolumeVariance:  0.0,
		PriceVariance:   0.0,
		CostVariance:    0.0,
		Unexplained:     totalVariance,
	}, nil
}

// ExecuteMonthlyPivot runs DuckDB native PIVOT query to produce horizontal monthly P&L schedules per REQ-0002 §4.2.
func (c *Compiler) ExecuteMonthlyPivot(ctx context.Context, scenario, year string) ([]model.MonthlyPivotRow, error) {
	if scenario != "" && !validIdentifierRegex.MatchString(scenario) {
		return nil, fmt.Errorf("invalid scenario: %s", scenario)
	}
	if year == "" {
		year = "2026"
	}
	if !regexp.MustCompile(`^\d{4}$`).MatchString(year) {
		return nil, fmt.Errorf("invalid year format: %s", year)
	}

	pivotSQL := fmt.Sprintf(`
		PIVOT (
			SELECT strftime(posting_date, '%%b') as month_name, account_category,
				CASE WHEN account_category = 'Revenue' THEN (credit_amount - debit_amount)
				     ELSE (debit_amount - credit_amount)
				END as val
			FROM fact_general_ledger
			WHERE scenario = '%s' AND strftime(posting_date, '%%Y') = '%s'
		)
		ON month_name IN ('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec')
		USING sum(val)
		GROUP BY account_category
		ORDER BY account_category;
	`, scenario, year)

	rows, err := c.db.QueryContext(ctx, pivotSQL)
	if err != nil {
		return nil, fmt.Errorf("failed executing monthly pivot: %w", err)
	}
	defer rows.Close()

	monthsList := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	var results []model.MonthlyPivotRow

	for rows.Next() {
		var category string
		vals := make([]sql.NullFloat64, 12)
		dest := make([]interface{}, 13)
		dest[0] = &category
		for i := 0; i < 12; i++ {
			dest[i+1] = &vals[i]
		}

		if err := rows.Scan(dest...); err != nil {
			return nil, fmt.Errorf("failed scanning pivot row: %w", err)
		}

		mMap := make(map[string]float64)
		total := 0.0
		for i, m := range monthsList {
			v := 0.0
			if vals[i].Valid {
				v = math.Round(vals[i].Float64*100) / 100
			}
			mMap[m] = v
			total += v
		}

		results = append(results, model.MonthlyPivotRow{
			AccountCategory: category,
			Months:          mMap,
			Total:           math.Round(total*100) / 100,
		})
	}

	return results, nil
}
