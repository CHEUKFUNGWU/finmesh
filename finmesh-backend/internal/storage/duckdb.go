package storage

import (
	"context"
	"database/sql"
	"fmt"
	"sync"

	_ "github.com/marcboeker/go-duckdb"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
)

// DB wraps an embedded DuckDB database connection pool.
type DB struct {
	db *sql.DB
	mu sync.RWMutex
}

// NewInMemoryDB instantiates an in-memory DuckDB database.
func NewInMemoryDB() (*DB, error) {
	db, err := sql.Open("duckdb", "")
	if err != nil {
		return nil, fmt.Errorf("failed to open in-memory duckdb: %w", err)
	}

	instance := &DB{db: db}
	if err := instance.InitSchema(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return instance, nil
}

// NewFileDB instantiates a disk-backed DuckDB database file.
func NewFileDB(path string) (*DB, error) {
	db, err := sql.Open("duckdb", path)
	if err != nil {
		return nil, fmt.Errorf("failed to open duckdb at %s: %w", path, err)
	}

	instance := &DB{db: db}
	if err := instance.InitSchema(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return instance, nil
}

// NewReadOnlyDB opens a DuckDB database in read-only sandbox mode per REQ-0005 §4.3.
func NewReadOnlyDB(path string) (*DB, error) {
	connStr := path
	if connStr == "" {
		connStr = "?access_mode=read_only"
	}
	db, err := sql.Open("duckdb", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open read-only duckdb: %w", err)
	}
	return &DB{db: db}, nil
}

// InitSchema creates the fact tables (fact_general_ledger, fact_revenue_movements,
// fact_headcount_roster, fact_operational_metrics) per REQ-0001 §4.1.
func (d *DB) InitSchema() error {
	d.mu.Lock()
	defer d.mu.Unlock()

	schemaSQL := `
	CREATE TABLE IF NOT EXISTS fact_general_ledger (
		voucher_id VARCHAR NOT NULL,
		line_no INTEGER NOT NULL,
		posting_date DATE NOT NULL,
		account_code VARCHAR NOT NULL,
		account_name VARCHAR NOT NULL,
		account_category VARCHAR NOT NULL,
		debit_amount DOUBLE NOT NULL DEFAULT 0.0,
		credit_amount DOUBLE NOT NULL DEFAULT 0.0,
		department_id VARCHAR,
		entity_id VARCHAR,
		scenario VARCHAR NOT NULL DEFAULT 'actual',
		batch_id VARCHAR NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (voucher_id, line_no)
	);
	CREATE INDEX IF NOT EXISTS idx_fgl_scenario_date ON fact_general_ledger (scenario, posting_date);
	CREATE INDEX IF NOT EXISTS idx_fgl_category ON fact_general_ledger (account_category);

	CREATE TABLE IF NOT EXISTS fact_revenue_movements (
		customer_id VARCHAR NOT NULL,
		product_id VARCHAR NOT NULL,
		arr_delta DOUBLE NOT NULL DEFAULT 0.0,
		mrr_delta DOUBLE NOT NULL DEFAULT 0.0,
		movement_type VARCHAR NOT NULL, -- New, Expansion, Contraction, Churn
		effective_date DATE NOT NULL,
		scenario VARCHAR NOT NULL DEFAULT 'actual',
		batch_id VARCHAR NOT NULL
	);

	CREATE TABLE IF NOT EXISTS fact_headcount_roster (
		employee_id VARCHAR NOT NULL,
		department_id VARCHAR NOT NULL,
		salary_cents BIGINT NOT NULL DEFAULT 0,
		effective_date DATE NOT NULL,
		scenario VARCHAR NOT NULL DEFAULT 'actual',
		batch_id VARCHAR NOT NULL
	);

	CREATE TABLE IF NOT EXISTS fact_operational_metrics (
		scenario VARCHAR NOT NULL DEFAULT 'actual',
		metric_name VARCHAR NOT NULL,
		metric_value DOUBLE NOT NULL,
		unit VARCHAR,
		recorded_date DATE NOT NULL,
		batch_id VARCHAR NOT NULL
	);
	`

	_, err := d.db.Exec(schemaSQL)
	return err
}

// InsertEntries inserts a batch of journal entries into fact_general_ledger inside a single transaction.
func (d *DB) InsertEntries(ctx context.Context, entries []model.JournalEntry) error {
	if len(entries) == 0 {
		return nil
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO fact_general_ledger (
			voucher_id, line_no, posting_date, account_code, account_name,
			account_category, debit_amount, credit_amount, department_id,
			entity_id, scenario, batch_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare insert stmt: %w", err)
	}
	defer stmt.Close()

	for _, e := range entries {
		dateStr := e.PostingDate.Format("2006-01-02")
		_, err := stmt.ExecContext(ctx,
			e.VoucherID, e.LineNo, dateStr, e.AccountCode, e.AccountName,
			e.AccountCategory, e.DebitAmount, e.CreditAmount, e.DepartmentID,
			e.EntityID, e.Scenario, e.BatchID,
		)
		if err != nil {
			return fmt.Errorf("failed to insert voucher line %s-%d: %w", e.VoucherID, e.LineNo, err)
		}
	}

	return tx.Commit()
}

// Query executes a query returning multiple rows.
func (d *DB) Query(query string, args ...any) (*sql.Rows, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db.Query(query, args...)
}

// QueryContext executes a query with context returning multiple rows.
func (d *DB) QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db.QueryContext(ctx, query, args...)
}

// QueryRow executes a query returning a single row.
func (d *DB) QueryRow(query string, args ...any) *sql.Row {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db.QueryRow(query, args...)
}

// QueryRowContext executes a query with context returning a single row.
func (d *DB) QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db.QueryRowContext(ctx, query, args...)
}

// ExecContext executes a query with context without returning rows.
func (d *DB) ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.db.ExecContext(ctx, query, args...)
}

// RawDB returns underlying sql.DB pointer.
func (d *DB) RawDB() *sql.DB {
	return d.db
}

// Close terminates the DuckDB connection.
func (d *DB) Close() error {
	return d.db.Close()
}

