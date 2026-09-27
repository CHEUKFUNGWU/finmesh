"use client";

import React from "react";

interface PnLRow {
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

const mockPnLData: PnLRow[] = [
  {
    id: "m-rev",
    metricName: "revenue",
    displayName: "Total Revenue",
    category: "Revenue",
    actual: 180000,
    budget: 200000,
    variance: -20000,
    variancePercent: -10.0,
    sqlQuery: "SELECT COALESCE(SUM(credit_amount) - SUM(debit_amount), 0.0) FROM fact_general_ledger WHERE scenario = 'actual' AND (account_category = 'Revenue')",
    formula: "SUM(credit_amount) - SUM(debit_amount)",
  },
  {
    id: "m-cogs",
    metricName: "cogs",
    displayName: "Cost of Goods Sold (COGS)",
    category: "COGS",
    actual: 36000,
    budget: 30000,
    variance: 6000,
    variancePercent: 20.0,
    sqlQuery: "SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0.0) FROM fact_general_ledger WHERE scenario = 'actual' AND (account_category = 'COGS')",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
  },
  {
    id: "m-gp",
    metricName: "gross_profit",
    displayName: "Gross Profit",
    category: "Profitability",
    actual: 144000,
    budget: 170000,
    variance: -26000,
    variancePercent: -15.3,
    sqlQuery: "Computed from (revenue - cogs)",
    formula: "revenue - cogs",
  },
  {
    id: "m-opex",
    metricName: "opex",
    displayName: "Operating Expenses (R&D & G&A)",
    category: "Opex",
    actual: 64000,
    budget: 65000,
    variance: -1000,
    variancePercent: -1.5,
    sqlQuery: "SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0.0) FROM fact_general_ledger WHERE scenario = 'actual' AND (account_category = 'Opex')",
    formula: "SUM(debit_amount) - SUM(credit_amount)",
  },
];

interface PnLTableProps {
  onSelectAudit: (row: PnLRow) => void;
}

export function PnLTable({ onSelectAudit }: PnLTableProps) {
  return (
    <div className="bg-[#111827] border border-neutral-800 rounded-lg">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">2026-Q1 Multi-Dimensional P&L Statement</h2>
          <p className="text-xs text-neutral-400 mt-1">Compiled deterministically via Go Semantic Engine & DuckDB Fact Ledger</p>
        </div>
        <div className="text-xs text-neutral-400">
          Click any row to open the <span className="text-neutral-200 font-medium">Audit Drawer</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-[#161F30] text-neutral-400 font-medium">
              <th className="py-3 px-4">Financial Metric</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Actual (2026-Q1)</th>
              <th className="py-3 px-4 text-right">Budget (2026-Q1)</th>
              <th className="py-3 px-4 text-right">Variance ($)</th>
              <th className="py-3 px-4 text-right">Variance (%)</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {mockPnLData.map((row) => {
              const isFavorable = row.category === "Revenue" || row.category === "Profitability" 
                ? row.variance >= 0 
                : row.variance <= 0;

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectAudit(row)}
                  className="hover:bg-neutral-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-white">
                    {row.displayName}
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{row.category}</td>
                  <td className="py-3 px-4 text-right text-neutral-200">
                    ${row.actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-neutral-400">
                    ${row.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${isFavorable ? "text-emerald-400" : "text-rose-400"}`}>
                    {row.variance >= 0 ? "+" : ""}${row.variance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${isFavorable ? "text-emerald-400" : "text-rose-400"}`}>
                    {row.variancePercent >= 0 ? "+" : ""}{row.variancePercent.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-[11px] transition-colors">
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
