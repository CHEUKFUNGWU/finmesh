import { MetricDefinition, VoucherEntry, FINANCIAL_BASELINE_2026_Q1 } from "./financialBaseline";
import { PnLRow } from "@/components/report/PnLTable";
import { PvmBar } from "@/components/cockpit/PvmWaterfallExplorer";

export type IndustryType = "general" | "saas" | "ecommerce" | "retail";

export interface KpiCardConfig {
  id: string;
  label: string;
  value: string;
  budget: string;
  variance: string;
  variancePct: string;
  isFavorable: boolean;
  sparkline: number[];
  unit?: string;
  subtitle?: string;
}

export interface SandboxConfig {
  title: string;
  subtitle: string;
  marginName: string;
  profitName: string;
  baseRevenue: number;
  baseCogs: number;
  baseOpex: number;
  baseNetIncome: number;
  // Drivers
  driver1Label: string;
  driver1Desc: string;
  driver1Unit: string;
  driver1Min: number;
  driver1Max: number;
  driver1Step: number;
  driver1Default: number;

  driver2Label: string;
  driver2Desc: string;
  driver2Unit: string;
  driver2Min: number;
  driver2Max: number;
  driver2Step: number;
  driver2Default: number;

  driver3Label: string;
  driver3Desc: string;
  driver3Unit: string;
  driver3Min: number;
  driver3Max: number;
  driver3Step: number;
  driver3Default: number;

  driver4Label: string;
  driver4Desc: string;
  driver4Unit: string;
  driver4Min: number;
  driver4Max: number;
  driver4Step: number;
  driver4Default: number;
}

export interface IndustryMemoBullet {
  textBefore: string;
  tokenId: string;
  tokenValue: string;
  textAfter: string;
  isNegative?: boolean;
  category?: string;
}

export interface IndustryMemoConfig {
  title: string;
  period: string;
  author: string;
  summary: string;
  bullets: IndustryMemoBullet[];
  recommendations: string[];
}

export interface IndustryPackConfig {
  id: IndustryType;
  name: string;
  displayName: string;
  badge: string;
  description: string;
  kpis: KpiCardConfig[];
  pnlRows: PnLRow[];
  pnlTitle: string;
  pnlSubtitle: string;
  waterfallData: PvmBar[];
  waterfallTitle: string;
  waterfallSubtitle: string;
  waterfallFormulaTitle: string;
  waterfallFormulaDesc: string;
  sandboxConfig: SandboxConfig;
  memo: IndustryMemoConfig;
  metrics: Record<string, MetricDefinition>;
}

// -------------------------------------------------------------------------------------
// 1. General Corporate FP&A Pack (Canonical Baseline)
// -------------------------------------------------------------------------------------
const GENERAL_PACK: IndustryPackConfig = {
  id: "general",
  name: "General Corporate FP&A",
  displayName: "通用财务损益 (General FP&A)",
  badge: "Corporate Baseline",
  description: "标准企业权责发生制损益模型，涵盖营业收入、营业成本、毛利、费用与净利润。",
  kpis: [
    {
      id: "revenue",
      label: "Total Revenue / ARR",
      value: "$1.25M",
      budget: "$1.38M",
      variance: "-$125,000",
      variancePct: "-9.1%",
      isFavorable: false,
      sparkline: [40, 55, 60, 48, 70, 65, 80],
      subtitle: "Actual vs Q1 Budget",
    },
    {
      id: "cogs",
      label: "Cost of Goods Sold (COGS)",
      value: "$525.0K",
      budget: "$555.0K",
      variance: "+$30,000",
      variancePct: "-5.4%",
      isFavorable: true,
      sparkline: [60, 58, 55, 54, 53, 52, 52.5],
      subtitle: "Favorable direct cost reduction",
    },
    {
      id: "gross_profit",
      label: "Gross Profit",
      value: "$725.0K",
      budget: "$820.0K",
      variance: "-$95,000",
      variancePct: "-11.6%",
      isFavorable: false,
      sparkline: [45, 52, 58, 62, 60, 68, 72.5],
      subtitle: "Gross Margin: 58.0% (-160 bps)",
    },
    {
      id: "net_income",
      label: "Net Income (EBIT)",
      value: "$315.0K",
      budget: "$370.0K",
      variance: "-$55,000",
      variancePct: "-14.9%",
      isFavorable: false,
      sparkline: [25, 28, 30, 29, 32, 31, 31.5],
      subtitle: "Net Margin: 25.2% (-170 bps)",
    },
  ],
  pnlTitle: "2026-Q1 Multi-Dimensional P&L Statement",
  pnlSubtitle: "Hierarchical Income Statement with DuckDB Real-time Aggregation",
  pnlRows: Object.values(FINANCIAL_BASELINE_2026_Q1).map((m) => ({
    id: `m-${m.id}`,
    metricName: m.id,
    displayName: m.displayName,
    category: m.category,
    actual: m.actual,
    budget: m.budget,
    variance: m.variance,
    variancePercent: parseFloat(m.variancePct.replace("%", "").replace("+", "")),
    sqlQuery: m.sqlQuery,
    formula: m.formula,
  })),
  waterfallTitle: "2026-Q1 PVM Variance Waterfall",
  waterfallSubtitle: "Dynamic Price-Volume-Mix & Cost Decomposition (Strict Invariant)",
  waterfallFormulaTitle: "Standard Price-Volume-Mix Decomposition Formula",
  waterfallFormulaDesc: "Revenue Variance = Price Effect + Volume Effect + Mix/Cost Effect. Evaluated at item-level against baseline budget.",
  waterfallData: [
    { id: "baseline", label: "2026-Q1 Budget", amount: 1375000, type: "baseline", skus: [] },
    {
      id: "price",
      label: "Price Effect",
      amount: 25000,
      type: "positive",
      skus: [
        { name: "Enterprise Tier", impact: 18000, changePct: "+4.5%" },
        { name: "Integration Seats", impact: 7000, changePct: "+2.1%" },
      ],
    },
    {
      id: "volume",
      label: "Volume Effect",
      amount: -110000,
      type: "negative",
      skus: [
        { name: "APAC Mid-Market", impact: -75000, changePct: "-18.2%" },
        { name: "EMEA Pilot", impact: -35000, changePct: "-8.4%" },
      ],
    },
    {
      id: "mix",
      label: "Mix / Churn Effect",
      amount: -40000,
      type: "negative",
      skus: [
        { name: "Legacy Downgrades", impact: -28000, changePct: "-6.1%" },
        { name: "Partner Reseller", impact: -12000, changePct: "-3.3%" },
      ],
    },
    { id: "actual", label: "Recognized Revenue", amount: 1250000, type: "total", skus: [] },
  ],
  sandboxConfig: {
    title: "Driver Sensitivity & What-If Sandbox",
    subtitle: "Real-time P&L margin recomputation & transactional writeback into DuckDB",
    marginName: "Gross Margin",
    profitName: "Net Income",
    baseRevenue: 1250000,
    baseCogs: 525000,
    baseOpex: 410000,
    baseNetIncome: 315000,
    driver1Label: "Price Adjustment",
    driver1Desc: "1% price lift = +100 bps on Gross Margin",
    driver1Unit: "%",
    driver1Min: -10,
    driver1Max: 10,
    driver1Step: 0.5,
    driver1Default: 0,
    driver2Label: "Cost of Goods Sold (COGS)",
    driver2Desc: "1% cost reduction = +42 bps on Gross Margin",
    driver2Unit: "%",
    driver2Min: -15,
    driver2Max: 15,
    driver2Step: 1,
    driver2Default: -5,
    driver3Label: "Hiring Delay (OpEx)",
    driver3Desc: "Saves ~$13,333/mo non-critical comp",
    driver3Unit: " mos",
    driver3Min: 0,
    driver3Max: 6,
    driver3Step: 1,
    driver3Default: 2,
    driver4Label: "Customer Churn Mitigation",
    driver4Desc: "Preserves recurring customer contracts",
    driver4Unit: "%",
    driver4Min: -5,
    driver4Max: 5,
    driver4Step: 0.5,
    driver4Default: -1,
  },
  memo: {
    title: "Q1 2026 Executive Financial Variance Memo",
    period: "2026-Q1 (Actual vs Budget)",
    author: "FinMesh Autonomous BP",
    summary: "Q1 net revenue concluded at $1.25M against $1.38M budget (-$125k / -9.1%), driven primarily by a $110,000 volume deficit in APAC expansion.",
    bullets: [
      { textBefore: "Total revenue shortfall was contained by price discipline, but volume lagged budget by ", tokenId: "revenue", tokenValue: "-$125,000", textAfter: " in APAC." },
      { textBefore: "Cost of Goods Sold achieved favorable efficiency of ", tokenId: "cogs", tokenValue: "+$30,000", textAfter: " through hosting infrastructure optimization." },
      { textBefore: "Gross profit concluded at ", tokenId: "gross_profit", tokenValue: "$725,000", textAfter: " delivering 58.0% gross margin (-160 bps vs budget)." },
      { textBefore: "Disciplined hiring containment limited OPEX overrun, landing net income at ", tokenId: "net_income", tokenValue: "$315,000", textAfter: " (25.2% net margin)." },
    ],
    recommendations: [
      "Accelerate APAC sales pipeline conversion by offering packaged implementation credits.",
      "Lock in annualized cloud compute savings to preserve the +$30k COGS advantage into Q2.",
      "Maintain the 2-month hiring freeze across non-revenue roles to safeguard $315k net run-rate.",
    ],
  },
  metrics: FINANCIAL_BASELINE_2026_Q1,
};

