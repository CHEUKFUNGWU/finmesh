/**
 * FinMesh Financial Baseline & Single Source of Truth (2026-Q1)
 * Adheres to 00-rules/source-of-truth.md and retail_performance_workstation/DESIGN.md
 */

export interface VoucherEntry {
  voucherId: string;
  lineNo: number;
  postingDate: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
}

export interface MetricDefinition {
  id: string;
  name: string;
  displayName: string;
  category: "Revenue" | "COGS" | "Profitability" | "Opex";
  actual: number;
  budget: number;
  variance: number;
  variancePct: string;
  formula: string;
  sqlHash: string;
  isDerived?: boolean;
  derivedFormulaText?: string;
  sqlQuery: string;
  vouchers: VoucherEntry[];
}

export const FINANCIAL_BASELINE_2026_Q1: Record<string, MetricDefinition> = {
  revenue: {
    id: "revenue",
    name: "Total Revenue / ARR",
    displayName: "Revenue (营业收入)",
    category: "Revenue",
    actual: 1250000,
    budget: 1375000,
    variance: -125000,
    variancePct: "-9.1%",
    formula: "SUM(credit_amount) - SUM(debit_amount)",
    sqlHash: "a7f8e32c",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND posting_date BETWEEN '2026-01-01' AND '2026-03-31'
  AND account_category = 'Revenue'
ORDER BY posting_date DESC
LIMIT 20; -- [Token Hash: #a7f8e32c]`,
    vouchers: [
      {
        voucherId: "VCH-2026-001",
        lineNo: 1,
        postingDate: "2026-03-15",
        accountCode: "4001",
        accountName: "SaaS Enterprise ARR - Americas",
        debitAmount: 0,
        creditAmount: 750000,
      },
      {
        voucherId: "VCH-2026-002",
        lineNo: 1,
        postingDate: "2026-03-20",
        accountCode: "4002",
        accountName: "SaaS Mid-Market Expansion - EMEA",
        debitAmount: 0,
        creditAmount: 320000,
      },
      {
        voucherId: "VCH-2026-003",
        lineNo: 1,
        postingDate: "2026-03-28",
        accountCode: "4003",
        accountName: "Professional Services & Integration",
        debitAmount: 0,
        creditAmount: 180000,
      },
    ],
  },
  cogs: {
    id: "cogs",
    name: "Cost of Goods Sold (COGS)",
    displayName: "Cost of Goods Sold (营业成本)",
    category: "COGS",
    actual: 525000,
    budget: 555000,
    variance: 30000, // Favorable cost reduction
    variancePct: "-5.4%",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
    sqlHash: "b2c9d1e4",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND posting_date BETWEEN '2026-01-01' AND '2026-03-31'
  AND account_category = 'COGS'
ORDER BY posting_date DESC
LIMIT 20; -- [Token Hash: #b2c9d1e4]`,
    vouchers: [
      {
        voucherId: "VCH-2026-010",
        lineNo: 1,
        postingDate: "2026-03-05",
        accountCode: "5001",
        accountName: "AWS Graviton Compute & Managed Aurora",
        debitAmount: 310000,
        creditAmount: 0,
      },
      {
        voucherId: "VCH-2026-011",
        lineNo: 1,
        postingDate: "2026-03-12",
        accountCode: "5002",
        accountName: "Snowflake Enterprise Analytics Warehouse",
        debitAmount: 145000,
        creditAmount: 0,
      },
      {
        voucherId: "VCH-2026-012",
        lineNo: 1,
        postingDate: "2026-03-22",
        accountCode: "5003",
        accountName: "Datadog Observability & CDN Ingress",
        debitAmount: 70000,
        creditAmount: 0,
      },
    ],
  },
  gross_profit: {
    id: "gross_profit",
    name: "Gross Profit",
    displayName: "Gross Profit (毛利)",
    category: "Profitability",
    actual: 725000,
    budget: 820000,
    variance: -95000,
    variancePct: "-11.6%",
    formula: "revenue - cogs",
    sqlHash: "e5d4c3b2",
    isDerived: true,
    derivedFormulaText: "Revenue ($1,250,000) - COGS ($525,000) = $725,000 (58.0% Margin)",
    sqlQuery: `WITH m_rev AS (
  SELECT COALESCE(SUM(credit_amount) - SUM(debit_amount), 0.0) AS val
  FROM fact_general_ledger
  WHERE scenario = 'actual' AND account_category = 'Revenue'
),
m_cogs AS (
  SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0.0) AS val
  FROM fact_general_ledger
  WHERE scenario = 'actual' AND account_category = 'COGS'
)
SELECT m_rev.val - m_cogs.val AS gross_profit
FROM m_rev, m_cogs; -- [Token Hash: #e5d4c3b2]`,
    vouchers: [
      {
        voucherId: "VCH-REV-TOTAL",
        lineNo: 1,
        postingDate: "2026-03-31",
        accountCode: "4000",
        accountName: "Consolidated Revenue Credit Balance",
        debitAmount: 0,
        creditAmount: 1250000,
      },
      {
        voucherId: "VCH-COGS-TOTAL",
        lineNo: 2,
        postingDate: "2026-03-31",
        accountCode: "5000",
        accountName: "Consolidated Direct Cloud COGS Debit",
        debitAmount: 525000,
        creditAmount: 0,
      },
    ],
  },
  opex: {
    id: "opex",
    name: "Operating Expenses (OPEX)",
    displayName: "Operating Expenses (研发与营销费用)",
    category: "Opex",
    actual: 410000,
    budget: 450000,
    variance: 40000, // Favorable freeze
    variancePct: "-8.9%",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
    sqlHash: "f1a2b3c4",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND posting_date BETWEEN '2026-01-01' AND '2026-03-31'
  AND account_category = 'Opex'
ORDER BY posting_date DESC
LIMIT 20; -- [Token Hash: #f1a2b3c4]`,
    vouchers: [
      {
        voucherId: "VCH-2026-020",
        lineNo: 1,
        postingDate: "2026-03-25",
        accountCode: "6001",
        accountName: "Engineering & Product Platform Payroll",
        debitAmount: 260000,
        creditAmount: 0,
      },
      {
        voucherId: "VCH-2026-021",
        lineNo: 1,
        postingDate: "2026-03-26",
        accountCode: "6002",
        accountName: "Go-To-Market Sales & Marketing Pipeline",
        debitAmount: 110000,
        creditAmount: 0,
      },
      {
        voucherId: "VCH-2026-022",
        lineNo: 1,
        postingDate: "2026-03-27",
        accountCode: "6003",
        accountName: "General, Admin & SOC-2 Compliance",
        debitAmount: 40000,
        creditAmount: 0,
      },
    ],
  },
  net_income: {
    id: "net_income",
    name: "Net Income",
    displayName: "Net Income (净利润)",
    category: "Profitability",
    actual: 315000,
    budget: 370000,
    variance: -55000,
    variancePct: "-14.9%",
    formula: "gross_profit - opex",
    sqlHash: "99e8d7c6",
    isDerived: true,
    derivedFormulaText: "Gross Profit ($725,000) - OPEX ($410,000) = $315,000 (25.2% Net Margin)",
    sqlQuery: `WITH m_gp AS (
  SELECT (SUM(credit_amount) - SUM(debit_amount)) AS val
  FROM fact_general_ledger
  WHERE scenario = 'actual' AND account_category IN ('Revenue', 'COGS')
),
m_opex AS (
  SELECT (SUM(debit_amount) - SUM(credit_amount)) AS val
  FROM fact_general_ledger
  WHERE scenario = 'actual' AND account_category = 'Opex'
)
SELECT m_gp.val - m_opex.val AS net_income
FROM m_gp, m_opex; -- [Token Hash: #99e8d7c6]`,
    vouchers: [
      {
        voucherId: "VCH-GP-TOTAL",
        lineNo: 1,
        postingDate: "2026-03-31",
        accountCode: "3900",
        accountName: "Gross Operating Profit Balance",
        debitAmount: 0,
        creditAmount: 725000,
      },
      {
        voucherId: "VCH-OPEX-TOTAL",
        lineNo: 2,
        postingDate: "2026-03-31",
        accountCode: "6000",
        accountName: "Operating Expenses (R&D / S&M / G&A)",
        debitAmount: 410000,
        creditAmount: 0,
      },
    ],
  },
};
