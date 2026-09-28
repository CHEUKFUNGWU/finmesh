"use client";

import React from "react";

export interface PnLRow {
  id: string;
  metricName: string;
  displayName: string;
  category: "Revenue" | "COGS" | "Profitability" | "Opex";
  actual: number;
  budget: number;
  variance: number;
  variancePercent: number;
  sqlQuery: string;
  formula: string;
}

export const mockPnLData: PnLRow[] = [
  {
    id: "m-rev",
    metricName: "revenue",
    displayName: "Total Revenue / ARR",
    category: "Revenue",
    actual: 1250000,
    budget: 1375000,
    variance: -125000,
    variancePercent: -9.1,
    sqlQuery: "SELECT COALESCE(SUM(credit_amount) - SUM(debit_amount), 0.0) FROM fact_general_ledger WHERE scenario = 'actual' AND (account_category = 'Revenue')",
    formula: "SUM(credit_amount) - SUM(debit_amount)",
  },
  {
    id: "m-cogs",
    metricName: "cogs",
    displayName: "Cost of Goods Sold (COGS)",
    category: "COGS",
    actual: 525000,
    budget: 555000,
    variance: 30000,
    variancePercent: -5.4,
    sqlQuery: "SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0.0) FROM fact_general_ledger WHERE scenario = 'actual' AND (account_category = 'COGS')",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
  },
  {
    id: "m-gp",
    metricName: "gross_profit",
    displayName: "Gross Profit",
    category: "Profitability",
    actual: 725000,
    budget: 820000,
    variance: -95000,
    variancePercent: -11.6,
    sqlQuery: "Computed from (revenue - cogs)",
    formula: "revenue - cogs",
  },
  {
    id: "m-opex",
    metricName: "opex",
    displayName: "Operating Expenses (R&D & G&A)",
    category: "Opex",
    actual: 410000,
    budget: 450000,
    variance: 40000,
    variancePercent: -8.9,
    sqlQuery: "SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0.0) FROM fact_general_ledger WHERE scenario = 'actual' AND (account_category = 'Opex')",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
  },
  {
    id: "m-ni",
    metricName: "net_income",
    displayName: "Net Income",
    category: "Profitability",
    actual: 315000,
    budget: 370000,
    variance: -55000,
    variancePercent: -14.9,
    sqlQuery: "Computed from (gross_profit - opex)",
    formula: "gross_profit - opex",
  },
];

interface PnLTableProps {
  onSelectAudit: (row: PnLRow) => void;
}

export function PnLTable({ onSelectAudit }: PnLTableProps) {
  return (
    <div className="bg-[#0F141C] border border-neutral-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">2026-Q1 Multi-Dimensional P&L Statement</h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">Compiled deterministically via Go Semantic Engine & DuckDB Fact Ledger</p>
        </div>
        <div className="text-[11px] text-neutral-500 font-mono">
          Click any row to open <span className="text-neutral-300">Audit Drawer</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-[#161B22] text-neutral-400 font-medium">
              <th className="py-2.5 px-4">Financial Metric</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4 text-right">Actuals (Q1)</th>
              <th className="py-2.5 px-4 text-right">Budget (Q1)</th>
              <th className="py-2.5 px-4 text-right">Variance ($)</th>
              <th className="py-2.5 px-4 text-right">Variance (%)</th>
              <th className="py-2.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {mockPnLData.map((row) => {
              // Favorable logic: revenue and gross profit positive variance is favorable;
              // for costs (COGS/Opex), spending less than budget (negative variance) is favorable.
              const isFavorable = row.category === "Revenue" || row.category === "Profitability" 
                ? row.variance >= 0 
                : row.variance <= 0;

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectAudit(row)}
                  className="hover:bg-neutral-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-white">
                    {row.displayName}
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{row.category}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-200">
                    ${row.actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-400">
                    ${row.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono tabular-nums font-medium ${isFavorable ? "text-emerald-400" : "text-rose-400"}`}>
                    {row.variance >= 0 ? "+" : ""}${row.variance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono tabular-nums font-medium ${isFavorable ? "text-emerald-400" : "text-rose-400"}`}>
                    {row.variancePercent >= 0 ? "+" : ""}{row.variancePercent.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-[10px] font-mono transition-colors">
                      Trace SQL
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