// -------------------------------------------------------------------------------------
// 2. Enterprise SaaS (B2B) Pack
// -------------------------------------------------------------------------------------
const SAAS_METRICS: Record<string, MetricDefinition> = {
  arr: {
    id: "arr",
    name: "Annual Recurring Revenue (ARR)",
    displayName: "Annual Recurring Revenue (ARR)",
    category: "Revenue",
    actual: 2400000,
    budget: 2600000,
    variance: -200000,
    variancePct: "-7.7%",
    formula: "SUM(credit_amount) - SUM(debit_amount)",
    sqlHash: "s4a5e001",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_code = '4001'
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "SAS-ACT-001", lineNo: 1, postingDate: "2026-03-10", accountCode: "4001", accountName: "SaaS Subscription ARR", debitAmount: 0, creditAmount: 2100000 },
      { voucherId: "SAS-ACT-002", lineNo: 1, postingDate: "2026-03-15", accountCode: "4002", accountName: "Implementation & Advisory Services", debitAmount: 0, creditAmount: 300000 },
    ],
  },
  cloud_cogs: {
    id: "cloud_cogs",
    name: "Cloud Infrastructure COGS",
    displayName: "Cloud Hosting (AWS/GCP)",
    category: "COGS",
    actual: 480000,
    budget: 500000,
    variance: 20000, // Favorable
    variancePct: "-4.0%",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
    sqlHash: "s4a5e002",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_category = 'COGS'
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "SAS-ACT-003", lineNo: 1, postingDate: "2026-03-20", accountCode: "5001", accountName: "Cloud Infrastructure (AWS/GCP)", debitAmount: 320000, creditAmount: 0 },
      { voucherId: "SAS-ACT-004", lineNo: 1, postingDate: "2026-03-20", accountCode: "5002", accountName: "Customer Success & Implementation", debitAmount: 160000, creditAmount: 0 },
    ],
  },
  saas_gross_profit: {
    id: "saas_gross_profit",
    name: "SaaS Gross Profit",
    displayName: "SaaS Gross Profit (80% GM)",
    category: "Profitability",
    actual: 1920000,
    budget: 2100000,
    variance: -180000,
    variancePct: "-8.6%",
    formula: "arr - cloud_cogs",
    sqlHash: "s4a5e003",
    isDerived: true,
    derivedFormulaText: "arr ($2,400,000) - cloud_cogs ($480,000)",
    sqlQuery: `-- Composite Formula: arr - cloud_cogs
SELECT (2400000 - 480000) AS saas_gross_profit;`,
    vouchers: [],
  },
  saas_opex: {
    id: "saas_opex",
    name: "SaaS Operating Expenses (S&M, R&D, G&A)",
    displayName: "SaaS Operating Expenses",
    category: "Opex",
    actual: 1440000,
    budget: 1550000,
    variance: 110000, // Favorable savings
    variancePct: "-7.1%",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
    sqlHash: "s4a5e004",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_category = 'Opex'
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "SAS-ACT-005", lineNo: 1, postingDate: "2026-03-31", accountCode: "6001", accountName: "Sales & Marketing (S&M CAC)", debitAmount: 720000, creditAmount: 0 },
      { voucherId: "SAS-ACT-006", lineNo: 1, postingDate: "2026-03-31", accountCode: "6002", accountName: "Research & Development (R&D)", debitAmount: 520000, creditAmount: 0 },
      { voucherId: "SAS-ACT-007", lineNo: 1, postingDate: "2026-03-31", accountCode: "6003", accountName: "General & Administrative (G&A)", debitAmount: 200000, creditAmount: 0 },
    ],
  },
  saas_ebit: {
    id: "saas_ebit",
    name: "Operating Income (EBIT)",
    displayName: "Operating Income (EBIT)",
    category: "Profitability",
    actual: 480000,
    budget: 550000,
    variance: -70000,
    variancePct: "-12.7%",
    formula: "saas_gross_profit - saas_opex",
    sqlHash: "s4a5e005",
    isDerived: true,
    derivedFormulaText: "saas_gross_profit ($1,920,000) - saas_opex ($1,440,000)",
    sqlQuery: `-- Composite Formula: saas_gross_profit - saas_opex
SELECT (1920000 - 1440000) AS saas_ebit;`,
    vouchers: [],
  },
};

