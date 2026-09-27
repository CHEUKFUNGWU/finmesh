"use client";

import React, { useState } from "react";
import { PnLTable } from "@/components/report/PnLTable";
import { DriverCanvas } from "@/components/canvas/DriverCanvas";
import { AuditDrawer } from "@/components/audit/AuditDrawer";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<"report" | "canvas">("report");
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

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
      </div>

      {/* Main Content Area */}
      {activeTab === "report" && (
        <PnLTable onSelectAudit={(row) => setSelectedAudit(row)} />
      )}

      {activeTab === "canvas" && (
        <DriverCanvas />
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
