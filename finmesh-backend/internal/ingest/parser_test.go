package ingest

import (
	"strings"
	"testing"

	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
)

func TestValidateTrialBalance(t *testing.T) {
	tests := []struct {
		name       string
		entries    []model.JournalEntry
		isBalanced bool
		diff       float64
		unbalanced []string
	}{
		{
			name: "balanced entry pair",
			entries: []model.JournalEntry{
				{VoucherID: "V1", LineNo: 1, DebitAmount: 1000.0, CreditAmount: 0.0},
				{VoucherID: "V1", LineNo: 2, DebitAmount: 0.0, CreditAmount: 1000.0},
			},
			isBalanced: true,
			diff:       0.0,
			unbalanced: nil,
		},
		{
			name: "unbalanced entry pair",
			entries: []model.JournalEntry{
				{VoucherID: "V2", LineNo: 1, DebitAmount: 1000.0, CreditAmount: 0.0},
				{VoucherID: "V2", LineNo: 2, DebitAmount: 0.0, CreditAmount: 950.0},
			},
			isBalanced: false,
			diff:       50.0,
			unbalanced: []string{"V2"},
		},
		{
			name: "multi-currency cents balance rounding",
			entries: []model.JournalEntry{
				{VoucherID: "V3", LineNo: 1, DebitAmount: 333.33, CreditAmount: 0.0},
				{VoucherID: "V3", LineNo: 2, DebitAmount: 666.67, CreditAmount: 0.0},
				{VoucherID: "V3", LineNo: 3, DebitAmount: 0.0, CreditAmount: 1000.00},
			},
			isBalanced: true,
			diff:       0.0,
			unbalanced: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res := ValidateTrialBalance(tt.entries)
			if res.IsBalanced != tt.isBalanced {
				t.Errorf("expected isBalanced=%v, got %v", tt.isBalanced, res.IsBalanced)
			}
			if res.Difference != tt.diff {
				t.Errorf("expected difference=%v, got %v", tt.diff, res.Difference)
			}
			if len(res.UnbalancedVouchers) != len(tt.unbalanced) {
				t.Errorf("expected %d unbalanced vouchers, got %d", len(tt.unbalanced), len(res.UnbalancedVouchers))
			}
		})
	}
}

func TestParseCSVBalanced(t *testing.T) {
	csvData := `voucher_id,line_no,posting_date,account_code,account_name,account_category,debit_amount,credit_amount,department_id
VCH-001,1,2026-01-15,1001,Cash,Asset,50000.00,0.00,FIN
VCH-001,2,2026-01-15,6001,Subscription Revenue,Revenue,0.00,50000.00,SALES
`
	entries, tb, err := ParseCSV(strings.NewReader(csvData), "actual", "batch-test-01")
	if err != nil {
		t.Fatalf("unexpected error parsing balanced csv: %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
	if !tb.IsBalanced {
		t.Fatalf("expected trial balance to be true, got false")
	}
	if entries[0].PostingDate.Format("2006-01-02") != "2026-01-15" {
		t.Errorf("expected posting date 2026-01-15, got %v", entries[0].PostingDate)
	}
}

func TestParseCSVUnbalancedThrows(t *testing.T) {
	csvData := `voucher_id,line_no,posting_date,account_code,account_name,account_category,debit_amount,credit_amount
VCH-002,1,2026-01-15,1001,Cash,Asset,50000.00,0.00
VCH-002,2,2026-01-15,6001,Revenue,Revenue,0.00,48000.00
`
	_, tb, err := ParseCSV(strings.NewReader(csvData), "actual", "batch-test-02")
	if err == nil {
		t.Fatal("expected error on unbalanced CSV, got nil")
	}
	if tb.IsBalanced {
		t.Fatal("expected isBalanced to be false")
	}
	if len(tb.UnbalancedVouchers) != 1 || tb.UnbalancedVouchers[0] != "VCH-002" {
		t.Errorf("expected unbalanced voucher VCH-002, got %v", tb.UnbalancedVouchers)
	}
}

func TestParseCSVValidationErrors(t *testing.T) {
	// Missing voucher_id
	badVoucher := `voucher_id,line_no,posting_date,account_code,account_name,debit_amount,credit_amount
,1,2026-01-15,1001,Cash,500.00,0.00
`
	if _, _, err := ParseCSV(strings.NewReader(badVoucher), "actual", "b1"); err == nil {
		t.Error("expected error on missing voucher_id, got nil")
	}

	// Invalid date format
	badDate := `voucher_id,line_no,posting_date,account_code,account_name,debit_amount,credit_amount
V1,1,invalid-date,1001,Cash,500.00,0.00
`
	if _, _, err := ParseCSV(strings.NewReader(badDate), "actual", "b1"); err == nil {
		t.Error("expected error on invalid date, got nil")
	}

	// Invalid numeric amount
	badAmount := `voucher_id,line_no,posting_date,account_code,account_name,debit_amount,credit_amount
V1,1,2026-01-15,1001,Cash,five-hundred,0.00
`
	if _, _, err := ParseCSV(strings.NewReader(badAmount), "actual", "b1"); err == nil {
		t.Error("expected error on invalid numeric amount, got nil")
	}
}