const SAAS_PACK: IndustryPackConfig = {
  id: "saas",
  name: "Enterprise SaaS (B2B)",
  displayName: "企业级 SaaS (Enterprise SaaS)",
  badge: "Subscription Economics",
  description: "经常性收入生命周期管理，聚焦 ARR Bridge、NRR、获客回本周期 (CAC Payback) 与云基础设施成本。",
  kpis: [
    {
      id: "arr",
      label: "Ending ARR",
      value: "$2.40M",
      budget: "$2.60M",
      variance: "-$200,000",
      variancePct: "-7.7%",
      isFavorable: false,
      sparkline: [1.8, 1.95, 2.1, 2.22, 2.3, 2.38, 2.4],
      subtitle: "Subscription Run-rate",
    },
    {
      id: "nrr",
      label: "Net Retention Rate (NRR)",
      value: "114.2%",
      budget: "118.0%",
      variance: "-3.8%",
      variancePct: "-3.8%",
      isFavorable: false,
      sparkline: [120, 118, 117, 116, 115, 114.5, 114.2],
      subtitle: "Healthy > 110% benchmark",
    },
    {
      id: "cac_payback",
      label: "CAC Payback Period",
      value: "14.2 mos",
      budget: "12.0 mos",
      variance: "+2.2 mos",
      variancePct: "+18.3%",
      isFavorable: false,
      sparkline: [11.5, 12.0, 12.8, 13.2, 13.8, 14.0, 14.2],
      subtitle: "S&M Spend / Net New ARR",
    },
    {
      id: "rule_of_40",
      label: "Rule of 40 Score",
      value: "42.5%",
      budget: "45.0%",
      variance: "-2.5%",
      variancePct: "-5.6%",
      isFavorable: true,
      sparkline: [48, 46, 45, 43, 44, 43, 42.5],
      subtitle: "Growth (32.5%) + FCF (10.0%) >= 40%",
    },
  ],
  pnlTitle: "2026-Q1 SaaS P&L & Subscription Margins",
  pnlSubtitle: "Recurring Revenue & Cloud Unit Economics (DuckDB Verified)",
  pnlRows: [
    { id: "m-arr", metricName: "arr", displayName: "1. Annual Recurring Revenue (ARR)", category: "Revenue", actual: 2400000, budget: 2600000, variance: -200000, variancePercent: -7.7, sqlQuery: SAAS_METRICS.arr.sqlQuery, formula: SAAS_METRICS.arr.formula },
    { id: "m-cloud", metricName: "cloud_cogs", displayName: "2. Cloud Hosting & Support (COGS)", category: "COGS", actual: 480000, budget: 500000, variance: 20000, variancePercent: -4.0, sqlQuery: SAAS_METRICS.cloud_cogs.sqlQuery, formula: SAAS_METRICS.cloud_cogs.formula },
    { id: "m-gp", metricName: "saas_gross_profit", displayName: "3. SaaS Gross Profit (80% Margin)", category: "Profitability", actual: 1920000, budget: 2100000, variance: -180000, variancePercent: -8.6, sqlQuery: SAAS_METRICS.saas_gross_profit.sqlQuery, formula: SAAS_METRICS.saas_gross_profit.formula },
    { id: "m-opex", metricName: "saas_opex", displayName: "4. Operating Expenses (S&M, R&D, G&A)", category: "Opex", actual: 1440000, budget: 1550000, variance: 110000, variancePercent: -7.1, sqlQuery: SAAS_METRICS.saas_opex.sqlQuery, formula: SAAS_METRICS.saas_opex.formula },
    { id: "m-ebit", metricName: "saas_ebit", displayName: "5. Operating Income (EBIT)", category: "Profitability", actual: 480000, budget: 550000, variance: -70000, variancePercent: -12.7, sqlQuery: SAAS_METRICS.saas_ebit.sqlQuery, formula: SAAS_METRICS.saas_ebit.formula },
  ],
  waterfallTitle: "2026-Q1 SaaS ARR Bridge Waterfall",
  waterfallSubtitle: "Recurring Revenue Movement: New, Expansion, Contraction & Churn",
  waterfallFormulaTitle: "ARR Bridge Algebraic Movement Formula",
  waterfallFormulaDesc: "Ending ARR = Starting ARR + New-Logo ARR + Expansion ARR - Contraction ARR - Churn ARR.",
  waterfallData: [
    { id: "starting", label: "Starting ARR (Q4)", amount: 2000000, type: "baseline", skus: [] },
    {
      id: "new_logo",
      label: "New-Logo ARR",
      amount: 450000,
      type: "positive",
      skus: [
        { name: "FinTech Enterprise Deal", impact: 280000, changePct: "+62.2%" },
        { name: "Global Logistics Pilot", impact: 170000, changePct: "+37.8%" },
      ],
    },
    {
      id: "expansion",
      label: "Expansion ARR",
      amount: 220000,
      type: "positive",
      skus: [
        { name: "Seat Upsell Americas", impact: 140000, changePct: "+63.6%" },
        { name: "API Usage Tiers EMEA", impact: 80000, changePct: "+36.4%" },
      ],
    },
    {
      id: "contraction",
      label: "Contraction ARR",
      amount: -80000,
      type: "negative",
      skus: [
        { name: "APAC Seat Reduction", impact: -80000, changePct: "-100%" },
      ],
    },
    {
      id: "churn",
      label: "Churn ARR",
      amount: -190000,
      type: "negative",
      skus: [
        { name: "Mid-Market Retail Churn", impact: -120000, changePct: "-63.2%" },
        { name: "Early Stage Startups Churn", impact: -70000, changePct: "-36.8%" },
      ],
    },
    { id: "ending", label: "Ending ARR (Q1)", amount: 2400000, type: "total", skus: [] },
  ],
  sandboxConfig: {
    title: "SaaS ARR & Unit Economics Sandbox",
    subtitle: "Simulate AE Quota Ramps, CAC Payback and Cloud Infrastructure efficiency",
    marginName: "Subscription Gross Margin",
    profitName: "Operating Profit (EBIT)",
    baseRevenue: 2400000,
    baseCogs: 480000,
    baseOpex: 1440000,
    baseNetIncome: 480000,
    driver1Label: "AE Quota Ramp & Capacity",
    driver1Desc: "10% productivity increase = +$180k Net New ARR",
    driver1Unit: "%",
    driver1Min: -25,
    driver1Max: 25,
    driver1Step: 1,
    driver1Default: 0,
    driver2Label: "Cloud Hosting Unit Cost (AWS)",
    driver2Desc: "Reserved instance savings reduce COGS",
    driver2Unit: "%",
    driver2Min: -20,
    driver2Max: 20,
    driver2Step: 1,
    driver2Default: -8,
    driver3Label: "S&M Headcount Freeze",
    driver3Desc: "Quarterly savings in outbound SDR/AE payroll",
    driver3Unit: " mos",
    driver3Min: 0,
    driver3Max: 6,
    driver3Step: 1,
    driver3Default: 2,
    driver4Label: "Gross Churn Rate Target",
    driver4Desc: "Customer Success intervention reduces ARR loss",
    driver4Unit: "%",
    driver4Min: -5,
    driver4Max: 5,
    driver4Step: 0.5,
    driver4Default: -1.5,
  },
  memo: {
    title: "Q1 2026 SaaS Finance BP Variance Memo",
    period: "2026-Q1 (Actual vs Budget)",
    author: "FinMesh SaaS FBP Engine",
    summary: "Ending ARR climbed to $2.40M with healthy 114.2% NRR. While New-Logo ARR outperformed plan by $450k, mid-market churn ($190k) lengthened CAC Payback to 14.2 months.",
    bullets: [
      { textBefore: "Ending ARR closed at ", tokenId: "arr", tokenValue: "$2,400,000", textAfter: " achieving 32.5% YoY recurring revenue expansion." },
      { textBefore: "Cloud infrastructure COGS improved favorably by ", tokenId: "cloud_cogs", tokenValue: "+$20,000", textAfter: " via reserved instances on AWS." },
      { textBefore: "SaaS Gross Profit delivered ", tokenId: "saas_gross_profit", tokenValue: "$1,920,000", textAfter: " maintaining a resilient 80.0% subscription gross margin." },
      { textBefore: "Disciplined R&D and hiring control generated ", tokenId: "saas_ebit", tokenValue: "$480,000", textAfter: " in EBIT, preserving a Rule of 40 score of 42.5%." },
    ],
    recommendations: [
      "Implement proactive health-score alerts in Customer Success to curb mid-market $190k churn.",
      "Reallocate $60k discretionary marketing budget into high-converting enterprise ABM campaigns.",
      "Lock in annual EDP commitment with AWS to sustain 80%+ subscription gross margin.",
    ],
  },
  metrics: SAAS_METRICS,
};

