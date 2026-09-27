"use client";

import React, { useState } from "react";
import { PnLTable } from "@/components/report/PnLTable";
import { DriverCanvas } from "@/components/canvas/DriverCanvas";
import { AuditDrawer } from "@/components/audit/AuditDrawer";
import { VarianceMemo } from "@/components/memo/VarianceMemo";
import { ExcelTaskpane } from "@/components/excel/ExcelTaskpane";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<"report" | "canvas" | "memo" | "excel">("report");
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  const handleSelectToken = (metricId: string, sqlHash?: string) => {
    const meta: Record<string, { displayName: string; category: string; actual: number; budget: number; formula: string }> = {
      revenue: {
        displayName: "Revenue (营业收入)",
        category: "Revenue",
        actual: 1250000,
        budget: 1375000,
        formula: "SUM(credit_amount) - SUM(debit_amount)",
      },
      cogs: {
        displayName: "Cost of Goods Sold (营业成本)",
        category: "COGS",
        actual: 525000,
        budget: 555000,
        formula: "SUM(debit_amount) - SUM(credit_amount)",
      },
      gross_profit: {
        displayName: "Gross Profit (毛利)",
        category: "Profitability",
        actual: 725000,
        budget: 820000,
        formula: "revenue - cogs",
      },
      opex: {
        displayName: "Operating Expenses (研发与营销费用)",
        category: "Opex",
        actual: 410000,
        budget: 450000,
        formula: "SUM(debit_amount) - SUM(credit_amount)",
      },
      net_income: {
        displayName: "Net Income (净利润)",
        category: "Profitability",
        actual: 315000,
        budget: 370000,
        formula: "gross_profit - opex",
      },
    };

    const item = meta[metricId] || {
      displayName: metricId.toUpperCase(),
      category: "General",
      actual: 100000,
      budget: 100000,
      formula: "SUM(amount)",
    };

    setSelectedAudit({
      metricName: metricId,
      displayName: item.displayName,
      category: item.category,
      actual: item.actual,
      budget: item.budget,
      variance: item.actual - item.budget,
      formula: item.formula,
      sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount\nFROM fact_general_ledger\nWHERE scenario = 'actual' AND posting_date BETWEEN '2026-01-01' AND '2026-03-31'\n  AND account_category = '${item.category}'\nORDER BY posting_date DESC\nLIMIT 20; -- [Token Hash: #${sqlHash || "a7f8e32c"}]`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[#111827] border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Total ARR / Revenue</div>
          <div className="text-2xl font-semibold text-white mt-1.5">$180,000.00</div>
          <div className="text-xs text-rose-400 mt-1">-$20,000 vs Budget (-10.0%)</div>
        </div>
        <div className="p-4 rounded-lg bg-[#111827] border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Gross Margin</div>
          <div className="text-2xl font-semibold text-white mt-1.5">80.0%</div>
          <div className="text-xs text-rose-400 mt-1">-5.0% vs Budget</div>
        </div>
        <div className="p-4 rounded-lg bg-[#111827] border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Net Burn / Month</div>
          <div className="text-2xl font-semibold text-white mt-1.5">-$26,666.67</div>
          <div className="text-xs text-emerald-400 mt-1">+1.5% Favorable vs Plan</div>
        </div>
        <div className="p-4 rounded-lg bg-[#111827] border border-neutral-800">
          <div className="text-xs text-neutral-400 font-medium">Cash Runway</div>
          <div className="text-2xl font-semibold text-emerald-400 mt-1.5">28.4 Months</div>
          <div className="text-xs text-neutral-400 mt-1">Target: &gt; 24 Months</div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab("report")}
          className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === "report"
              ? "bg-neutral-800 text-white border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Multi-Dimensional P&L Report
        </button>
        <button
          onClick={() => setActiveTab("canvas")}
          className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === "canvas"
              ? "bg-neutral-800 text-white border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          What-If Causal Sandbox
        </button>
        <button
          onClick={() => setActiveTab("memo")}
          className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === "memo"
              ? "bg-neutral-800 text-white border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Autonomous Variance Memo
        </button>
        <button
          onClick={() => setActiveTab("excel")}
          className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === "excel"
              ? "bg-neutral-800 text-white border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Excel Sync Add-in
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "report" && (
        <PnLTable onSelectAudit={(row) => setSelectedAudit(row)} />
      )}

      {activeTab === "canvas" && (
        <DriverCanvas />
      )}

      {activeTab === "memo" && (
        <VarianceMemo onTokenClick={handleSelectToken} />
      )}

      {activeTab === "excel" && (
        <ExcelTaskpane />
      )}

      {/* Zero-Hallucination Audit Drawer */}
      <AuditDrawer
        isOpen={selectedAudit !== null}
        onClose={() => setSelectedAudit(null)}
        data={selectedAudit}
      />
    </div>
  );
}
