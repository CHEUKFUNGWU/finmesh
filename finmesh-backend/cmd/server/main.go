package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/mark3labs/mcp-go/server"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/api"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/mcp"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/semantic"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/storage"
)

func main() {
	mode := flag.String("mode", "stdio", "Server mode: stdio or http")
	port := flag.String("port", "8080", "HTTP port if mode is http")
	dbPath := flag.String("db", "", "DuckDB database file path (blank for in-memory)")
	seed := flag.Bool("seed", true, "Seed realistic demo ledger data for 2026-Q1")
	flag.Parse()

	log.Printf("[FinMesh] Starting Financial Core Engine (mode: %s)...", *mode)

	// 1. Initialize DuckDB
	var db *storage.DB
	var err error
	if *dbPath != "" {
		db, err = storage.NewFileDB(*dbPath)
	} else {
		db, err = storage.NewInMemoryDB()
	}
	if err != nil {
		log.Fatalf("Fatal: failed to initialize storage: %v", err)
	}
	defer db.Close()

	// 2. Initialize Semantic Metric Catalog
	catalog := semantic.NewCatalog()
	initDefaultMetrics(catalog)

	// 3. Compile Engine
	compiler := semantic.NewCompiler(catalog, db)

	// 4. Optionally seed demo ledger data
	if *seed {
		if err := seedDemoData(context.Background(), db); err != nil {
			log.Printf("Warning: failed to seed demo data: %v", err)
		} else {
			log.Printf("[FinMesh] Demo 2026-Q1 ledger entries successfully seeded and trial-balanced.")
		}
	}

	// 5. Initialize MCP Server
	mcpServer := mcp.NewFinMeshMCPServer(catalog, compiler, db)

	switch *mode {
	case "stdio":
		stdioServer := server.NewStdioServer(mcpServer.MCPServer())
		log.Println("[FinMesh] MCP Server running on stdio...")
		if err := stdioServer.Listen(context.Background(), os.Stdin, os.Stdout); err != nil {
			log.Fatalf("MCP stdio error: %v", err)
		}
	case "http":
		sseServer := server.NewSSEServer(mcpServer.MCPServer())
		apiHandler := api.NewAPIHandler(catalog, compiler, db)

		mux := http.NewServeMux()
		mux.Handle("/sse", sseServer)
		apiHandler.RegisterRoutes(mux)
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ok","engine":"finmesh-duckdb"}`))
		})
		log.Printf("[FinMesh] Server listening on HTTP :%s...", *port)
		if err := http.ListenAndServe(":"+*port, mux); err != nil {
			log.Fatalf("HTTP server error: %v", err)
		}
	default:
		log.Fatalf("Unknown mode '%s'. Use 'stdio' or 'http'.", *mode)
	}
}

func initDefaultMetrics(c *semantic.Catalog) {
	c.RegisterMetric(model.MetricDefinition{
		Name:          "revenue",
		DisplayName:   "Total Revenue",
		Category:      "Revenue",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(credit_amount) - SUM(debit_amount)",
		DefaultFilter: "account_category = 'Revenue'",
	})
	c.RegisterMetric(model.MetricDefinition{
		Name:          "cogs",
		DisplayName:   "Cost of Goods Sold",
		Category:      "Profitability",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(debit_amount) - SUM(credit_amount)",
		DefaultFilter: "account_category = 'COGS'",
	})
	c.RegisterMetric(model.MetricDefinition{
		Name:          "opex",
		DisplayName:   "Operating Expenses",
		Category:      "Opex",
		BaseTable:     "fact_general_ledger",
		Formula:       "SUM(debit_amount) - SUM(credit_amount)",
		DefaultFilter: "account_category = 'Opex'",
	})
	c.RegisterMetric(model.MetricDefinition{
		Name:          "gross_profit",
		DisplayName:   "Gross Profit",
		Category:      "Profitability",
		Formula:       "revenue - cogs",
		DependsOn:     []string{"revenue", "cogs"},
	})
}

func seedDemoData(ctx context.Context, db *storage.DB) error {
	entries := []model.JournalEntry{
		// Actuals Q1
		{VoucherID: "ACT-001", LineNo: 1, PostingDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 180000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "demo_init"},
		{VoucherID: "ACT-001", LineNo: 2, PostingDate: time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "SaaS ARR", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 180000.0, Scenario: "actual", BatchID: "demo_init"},
		{VoucherID: "ACT-002", LineNo: 1, PostingDate: time.Date(2026, 1, 20, 0, 0, 0, 0, time.UTC), AccountCode: "6401", AccountName: "Cloud Infrastructure", AccountCategory: "COGS", DebitAmount: 36000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "demo_init"},
		{VoucherID: "ACT-002", LineNo: 2, PostingDate: time.Date(2026, 1, 20, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 36000.0, Scenario: "actual", BatchID: "demo_init"},
		{VoucherID: "ACT-003", LineNo: 1, PostingDate: time.Date(2026, 1, 31, 0, 0, 0, 0, time.UTC), AccountCode: "6603", AccountName: "Engineering Payroll", AccountCategory: "Opex", DebitAmount: 64000.0, CreditAmount: 0.0, Scenario: "actual", BatchID: "demo_init"},
		{VoucherID: "ACT-003", LineNo: 2, PostingDate: time.Date(2026, 1, 31, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 64000.0, Scenario: "actual", BatchID: "demo_init"},

		// Budget Q1
		{VoucherID: "BGT-001", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 200000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "demo_init"},
		{VoucherID: "BGT-001", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "6001", AccountName: "SaaS ARR", AccountCategory: "Revenue", DebitAmount: 0.0, CreditAmount: 200000.0, Scenario: "budget", BatchID: "demo_init"},
		{VoucherID: "BGT-002", LineNo: 1, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "6401", AccountName: "Cloud Infrastructure", AccountCategory: "COGS", DebitAmount: 30000.0, CreditAmount: 0.0, Scenario: "budget", BatchID: "demo_init"},
		{VoucherID: "BGT-002", LineNo: 2, PostingDate: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), AccountCode: "1001", AccountName: "Bank Cash", AccountCategory: "Asset", DebitAmount: 0.0, CreditAmount: 30000.0, Scenario: "budget", BatchID: "demo_init"},
	}

	return db.InsertEntries(ctx, entries)
}
