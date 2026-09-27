package ingest

import (
	"encoding/csv"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"github.com/CHEUKFUNGWU/finmesh/backend/internal/model"
)

// ValidateTrialBalance computes debits and credits and validates whether double-entry equilibrium holds.
func ValidateTrialBalance(entries []model.JournalEntry) model.TrialBalanceResult {
	var totalDebits, totalCredits float64
	voucherSet := make(map[string]struct{})

	for _, e := range entries {
		totalDebits += e.DebitAmount
		totalCredits += e.CreditAmount
		voucherSet[e.VoucherID] = struct{}{}
	}

	diff := math.Abs(totalDebits - totalCredits)
	isBalanced := diff <= 0.0001 && len(entries) > 0

	return model.TrialBalanceResult{
		TotalDebits:  math.Round(totalDebits*100) / 100,
		TotalCredits: math.Round(totalCredits*100) / 100,
		Difference:   math.Round(diff*10000) / 10000,
		IsBalanced:   isBalanced,
		VoucherCount: len(voucherSet),
		RowCount:     len(entries),
	}
}

// ParseCSV streams and validates a standard financial CSV export.
func ParseCSV(r io.Reader, scenario, batchID string) ([]model.JournalEntry, model.TrialBalanceResult, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	headers, err := reader.Read()
	if err != nil {
		return nil, model.TrialBalanceResult{}, fmt.Errorf("failed to read csv header: %w", err)
	}

	colMap := normalizeHeaders(headers)
	var entries []model.JournalEntry
	lineIdx := 1

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, model.TrialBalanceResult{}, fmt.Errorf("error reading csv row %d: %w", lineIdx+1, err)
		}
		lineIdx++

		entry, err := recordToJournalEntry(record, colMap, scenario, batchID, lineIdx)
		if err != nil {
			return nil, model.TrialBalanceResult{}, fmt.Errorf("row %d validation error: %w", lineIdx, err)
		}
		entries = append(entries, entry)
	}

	tb := ValidateTrialBalance(entries)
	if !tb.IsBalanced {
		return entries, tb, fmt.Errorf("trial balance validation failed: Total Debits (%.2f) != Total Credits (%.2f), Delta=%.4f",
			tb.TotalDebits, tb.TotalCredits, tb.Difference)
	}

	return entries, tb, nil
}

// ParseExcel streams and maps an Excel spreadsheet to journal entries.
func ParseExcel(r io.Reader, sheetName, scenario, batchID string) ([]model.JournalEntry, model.TrialBalanceResult, error) {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return nil, model.TrialBalanceResult{}, fmt.Errorf("failed to open excel workbook: %w", err)
	}
	defer f.Close()

	if sheetName == "" {
		sheets := f.GetSheetList()
		if len(sheets) == 0 {
			return nil, model.TrialBalanceResult{}, fmt.Errorf("workbook has no sheets")
		}
		sheetName = sheets[0]
	}

	rows, err := f.Rows(sheetName)
	if err != nil {
		return nil, model.TrialBalanceResult{}, fmt.Errorf("failed to read sheet %s: %w", sheetName, err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, model.TrialBalanceResult{}, fmt.Errorf("sheet is empty")
	}

	headers, err := rows.Columns()
	if err != nil {
		return nil, model.TrialBalanceResult{}, fmt.Errorf("failed to read headers: %w", err)
	}

	colMap := normalizeHeaders(headers)
	var entries []model.JournalEntry
	lineIdx := 1

	for rows.Next() {
		lineIdx++
		cols, err := rows.Columns()
		if err != nil {
			return nil, model.TrialBalanceResult{}, fmt.Errorf("error reading row %d: %w", lineIdx, err)
		}

		entry, err := recordToJournalEntry(cols, colMap, scenario, batchID, lineIdx)
		if err != nil {
			return nil, model.TrialBalanceResult{}, fmt.Errorf("row %d invalid: %w", lineIdx, err)
		}
		entries = append(entries, entry)
	}

	tb := ValidateTrialBalance(entries)
	if !tb.IsBalanced {
		return entries, tb, fmt.Errorf("trial balance validation failed: Total Debits (%.2f) != Total Credits (%.2f), Delta=%.4f",
			tb.TotalDebits, tb.TotalCredits, tb.Difference)
	}

	return entries, tb, nil
}

