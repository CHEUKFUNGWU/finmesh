package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

func setupTestAPI(t *testing.T) (*APIHandler, *storage.DB) {
	t.Helper()
	db, err := storage.NewInMemoryDB()
	if err != nil {
		t.Fatalf("failed to create in-memory db: %v", err)
	}

	catalog := semantic.NewCatalog()
	catalog.RegisterMetric(model.MetricDefinition{
		Name:          "revenue",
		DisplayName:   "Total Revenue",
		Category:      "Revenue",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(credit_amount) - SUM(debit_amount)",
		DefaultFilter: "account_category = 'Revenue'",
	})
	catalog.RegisterMetric(model.MetricDefinition{
		Name:          "cogs",
		DisplayName:   "Cost of Goods Sold",
		Category:      "COGS",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(debit_amount) - SUM(credit_amount)",
		DefaultFilter: "account_category = 'COGS'",
	})
	catalog.RegisterMetric(model.MetricDefinition{
		Name:          "gross_profit",
		DisplayName:   "Gross Profit",
		Category:      "Profitability",
		Formula:       "revenue - cogs",
		DependsOn:     []string{"revenue", "cogs"},
	})

	compiler := semantic.NewCompiler(catalog, db)

	// Seed test data
	entries := []model.JournalEntry{
		{VoucherID: "V1", LineNo: 1, PostingDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 100000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "b1"},
		{VoucherID: "V1", LineNo: 2, PostingDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "SaaS ARR", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 100000.0, Scenario: "actual", BatchID: "b1"},
		{VoucherID: "V2", LineNo: 1, PostingDate: time.Date(2026, 1, 20, 0, 0, 0, 0, time.UTC), AccountCode: "6401", AccountName: "Cloud Infra", AccountCategory: "COGS", DebitAmount: 20000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "b1"},
		{VoucherID: "V2", LineNo: 2, PostingDate: time.Date(2026, 1, 20, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 20000.0, Scenario: "actual", BatchID: "b1"},
	}
	if err := db.InsertEntries(context.Background(), entries); err != nil {
		t.Fatalf("failed to seed test entries: %v", err)
	}

	handler := NewAPIHandler(catalog, compiler, db)
	return handler, db
}

func TestBatchMetricsEvaluation(t *testing.T) {
	handler, db := setupTestAPI(t)
	defer db.Close()

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	batchReq := BatchRequest{
		Queries: []BatchQueryItem{
			{MetricName: "revenue", Period: "2026-Q1", Scenario: "actual"},
			{MetricName: "cogs", Period: "2026-01", Scenario: "actual"},
			{MetricName: "gross_profit", Period: "2026-Q1", Scenario: "actual"},
			{MetricName: "non_existent_metric", Period: "2026-Q1", Scenario: "actual"},
		},
	}

	body, _ := json.Marshal(batchReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/metrics/batch", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp BatchResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Count != 4 {
		t.Fatalf("expected 4 results, got %d", resp.Count)
	}

	// 1. Revenue
	if resp.Results[0].Status != "ok" || resp.Results[0].Value != 100000.0 {
		t.Errorf("revenue expected 100000.0, got %v (status: %s)", resp.Results[0].Value, resp.Results[0].Status)
	}
	if resp.Results[0].SQLHash == "" {
		t.Errorf("expected non-empty SQLHash for audit")
	}

	// 2. COGS
	if resp.Results[1].Status != "ok" || resp.Results[1].Value != 20000.0 {
		t.Errorf("cogs expected 20000.0, got %v (status: %s)", resp.Results[1].Value, resp.Results[1].Status)
	}

	// 3. Gross Profit (derived)
	if resp.Results[2].Status != "ok" || resp.Results[2].Value != 80000.0 {
		t.Errorf("gross_profit expected 80000.0, got %v (status: %s)", resp.Results[2].Value, resp.Results[2].Status)
	}

	// 4. Non-existent metric error handling
	if resp.Results[3].Status != "error" || resp.Results[3].Error != "#FINMESH.INVALID_METRIC!" {
		t.Errorf("expected #FINMESH.INVALID_METRIC!, got %s (status: %s)", resp.Results[3].Error, resp.Results[3].Status)
	}
}

func TestMetricsCatalogAndDrilldown(t *testing.T) {
	handler, db := setupTestAPI(t)
	defer db.Close()

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	// Test Catalog
	reqCat := httptest.NewRequest(http.MethodGet, "/api/v1/metrics/catalog", nil)
	wCat := httptest.NewRecorder()
	mux.ServeHTTP(wCat, reqCat)

	if wCat.Code != http.StatusOK {
		t.Fatalf("catalog expected 200, got %d", wCat.Code)
	}

	// Test Drilldown
	reqDrill := httptest.NewRequest(http.MethodGet, "/api/v1/metrics/drilldown?metric=revenue&period=2026-Q1&scenario=actual", nil)
	wDrill := httptest.NewRecorder()
	mux.ServeHTTP(wDrill, reqDrill)

	if wDrill.Code != http.StatusOK {
		t.Fatalf("drilldown expected 200, got %d", wDrill.Code)
	}

	var drillRes map[string]any
	json.Unmarshal(wDrill.Body.Bytes(), &drillRes)
	if drillRes["metric_name"] != "revenue" {
		t.Errorf("expected metric_name revenue, got %v", drillRes["metric_name"])
	}
	if drillRes["sql_hash"] == nil || drillRes["sql_hash"] == "" {
		t.Errorf("expected valid sql_hash in drilldown response")
	}
}

func TestScenarioOverride(t *testing.T) {
	handler, db := setupTestAPI(t)
	defer db.Close()

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	overrideReq := ScenarioOverrideRequest{
		ScenarioName: "WhatIf_Excel_Bull",
		DriverOverrides: map[string]float64{
			"price_lift":          0.10, // +10% price lift
			"hiring_delay_months": 2,    // 2 months delay
		},
	}
	body, _ := json.Marshal(overrideReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/scenarios/override", bytes.NewReader(body))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("scenario override expected 200, got %d", w.Code)
	}

	var resp ScenarioOverrideResponse
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.ScenarioName != "WhatIf_Excel_Bull" {
		t.Errorf("expected scenario WhatIf_Excel_Bull, got %s", resp.ScenarioName)
	}
	if resp.SimulatedRevenue <= resp.BaselineRevenue {
		t.Errorf("expected simulated revenue > baseline revenue due to price lift, got base=%v sim=%v", resp.BaselineRevenue, resp.SimulatedRevenue)
	}
	if resp.OverridesApplied != 2 {
		t.Errorf("expected 2 overrides applied, got %d", resp.OverridesApplied)
	}
}
