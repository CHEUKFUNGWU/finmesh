package semantic

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
)

// Catalog manages declarative financial metrics definitions and validates dependency DAGs.
type Catalog struct {
	metrics map[string]model.MetricDefinition
	order   []string
}

// NewCatalog instantiates an empty metric catalog.
func NewCatalog() *Catalog {
	return &Catalog{
		metrics: make(map[string]model.MetricDefinition),
	}
}

// LoadYAML parses YAML bytes into the catalog.
func LoadYAML(data []byte) (*Catalog, error) {
	var schema model.MetricCatalogSchema
	if err := yaml.Unmarshal(data, &schema); err != nil {
		return nil, fmt.Errorf("failed to parse yaml schema: %w", err)
	}

	c := NewCatalog()
	for _, m := range schema.Metrics {
		c.RegisterMetric(m)
	}

	if _, err := c.TopologicalSort(); err != nil {
		return nil, fmt.Errorf("dependency validation failed: %w", err)
	}

	return c, nil
}

// LoadFile reads and loads a YAML file from disk.
func LoadFile(filePath string) (*Catalog, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read metric file: %w", err)
	}
	return LoadYAML(data)
}

// RegisterMetric adds or overrides a metric in the catalog.
func (c *Catalog) RegisterMetric(m model.MetricDefinition) {
	c.metrics[m.Name] = m
}

// GetMetric retrieves a metric definition by name.
func (c *Catalog) GetMetric(name string) (*model.MetricDefinition, bool) {
	m, ok := c.metrics[name]
	if !ok {
		return nil, false
	}
	return &m, true
}

// Clear removes all metrics from the catalog.
func (c *Catalog) Clear() {
	c.metrics = make(map[string]model.MetricDefinition)
	c.order = nil
}

// AllMetrics returns all registered metrics.
func (c *Catalog) AllMetrics() []model.MetricDefinition {
	list := make([]model.MetricDefinition, 0, len(c.metrics))
	for _, m := range c.metrics {
		list = append(list, m)
	}
	return list
}

// TopologicalSort checks for cyclic dependencies and returns safe evaluation order (Kahn's algorithm).
func (c *Catalog) TopologicalSort() ([]string, error) {
	inDegree := make(map[string]int)
	graph := make(map[string][]string)

	for name := range c.metrics {
		inDegree[name] = 0
		graph[name] = []string{}
	}

	for name, m := range c.metrics {
		for _, dep := range m.DependsOn {
			if _, exists := c.metrics[dep]; !exists {
				return nil, fmt.Errorf("metric '%s' references unknown dependent metric '%s'", name, dep)
			}
			graph[dep] = append(graph[dep], name)
			inDegree[name]++
		}
	}

	var queue []string
	for name, deg := range inDegree {
		if deg == 0 {
			queue = append(queue, name)
		}
	}

	var sorted []string
	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]
		sorted = append(sorted, curr)

		for _, neighbor := range graph[curr] {
			inDegree[neighbor]--
			if inDegree[neighbor] == 0 {
				queue = append(queue, neighbor)
			}
		}
	}

	if len(sorted) != len(c.metrics) {
		return nil, fmt.Errorf("circular dependency detected in metric catalog")
	}

	c.order = sorted
	return sorted, nil
}