// -------------------------------------------------------------------------------------
// 3. E-Commerce & DTC Pack (CM1 - CM3 Tiered Margins)
// -------------------------------------------------------------------------------------
const ECM_METRICS: Record<string, MetricDefinition> = {
  gmv: {
    id: "gmv",
    name: "Gross Merchandise Value (GMV)",
    displayName: "Gross Merchandise Value (GMV)",
    category: "Revenue",
    actual: 3800000,
    budget: 4200000,
    variance: -400000,
    variancePct: "-9.5%",
    formula: "SUM(credit_amount)",
    sqlHash: "ecm0001",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_code = '4001'
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "ECM-ACT-001", lineNo: 3, postingDate: "2026-03-10", accountCode: "4001", accountName: "Gross Merchandise Value (GMV)", debitAmount: 0, creditAmount: 3800000 },
    ],
  },
  net_sales: {
    id: "net_sales",
    name: "Net Delivered Sales",
    displayName: "Net Delivered Sales (Excl. Returns)",
    category: "Revenue",
    actual: 3040000,
    budget: 3400000,
    variance: -360000,
    variancePct: "-10.6%",
    formula: "SUM(credit_amount) - SUM(debit_amount)",
    sqlHash: "ecm0002",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_category = 'Revenue'
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "ECM-ACT-001", lineNo: 1, postingDate: "2026-03-10", accountCode: "1001", accountName: "Payment Gateway / Cash", debitAmount: 3040000, creditAmount: 0 },
      { voucherId: "ECM-ACT-001", lineNo: 2, postingDate: "2026-03-10", accountCode: "4002", accountName: "Returns & Refund Allowances", debitAmount: 760000, creditAmount: 0 },
      { voucherId: "ECM-ACT-001", lineNo: 3, postingDate: "2026-03-10", accountCode: "4001", accountName: "Gross Merchandise Value (GMV)", debitAmount: 0, creditAmount: 3800000 },
    ],
  },
  cm1: {
    id: "cm1",
    name: "Contribution Margin 1 (CM1)",
    displayName: "Contribution Margin 1 (Product Margin)",
    category: "Profitability",
    actual: 1824000,
    budget: 2050000,
    variance: -226000,
    variancePct: "-11.0%",
    formula: "net_sales - product_cogs",
    sqlHash: "ecm0003",
    isDerived: true,
    derivedFormulaText: "Net Sales ($3,040,000) - Product COGS ($1,216,000)",
    sqlQuery: `-- Composite Formula: net_sales - product_cogs
SELECT (3040000 - 1216000) AS cm1;`,
    vouchers: [
      { voucherId: "ECM-ACT-002", lineNo: 1, postingDate: "2026-03-15", accountCode: "5001", accountName: "Purchased Inventory / First-leg Freight", debitAmount: 1216000, creditAmount: 0 },
    ],
  },
  cm2: {
    id: "cm2",
    name: "Contribution Margin 2 (CM2)",
    displayName: "Contribution Margin 2 (Fulfillment Margin)",
    category: "Profitability",
    actual: 1368000,
    budget: 1570000,
    variance: -202000,
    variancePct: "-12.9%",
    formula: "cm1 - fulfillment_cost",
    sqlHash: "ecm0004",
    isDerived: true,
    derivedFormulaText: "CM1 ($1,824,000) - Fulfillment Freight ($456,000)",
    sqlQuery: `-- Composite Formula: cm1 - fulfillment_cost
SELECT (1824000 - 456000) AS cm2;`,
    vouchers: [
      { voucherId: "ECM-ACT-003", lineNo: 1, postingDate: "2026-03-20", accountCode: "5002", accountName: "Warehousing, Packaging & Last-mile Freight", debitAmount: 456000, creditAmount: 0 },
    ],
  },
  cm3: {
    id: "cm3",
    name: "Contribution Margin 3 (CM3)",
    displayName: "Contribution Margin 3 (Marketing Margin)",
    category: "Profitability",
    actual: 638400,
    budget: 790000,
    variance: -151600,
    variancePct: "-19.2%",
    formula: "cm2 - ad_spend",
    sqlHash: "ecm0005",
    isDerived: true,
    derivedFormulaText: "CM2 ($1,368,000) - Performance Ad Spend ($729,600)",
    sqlQuery: `-- Composite Formula: cm2 - ad_spend
SELECT (1368000 - 729600) AS cm3;`,
    vouchers: [
      { voucherId: "ECM-ACT-004", lineNo: 1, postingDate: "2026-03-25", accountCode: "6001", accountName: "Performance Marketing Ad Spend", debitAmount: 729600, creditAmount: 0 },
      { voucherId: "ECM-ACT-005", lineNo: 1, postingDate: "2026-03-31", accountCode: "6002", accountName: "General E-Commerce Platform OpEx", debitAmount: 380000, creditAmount: 0 },
    ],
  },
};

