"use client";

import React from "react";
import { FINANCIAL_BASELINE_2026_Q1 } from "@/lib/financialBaseline";

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

export const mockPnLData: PnLRow[] = Object.values(FINANCIAL_BASELINE_2026_Q1).map((m) => ({
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
}));

interface PnLTableProps {
  onSelectAudit: (row: PnLRow) => void;
}

export function PnLTable({ onSelectAudit }: PnLTableProps) {
  return (
    <div className="bg-[#0F141C] border border-neutral-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">2026-Q1 Multi-Dimensional P&amp;L Statement</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Hierarchical Income Statement with DuckDB Real-time Aggregation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
            Consolidated • USD
          </span>
          <span className="text-[11px] font-mono bg-neutral-900 border border-neutral-800 text-emerald-400 px-2 py-0.5 rounded">
            Balanced
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#161B22] text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-800">
            <tr>
              <th className="py-2.5 px-4 font-medium">Metric Item</th>
              <th className="py-2.5 px-4 font-medium">Category</th>
              <th className="py-2.5 px-4 text-right">Actual (Q1)</th>
              <th className="py-2.5 px-4 text-right">Budget (Q1)</th>
              <th className="py-2.5 px-4 text-right">Variance ($)</th>
              <th className="py-2.5 px-4 text-right">Variance (%)</th>
              <th className="py-2.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {mockPnLData.map((row) => {
              // Positive variance represents favorable performance across all categories
              // (e.g. +$30k COGS savings, +$40k OPEX savings are positive numbers in financialBaseline)
              const isFavorable = row.variance >= 0;

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
                    <button className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-[10px] font-mono transition-colors cursor-pointer">
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
