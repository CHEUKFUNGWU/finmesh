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

// InitSchema creates the fact_general_ledger table if it doesn't already exist.
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

// QueryRow executes a query returning a single row.
func (d *DB) QueryRow(query string, args ...any) *sql.Row {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.db.QueryRow(query, args...)
}

// RawDB returns underlying sql.DB pointer.
func (d *DB) RawDB() *sql.DB {
	return d.db
}

// Close terminates the DuckDB connection.
func (d *DB) Close() error {
	return d.db.Close()
}