const ECM_PACK: IndustryPackConfig = {
  id: "ecommerce",
  name: "E-Commerce & DTC",
  displayName: "电商与 DTC (E-Commerce / DTC)",
  badge: "Tiered CM Model",
  description: "多层阶梯贡献毛利模型 (CM1/CM2/CM3)，穿透解构流量投放 ROAS、履约仓配与退货逆向损耗。",
  kpis: [
    {
      id: "gmv",
      label: "Gross Merchandise Value",
      value: "$3.80M",
      budget: "$4.20M",
      variance: "-$400,000",
      variancePct: "-9.5%",
      isFavorable: false,
      sparkline: [3.1, 3.4, 3.6, 3.5, 3.7, 3.8, 3.8],
      subtitle: "Gross Platform Checkout",
    },
    {
      id: "net_sales",
      label: "Net Delivered Sales",
      value: "$3.04M",
      budget: "$3.40M",
      variance: "-$360,000",
      variancePct: "-10.6%",
      isFavorable: false,
      sparkline: [2.5, 2.7, 2.9, 2.8, 3.0, 3.02, 3.04],
      subtitle: "Return Rate: 20.0%",
    },
    {
      id: "cm3",
      label: "Contribution Margin 3",
      value: "$638.4K",
      budget: "$790.0K",
      variance: "-$151,600",
      variancePct: "-19.2%",
      isFavorable: false,
      sparkline: [0.55, 0.60, 0.62, 0.61, 0.64, 0.63, 0.638],
      subtitle: "CM3 Margin: 21.0%",
    },
    {
      id: "blended_roas",
      label: "Blended ROAS",
      value: "4.17x",
      budget: "4.35x",
      variance: "-0.18x",
      variancePct: "-4.1%",
      isFavorable: true,
      sparkline: [3.8, 4.0, 4.2, 4.1, 4.3, 4.2, 4.17],
      subtitle: "Breakeven Threshold: 3.1x",
    },
  ],
  pnlTitle: "2026-Q1 DTC Tiered Contribution Margin (CM1 - CM3)",
  pnlSubtitle: "Granular Product, Fulfillment, and Marketing Cash Contributions",
  pnlRows: [
    { id: "m-gmv", metricName: "gmv", displayName: "1. Gross Merchandise Value (GMV)", category: "Revenue", actual: 3800000, budget: 4200000, variance: -400000, variancePercent: -9.5, sqlQuery: ECM_METRICS.gmv.sqlQuery, formula: ECM_METRICS.gmv.formula },
    { id: "m-net", metricName: "net_sales", displayName: "2. Net Delivered Sales (Excl. Returns)", category: "Revenue", actual: 3040000, budget: 3400000, variance: -360000, variancePercent: -10.6, sqlQuery: ECM_METRICS.net_sales.sqlQuery, formula: ECM_METRICS.net_sales.formula },
    { id: "m-cm1", metricName: "cm1", displayName: "3. Contribution Margin 1 (CM1 - 60% Margin)", category: "Profitability", actual: 1824000, budget: 2050000, variance: -226000, variancePercent: -11.0, sqlQuery: ECM_METRICS.cm1.sqlQuery, formula: ECM_METRICS.cm1.formula },
    { id: "m-cm2", metricName: "cm2", displayName: "4. Contribution Margin 2 (CM2 - After Freight)", category: "Profitability", actual: 1368000, budget: 1570000, variance: -202000, variancePercent: -12.9, sqlQuery: ECM_METRICS.cm2.sqlQuery, formula: ECM_METRICS.cm2.formula },
    { id: "m-cm3", metricName: "cm3", displayName: "5. Contribution Margin 3 (CM3 - Post-Ad Cash)", category: "Profitability", actual: 638400, budget: 790000, variance: -151600, variancePercent: -19.2, sqlQuery: ECM_METRICS.cm3.sqlQuery, formula: ECM_METRICS.cm3.formula },
  ],
  waterfallTitle: "2026-Q1 E-Commerce CM Waterfall",
  waterfallSubtitle: "Gross Transaction to Net Retained Cashflow Decomposition",
  waterfallFormulaTitle: "Tiered Contribution Margin Accounting Invariant",
  waterfallFormulaDesc: "CM3 = GMV - Refunds/Returns - Product COGS - Warehousing & Last-Mile Freight - Performance Ad Spend.",
  waterfallData: [
    { id: "gmv_start", label: "Gross GMV", amount: 3800000, type: "baseline", skus: [] },
    {
      id: "returns",
      label: "Refunds & Returns (20%)",
      amount: -760000,
      type: "negative",
      skus: [
        { name: "Apparel Sizing Returns", impact: -480000, changePct: "-63.2%" },
        { name: "Damaged Delivery Refusals", impact: -280000, changePct: "-36.8%" },
      ],
    },
    {
      id: "cogs_first",
      label: "Product COGS & Import",
      amount: -1216000,
      type: "negative",
      skus: [
        { name: "Factory BOM Procurement", impact: -960000, changePct: "-78.9%" },
        { name: "Customs & Port Duties", impact: -256000, changePct: "-21.1%" },
      ],
    },
    {
      id: "fulfillment",
      label: "Fulfillment & Last-Mile",
      amount: -456000,
      type: "negative",
      skus: [
        { name: "Express Courier Carrier", impact: -310000, changePct: "-68.0%" },
        { name: "Box Packaging & Tape", impact: -146000, changePct: "-32.0%" },
      ],
    },
    {
      id: "ad_spend",
      label: "Performance Ad Spend",
      amount: -729600,
      type: "negative",
      skus: [
        { name: "Search & Social Ads", impact: -520000, changePct: "-71.3%" },
        { name: "Influencer Commission", impact: -209600, changePct: "-28.7%" },
      ],
    },
    { id: "cm3_end", label: "CM3 Retained Margin", amount: 638400, type: "total", skus: [] },
  ],
  sandboxConfig: {
    title: "E-Commerce ROAS & Fulfillment Sandbox",
    subtitle: "Simulate Breakeven ROAS, Return Rates, and Warehouse Freight Levers",
    marginName: "CM2 Fulfillment Margin",
    profitName: "CM3 Marketing Margin",
    baseRevenue: 3040000,
    baseCogs: 1216000,
    baseOpex: 1185600,
    baseNetIncome: 638400,
    driver1Label: "Ad Spend ROAS Efficiency",
    driver1Desc: "Target ROAS expansion lowers ad cost per conversion",
    driver1Unit: "x",
    driver1Min: -1.0,
    driver1Max: 1.5,
    driver1Step: 0.1,
    driver1Default: 0.2,
    driver2Label: "Order Return Rate Reduction",
    driver2Desc: "Improved size guidance lowers return reverse freight",
    driver2Unit: "%",
    driver2Min: -8,
    driver2Max: 8,
    driver2Step: 0.5,
    driver2Default: -2.5,
    driver3Label: "Last-Mile Carrier Negotiation",
    driver3Desc: "Per-parcel volume discount saves shipping fees",
    driver3Unit: "%",
    driver3Min: -15,
    driver3Max: 10,
    driver3Step: 1,
    driver3Default: -5,
    driver4Label: "Product Bundle Average Order Value",
    driver4Desc: "AOV lift amortizes packaging & fulfillment costs",
    driver4Unit: "%",
    driver4Min: -10,
    driver4Max: 20,
    driver4Step: 1,
    driver4Default: 5,
  },
  memo: {
    title: "Q1 2026 E-Commerce Unit Economics Memo",
    period: "2026-Q1 (Actual vs Plan)",
    author: "FinMesh DTC Finance BP",
    summary: "Gross GMV reached $3.80M, delivering $3.04M in net revenue after a 20.0% return rate. Blended ROAS performed at 4.17x well above the 3.1x breakeven threshold, securing $638.4k in CM3 margin.",
    bullets: [
      { textBefore: "Net delivered sales stood at ", tokenId: "net_sales", tokenValue: "$3,040,000", textAfter: " after absorbing $760k in returns." },
      { textBefore: "Product margin CM1 generated ", tokenId: "cm1", tokenValue: "$1,824,000", textAfter: " maintaining 60.0% initial gross margin." },
      { textBefore: "Warehousing and last-mile freight consumed $456k, leaving CM2 at ", tokenId: "cm2", tokenValue: "$1,368,000", textAfter: " (45.0% margin)." },
      { textBefore: "Performance ad spend was controlled at $729.6k, yielding a final CM3 of ", tokenId: "cm3", tokenValue: "$638,400", textAfter: " (21.0% cash contribution)." },
    ],
    recommendations: [
      "Target apparel SKU size charts to compress 20% return rate down to 17.5%, unlocking ~$95k net revenue.",
      "Consolidate shipping volume into regional 3PL hubs to reduce parcel delivery cost by 5%.",
      "Scale ad spend on campaigns with ROAS > 4.5x while pruning long-tail keywords below 3.1x.",
    ],
  },
  metrics: ECM_METRICS,
};