func normalizeHeaders(headers []string) map[string]int {
	m := make(map[string]int)
	for i, h := range headers {
		key := strings.ToLower(strings.TrimSpace(h))
		key = strings.ReplaceAll(key, " ", "_")
		m[key] = i
	}
	return m
}

func recordToJournalEntry(cols []string, colMap map[string]int, scenario, batchID string, rowIdx int) (model.JournalEntry, error) {
	getVal := func(keys ...string) string {
		for _, k := range keys {
			if idx, ok := colMap[k]; ok && idx < len(cols) {
				return strings.TrimSpace(cols[idx])
			}
		}
		return ""
	}

	voucherID := getVal("voucher_id", "voucher", "凭证号", "id")
	if voucherID == "" {
		voucherID = fmt.Sprintf("VCH-%06d", rowIdx)
	}

	lineNoStr := getVal("line_no", "line", "行号")
	lineNo, _ := strconv.Atoi(lineNoStr)
	if lineNo == 0 {
		lineNo = rowIdx
	}

	dateStr := getVal("posting_date", "date", "记账日期", "日期")
	postingDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		postingDate, err = time.Parse("2006/01/02", dateStr)
		if err != nil {
			postingDate = time.Now().UTC().Truncate(24 * time.Hour)
		}
	}

	accountCode := getVal("account_code", "code", "科目代码")
	accountName := getVal("account_name", "name", "科目名称")
	accountCategory := getVal("account_category", "category", "科目分类")
	if accountCategory == "" {
		accountCategory = inferCategory(accountCode, accountName)
	}

	debitStr := getVal("debit_amount", "debit", "借方金额", "借方")
	creditStr := getVal("credit_amount", "credit", "贷方金额", "贷方")

	debit, _ := strconv.ParseFloat(strings.ReplaceAll(debitStr, ",", ""), 64)
	credit, _ := strconv.ParseFloat(strings.ReplaceAll(creditStr, ",", ""), 64)

	dept := getVal("department_id", "department", "部门")
	entity := getVal("entity_id", "entity", "法人主体", "公司")

	return model.JournalEntry{
		VoucherID:       voucherID,
		LineNo:          lineNo,
		PostingDate:     postingDate,
		AccountCode:     accountCode,
		AccountName:     accountName,
		AccountCategory: accountCategory,
		DebitAmount:     debit,
		CreditAmount:    credit,
		DepartmentID:    dept,
		EntityID:        entity,
		Scenario:        scenario,
		BatchID:         batchID,
	}, nil
}

func inferCategory(code, name string) string {
	lowerName := strings.ToLower(name)
	switch {
	case strings.HasPrefix(code, "6001") || strings.Contains(lowerName, "revenue") || strings.Contains(name, "收入"):
		return "Revenue"
	case strings.HasPrefix(code, "6401") || strings.Contains(lowerName, "cogs") || strings.Contains(name, "成本"):
		return "COGS"
	case strings.HasPrefix(code, "6601") || strings.Contains(lowerName, "sales") || strings.Contains(name, "销售费用"):
		return "Opex"
	case strings.HasPrefix(code, "6602") || strings.Contains(lowerName, "admin") || strings.Contains(name, "管理费用"):
		return "Opex"
	case strings.HasPrefix(code, "6603") || strings.Contains(lowerName, "r&d") || strings.Contains(name, "研发费用"):
		return "Opex"
	case strings.HasPrefix(code, "1"):
		return "Asset"
	case strings.HasPrefix(code, "2"):
		return "Liability"
	case strings.HasPrefix(code, "4"):
		return "Equity"
	default:
		return "Other"
	}
}