// -------------------------------------------------------------------------------------
// 4. Omnichannel Retail & FMCG Pack (GTN Waterfall)
// -------------------------------------------------------------------------------------
const RETAIL_METRICS: Record<string, MetricDefinition> = {
  gross_sales: {
    id: "gross_sales",
    name: "Gross Sales (List Price)",
    displayName: "Gross Sales at List Price",
    category: "Revenue",
    actual: 5200000,
    budget: 5500000,
    variance: -300000,
    variancePct: "-5.5%",
    formula: "SUM(credit_amount)",
    sqlHash: "ret0001",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_code = '4001'
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "RET-ACT-001", lineNo: 5, postingDate: "2026-03-12", accountCode: "4001", accountName: "Gross Sales at List Price", debitAmount: 0, creditAmount: 5200000 },
    ],
  },
  trade_spend: {
    id: "trade_spend",
    name: "Total Trade Spend (GTN Deductions)",
    displayName: "Trade Spend & Channel Rebates",
    category: "Revenue",
    actual: 1040000,
    budget: 1100000,
    variance: 60000, // Favorable lower spend
    variancePct: "-5.5%",
    formula: "SUM(debit_amount)",
    sqlHash: "ret0002",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_code IN ('4101', '4102', '4103')
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "RET-ACT-001", lineNo: 2, postingDate: "2026-03-12", accountCode: "4101", accountName: "Off-Invoice Commercial Discounts", debitAmount: 420000, creditAmount: 0 },
      { voucherId: "RET-ACT-001", lineNo: 3, postingDate: "2026-03-12", accountCode: "4102", accountName: "Channel Performance Rebates", debitAmount: 310000, creditAmount: 0 },
      { voucherId: "RET-ACT-001", lineNo: 4, postingDate: "2026-03-12", accountCode: "4103", accountName: "Trade Promotions & Scan-backs", debitAmount: 310000, creditAmount: 0 },
    ],
  },
  retail_net_sales: {
    id: "retail_net_sales",
    name: "Net Sales (GTN)",
    displayName: "Net Sales (After Trade Spend)",
    category: "Revenue",
    actual: 4160000,
    budget: 4400000,
    variance: -240000,
    variancePct: "-5.5%",
    formula: "gross_sales - trade_spend",
    sqlHash: "ret0003",
    isDerived: true,
    derivedFormulaText: "Gross Sales ($5,200,000) - Trade Spend ($1,040,000)",
    sqlQuery: `-- Composite Formula: gross_sales - trade_spend
SELECT (5200000 - 1040000) AS retail_net_sales;`,
    vouchers: [],
  },
  retail_cogs: {
    id: "retail_cogs",
    name: "Standard Manufacturing COGS",
    displayName: "Manufacturing & Raw Materials",
    category: "COGS",
    actual: 2080000,
    budget: 2200000,
    variance: 120000, // Favorable
    variancePct: "-5.5%",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
    sqlHash: "ret0004",
    sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount
FROM fact_general_ledger
WHERE scenario = 'actual' AND account_code = '5001'
ORDER BY posting_date DESC;`,
    vouchers: [
      { voucherId: "RET-ACT-002", lineNo: 1, postingDate: "2026-03-18", accountCode: "5001", accountName: "Standard Production COGS & Raw Materials", debitAmount: 2080000, creditAmount: 0 },
    ],
  },
  store_operating_income: {
    id: "store_operating_income",
    name: "Operating Income (EBIT)",
    displayName: "Store & Brand Operating Income",
    category: "Profitability",
    actual: 470000,
    budget: 550000,
    variance: -80000,
    variancePct: "-14.5%",
    formula: "retail_net_sales - retail_cogs - store_opex - hq_opex",
    sqlHash: "ret0005",
    isDerived: true,
    derivedFormulaText: "Net Sales ($4.16M) - COGS ($2.08M) - Store OpEx ($1.19M) - HQ ($420k)",
    sqlQuery: `-- Composite Formula: Net Sales - COGS - Store OpEx - HQ OpEx
SELECT (4160000 - 2080000 - 1190000 - 420000) AS store_operating_income;`,
    vouchers: [
      { voucherId: "RET-ACT-003", lineNo: 1, postingDate: "2026-03-25", accountCode: "6001", accountName: "Store Rent & Frontline Staffing", debitAmount: 1190000, creditAmount: 0 },
      { voucherId: "RET-ACT-004", lineNo: 1, postingDate: "2026-03-31", accountCode: "6002", accountName: "Headquarters & Supply Chain OpEx", debitAmount: 420000, creditAmount: 0 },
    ],
  },
};

const RETAIL_PACK: IndustryPackConfig = {
  id: "retail",
  name: "Omnichannel Retail & FMCG",
  displayName: "连锁零售与快消 (Retail / FMCG)",
  badge: "GTN Trade Spend",
  description: "毛利瀑布流 GTN 贸易支出治理（票面即时折让、阶梯返点、扫码促销）与单店模型监控。",
  kpis: [
    {
      id: "gross_sales",
      label: "Gross Sales (List Price)",
      value: "$5.20M",
      budget: "$5.50M",
      variance: "-$300,000",
      variancePct: "-5.5%",
      isFavorable: false,
      sparkline: [4.2, 4.5, 4.8, 4.9, 5.1, 5.15, 5.2],
      subtitle: "Nominal List Value",
    },
    {
      id: "retail_net_sales",
      label: "Net Sales (GTN)",
      value: "$4.16M",
      budget: "$4.40M",
      variance: "-$240,000",
      variancePct: "-5.5%",
      isFavorable: false,
      sparkline: [3.4, 3.6, 3.8, 3.9, 4.08, 4.12, 4.16],
      subtitle: "GTN Spend Rate: 20.0%",
    },
    {
      id: "store_operating_income",
      label: "Operating Income",
      value: "$470.0K",
      budget: "$550.0K",
      variance: "-$80,000",
      variancePct: "-14.5%",
      isFavorable: false,
      sparkline: [0.4, 0.42, 0.45, 0.44, 0.46, 0.48, 0.47],
      subtitle: "Store Contribution: $890k",
    },
    {
      id: "trade_promo_roi",
      label: "Trade Promo ROI",
      value: "18.5%",
      budget: "17.0%",
      variance: "+1.5%",
      variancePct: "+8.8%",
      isFavorable: true,
      sparkline: [15, 16, 17, 16.5, 18, 18.2, 18.5],
      subtitle: "Incremental Margin / Spend",
    },
  ],
  pnlTitle: "2026-Q1 Retail & FMCG Gross-to-Net (GTN) P&L",
  pnlSubtitle: "Channel Trade Deductions, Manufacturing Costs & Store Economics",
  pnlRows: [
    { id: "m-gs", metricName: "gross_sales", displayName: "1. Gross Sales at List Price", category: "Revenue", actual: 5200000, budget: 5500000, variance: -300000, variancePercent: -5.5, sqlQuery: RETAIL_METRICS.gross_sales.sqlQuery, formula: RETAIL_METRICS.gross_sales.formula },
    { id: "m-ts", metricName: "trade_spend", displayName: "2. Trade Deductions & Rebates (GTN)", category: "Revenue", actual: 1040000, budget: 1100000, variance: 60000, variancePercent: -5.5, sqlQuery: RETAIL_METRICS.trade_spend.sqlQuery, formula: RETAIL_METRICS.trade_spend.formula },
    { id: "m-ns", metricName: "retail_net_sales", displayName: "3. Net Revenue (After Discounts)", category: "Revenue", actual: 4160000, budget: 4400000, variance: -240000, variancePercent: -5.5, sqlQuery: RETAIL_METRICS.retail_net_sales.sqlQuery, formula: RETAIL_METRICS.retail_net_sales.formula },
    { id: "m-cogs", metricName: "retail_cogs", displayName: "4. Manufacturing & Raw Material COGS", category: "COGS", actual: 2080000, budget: 2200000, variance: 120000, variancePercent: -5.5, sqlQuery: RETAIL_METRICS.retail_cogs.sqlQuery, formula: RETAIL_METRICS.retail_cogs.formula },
    { id: "m-ebit", metricName: "store_operating_income", displayName: "5. Operating Income (EBIT)", category: "Profitability", actual: 470000, budget: 550000, variance: -80000, variancePercent: -14.5, sqlQuery: RETAIL_METRICS.store_operating_income.sqlQuery, formula: RETAIL_METRICS.store_operating_income.formula },
  ],
  waterfallTitle: "2026-Q1 Retail GTN Waterfall",
  waterfallSubtitle: "Nominal Gross Sales to Operating Income Bridge",
  waterfallFormulaTitle: "GTN Leakage Governance Formula",
  waterfallFormulaDesc: "Operating Income = List Sales - Off-Invoice Discounts - Channel Rebates - Trade Promotions - Factory COGS - Store Fixed OpEx.",
  waterfallData: [
    { id: "list_sales", label: "Gross List Sales", amount: 5200000, type: "baseline", skus: [] },
    {
      id: "off_invoice",
      label: "Off-Invoice Discounts",
      amount: -420000,
      type: "negative",
      skus: [
        { name: "National Wholesaler Contract", impact: -280000, changePct: "-66.7%" },
        { name: "Early Payment Terms", impact: -140000, changePct: "-33.3%" },
      ],
    },
    {
      id: "rebates",
      label: "Channel Rebates",
      amount: -310000,
      type: "negative",
      skus: [
        { name: "Supermarket Volume Tier 1", impact: -200000, changePct: "-64.5%" },
        { name: "Regional Exclusive Bonus", impact: -110000, changePct: "-35.5%" },
      ],
    },
    {
      id: "promotions",
      label: "Scan-backs & Display",
      amount: -310000,
      type: "negative",
      skus: [
        { name: "Endcap Feature Display", impact: -190000, changePct: "-61.3%" },
        { name: "POS Scan-back Subsidy", impact: -120000, changePct: "-38.7%" },
      ],
    },
    {
      id: "manufacturing",
      label: "Factory COGS",
      amount: -2080000,
      type: "negative",
      skus: [
        { name: "Raw Material Ingredients", impact: -1400000, changePct: "-67.3%" },
        { name: "Packaging Materials", impact: -680000, changePct: "-32.7%" },
      ],
    },
    {
      id: "store_fixed",
      label: "Store Rent & Staff",
      amount: -1610000,
      type: "negative",
      skus: [
        { name: "Prime Mall Leases", impact: -1190000, changePct: "-73.9%" },
        { name: "HQ Central Logistics", impact: -420000, changePct: "-26.1%" },
      ],
    },
    { id: "operating_ret", label: "Operating Income", amount: 470000, type: "total", skus: [] },
  ],
  sandboxConfig: {
    title: "Retail GTN & Unit Economics Sandbox",
    subtitle: "Simulate Trade Spend ROI, Raw Material Inflation, and Store Footprint levers",
    marginName: "Gross Margin (After Trade)",
    profitName: "Operating Income",
    baseRevenue: 4160000,
    baseCogs: 2080000,
    baseOpex: 1610000,
    baseNetIncome: 470000,
    driver1Label: "Trade Spend Reduction",
    driver1Desc: "Pruning unprofitable scan-backs recovers margin",
    driver1Unit: "%",
    driver1Min: -5,
    driver1Max: 5,
    driver1Step: 0.5,
    driver1Default: -1.5,
    driver2Label: "Raw Material BOM Inflation",
    driver2Desc: "Bulk commodity price hedging impact on factory cost",
    driver2Unit: "%",
    driver2Min: -10,
    driver2Max: 10,
    driver2Step: 1,
    driver2Default: -3,
    driver3Label: "Store Staffing Efficiency",
    driver3Desc: "Optimized shift scheduling reduces frontline payroll",
    driver3Unit: " mos",
    driver3Min: 0,
    driver3Max: 6,
    driver3Step: 1,
    driver3Default: 2,
    driver4Label: "Flagship Store Footprint Expansion",
    driver4Desc: "High-density retail unit opening plan",
    driver4Unit: "%",
    driver4Min: -10,
    driver4Max: 20,
    driver4Step: 1,
    driver4Default: 5,
  },
  memo: {
    title: "Q1 2026 Omnichannel Retail & FMCG Variance Memo",
    period: "2026-Q1 (Actual vs Budget)",
    author: "FinMesh Retail Finance BP",
    summary: "Gross list sales reached $5.20M with disciplined 20.0% GTN trade spend ($1.04M). Favorable commodity purchasing saved $120k in factory COGS, generating $470k in total operating profit.",
    bullets: [
      { textBefore: "Gross sales closed at ", tokenId: "gross_sales", tokenValue: "$5,200,000", textAfter: " supported by nationwide retail distribution." },
      { textBefore: "Trade spend discipline saved ", tokenId: "trade_spend", tokenValue: "+$60,000", textAfter: " by renegotiating off-invoice discount tiers." },
      { textBefore: "Net revenue landed at ", tokenId: "retail_net_sales", tokenValue: "$4,160,000", textAfter: " after all trade promotions and channel rebates." },
      { textBefore: "Operating income finished at ", tokenId: "store_operating_income", tokenValue: "$470,000", textAfter: " with positive unit economics across 82 flagship doors." },
    ],
    recommendations: [
      "Prune bottom 15% underperforming promotional endcaps that fail the 15% incremental ROI bar.",
      "Expand forward hedging contracts on sugar and packaging pulp to lock in factory COGS savings.",
      "Pilot dynamic staffing schedules in high-traffic tier-1 stores to improve labor cost efficiency by 4%.",
    ],
  },
  metrics: RETAIL_METRICS,
};

export const INDUSTRY_PACKS: Record<IndustryType, IndustryPackConfig> = {
  general: GENERAL_PACK,
  saas: SAAS_PACK,
  ecommerce: ECM_PACK,
  retail: RETAIL_PACK,
};
