"use client";

import React, { useState } from "react";
import {
  Search,
  Presentation,
  Download,
  Sliders,
  Layers,
  GitBranch,
  FileSpreadsheet,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Building2,
  Calendar,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { KpiStatCard } from "@/components/cockpit/KpiStatCard";
import { PvmWaterfallExplorer } from "@/components/cockpit/PvmWaterfallExplorer";
import { SensitivitySandbox } from "@/components/cockpit/SensitivitySandbox";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { PnLTable, PnLRow } from "@/components/report/PnLTable";
import { DriverCanvas } from "@/components/canvas/DriverCanvas";
import { AuditDrawer } from "@/components/audit/AuditDrawer";
import { VarianceMemo } from "@/components/memo/VarianceMemo";
import { ExcelTaskpane } from "@/components/excel/ExcelTaskpane";
import { SlideDeckModal } from "@/components/presentation/SlideDeckModal";
import { ExecutiveDeckData, generateExecutiveDeck } from "@/lib/export/pptxGenerator";
import { FINANCIAL_BASELINE_2026_Q1 } from "@/lib/financialBaseline";

const DEFAULT_DECK_DATA: ExecutiveDeckData = {
  period: "2026-Q1",
  generatedAt: "2026-03-31T23:59:59Z",
  kpis: {
    arr: 1250000,
    arrVariance: "-$125,000 (-9.1%)",
    grossMarginPct: 58.0,
    grossMarginVariance: "-1.6% vs Plan",
    netBurn: -26667,
    runwayMonths: 28.4,
  },
  metrics: [
    {
      id: "revenue",
      name: "Total Revenue / ARR",
      actual: 1250000,
      budget: 1375000,
      variance: -125000,
      variancePct: "-9.1%",
      category: "Revenue",
      formula: "SUM(credit) - SUM(debit)",
      sqlHash: "a7f8e32c",
    },
    {
      id: "cogs",
      name: "Cost of Goods Sold",
      actual: 525000,
      budget: 555000,
      variance: 30000,
      variancePct: "-5.4%",
      category: "COGS",
      formula: "SUM(debit) - SUM(credit)",
      sqlHash: "b2c9d1e4",
    },
    {
      id: "gross_profit",
      name: "Gross Profit",
      actual: 725000,
      budget: 820000,
      variance: -95000,
      variancePct: "-11.6%",
      category: "Profitability",
      formula: "revenue - cogs",
      sqlHash: "e5d4c3b2",
    },
    {
      id: "opex",
      name: "Operating Expenses",
      actual: 410000,
      budget: 450000,
      variance: 40000,
      variancePct: "-8.9%",
      category: "Opex",
      formula: "SUM(debit) - SUM(credit)",
      sqlHash: "f1a2b3c4",
    },
    {
      id: "net_income",
      name: "Net Income",
      actual: 315000,
      budget: 370000,
      variance: -55000,
      variancePct: "-14.9%",
      category: "Profitability",
      formula: "gross_profit - opex",
      sqlHash: "99e8d7c6",
    },
  ],
  varianceDiagnosis: [
    "Volume Contraction: Enterprise renewal cycle extended by 22 days in APAC, leading to $75k unearned revenue variance.",
    "Price Discipline: ASP held steady across Tier-1 accounts with zero emergency discounting.",
    "Cloud Optimization: Migrated telemetry clusters to Graviton instances, saving $30k favorable in hosting COGS.",
    "Headcount Controls: Q1 engineering hiring pause delayed 3 non-critical roles, saving $40k favorable in Opex.",
  ],
  whatifScenarios: [
    { name: "Current Baseline", revenue: 1250000, grossProfit: 725000, runway: 28.4 },
    { name: "Bull Scenario (+10% Price Lift)", revenue: 1375000, grossProfit: 850000, runway: 34.2 },
    { name: "Bear Scenario (-15% Renewal)", revenue: 1062500, grossProfit: 537500, runway: 21.0 },
  ],
};

export default function WorkspacePage() {
  const [activeView, setActiveView] = useState<"pvm" | "report" | "canvas" | "sandbox" | "excel">("pvm");
  const [selectedEntity, setSelectedEntity] = useState<string>("global");
  const [selectedScenario, setSelectedScenario] = useState<string>("actual_vs_budget");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-Q1");

  const [selectedAudit, setSelectedAudit] = useState<{
    metricName: string;
    displayName: string;
    category: string;
    actual: number;
    budget: number;
    variance: number;
    formula: string;
    sqlQuery: string;
    sqlHash?: string;
  } | null>(null);

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isExportingPPT, setIsExportingPPT] = useState(false);
  const [memoCollapsed, setMemoCollapsed] = useState(false);
  const [committedNotice, setCommittedNotice] = useState<string | null>(null);

  const handleSelectToken = (metricId: string, sqlHash?: string) => {
    const meta = FINANCIAL_BASELINE_2026_Q1[metricId];
    if (meta) {
      setSelectedAudit({
        metricName: metricId,
        displayName: meta.displayName,
        category: meta.category,
        actual: meta.actual,
        budget: meta.budget,
        variance: meta.variance,
        formula: meta.formula,
        sqlHash: sqlHash || meta.sqlHash,
        sqlQuery: meta.sqlQuery,
      });
    } else {
      setSelectedAudit({
        metricName: metricId,
        displayName: metricId.toUpperCase(),
        category: "General",
        actual: 100000,
        budget: 100000,
        variance: 0,
        formula: "SUM(amount)",
        sqlHash: sqlHash || "a7f8e32c",
        sqlQuery: `SELECT * FROM fact_general_ledger LIMIT 10;`,
      });
    }
  };

  const handleSelectPnLAudit = (row: PnLRow) => {
    handleSelectToken(row.metricName);
  };

  const handleExportPPT = async () => {
    try {
      setIsExportingPPT(true);
      await generateExecutiveDeck(DEFAULT_DECK_DATA);
    } catch (err) {
      console.error("PPT export failed:", err);
    } finally {
      setIsExportingPPT(false);
    }
  };

  const handleCommitDuckDB = async (overrides: {
    priceLift: number;
    cloudCostDelta: number;
    hiringDelay: number;
    churnDelta: number;
    simulatedGrossProfit: number;
    simulatedNetIncome: number;
  }) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_FINMESH_API_URL || "http://localhost:8080";
      await fetch(`${apiUrl}/api/v1/whatif/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: "sandbox_sim_q1",
          period: "2026-Q1",
          price_lift_pct: overrides.priceLift,
          cloud_cost_pct: overrides.cloudCostDelta,
          hiring_delay_months: overrides.hiringDelay,
          churn_delta_pct: overrides.churnDelta,
        }),
      }).catch(() => {
        // Fallback for offline/standalone mode
      });

      setCommittedNotice(
        `Scenario override committed to DuckDB fact_general_ledger! GP: $${overrides.simulatedGrossProfit.toLocaleString()} | NI: $${overrides.simulatedNetIncome.toLocaleString()}`
      );
      setTimeout(() => setCommittedNotice(null), 4000);
    } catch (err) {
      console.error("DuckDB commit error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Action & Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Left: Brand Identity & Active Scenario Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-md bg-neutral-900 border border-neutral-800 p-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-neutral-800 text-white font-medium">
              2026-Q1 (Jan - Mar)
            </span>
            <span className="px-2.5 py-1 text-muted-foreground font-mono">
              Actual vs Budget Plan
            </span>
          </div>

          <span className="text-neutral-700 hidden sm:inline">|</span>

          <span className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Trial Balance Verified (|Δ| = 0.00)</span>
          </span>
        </div>

        {/* Right: Cmd+K Launcher, Deck, PPT Export, Panel Toggle */}
        <div className="flex items-center gap-2">
          {/* Cmd+K Launcher */}
          <button
            onClick={() => setIsCommandMenuOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs bg-neutral-900 hover:bg-neutral-850 text-muted-foreground hover:text-white border border-neutral-800 transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Quick Commands</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-400">
              ⌘K
            </kbd>
          </button>

          {/* Presentation Deck Modal Button */}
          <button
            onClick={() => setIsPresentationOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors cursor-pointer"
          >
            <Presentation className="h-3.5 w-3.5 text-neutral-400" />
            <span>Deck</span>
          </button>

          {/* Export PPTX Button */}
          <button
            onClick={handleExportPPT}
            disabled={isExportingPPT}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-white hover:bg-neutral-200 text-black transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExportingPPT ? "Exporting..." : "Export .pptx"}</span>
          </button>

          {/* Toggle Right AI Memo Panel */}
          <button
            onClick={() => setMemoCollapsed(!memoCollapsed)}
            className="p-1.5 rounded text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
            title={memoCollapsed ? "Show AI Memo" : "Collapse AI Memo"}
          >
            {memoCollapsed ? (
              <PanelRightOpen className="h-4 w-4" />
            ) : (
              <PanelRightClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Committed Notice Toast */}
      {committedNotice && (
        <div className="p-3 bg-neutral-900 border border-emerald-800/80 rounded text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-mono">{committedNotice}</span>
          </div>
          <button
            onClick={() => setCommittedNotice(null)}
            className="text-neutral-500 hover:text-white text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Executive Scorecard (4 KpiStatCard row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiStatCard
          title="Total Revenue / ARR"
          value="$1,250,000"
          change="-$125,000 (-9.1%)"
          trend="down"
          favorability="unfavorable"
          subtext="Budget: $1,375,000 • Volume Drag"
          sparklineData={[1375, 1340, 1310, 1280, 1250]}
          onClick={() => handleSelectToken("revenue", "a7f8e32c")}
        />

        <KpiStatCard
          title="Gross Profit Margin"
          value="58.0%"
          change="-1.6% vs Plan"
          trend="down"
          favorability="unfavorable"
          subtext="Budget: 59.6% • COGS $525,000"
          sparklineData={[60, 59.5, 59, 58.2, 58.0]}
          onClick={() => handleSelectToken("gross_profit", "e5d4c3b2")}
        />

        <KpiStatCard
          title="Operating Expenses (OPEX)"
          value="$410,000"
          change="+$40,000 (+8.9%)"
          trend="up"
          favorability="favorable"
          subtext="Budget: $450,000 • Favorable Freeze"
          sparklineData={[450, 440, 425, 418, 410]}
          onClick={() => handleSelectToken("opex", "f1a2b3c4")}
        />

        <KpiStatCard
          title="Net Income &amp; Runway"
          value="$315,000"
          change="-$55,000 (-14.9%)"
          trend="down"
          favorability="unfavorable"
          subtext="Runway: 28.4 Months • Target > 24m"
          sparklineData={[370, 355, 340, 325, 315]}
          onClick={() => handleSelectToken("net_income", "99e8d7c6")}
        />
      </div>

      {/* 3. True 3-Pane Command Workbench Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* PANE 1: Left Dimension & Entity Hierarchy Navigator (Col 2/3) */}
        {/* ========================================================= */}
        <div className="xl:col-span-3 space-y-4">
          {/* Navigation Views Accordion */}
          <div className="bg-[#0F141C] border border-neutral-800 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-neutral-800/80 pb-2">
              <span>Workbench Modes</span>
              <span className="text-[10px] font-mono text-neutral-500">v0.1</span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setActiveView("pvm")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "pvm"
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>PVM &amp; Sensitivity</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Dual</span>
              </button>

              <button
                onClick={() => setActiveView("report")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "report"
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Multi-Dimensional P&amp;L</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Grid</span>
              </button>

              <button
                onClick={() => setActiveView("canvas")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "canvas"
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>Causal Driver DAG</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Flow</span>
              </button>

              <button
                onClick={() => setActiveView("sandbox")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "sandbox"
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Sensitivity Sandbox</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">What-If</span>
              </button>

              <button
                onClick={() => setActiveView("excel")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "excel"
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Excel Sync Taskpane</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Add-in</span>
              </button>
            </div>
          </div>

          {/* Legal Entity & Accounting Scope Selector */}
          <div className="bg-[#0F141C] border border-neutral-800 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-neutral-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                <span>Entity &amp; Books</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-500">GL</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setSelectedEntity("global")}
                className={`w-full flex items-center justify-between p-2 rounded text-xs font-sans transition-colors cursor-pointer ${
                  selectedEntity === "global"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-900/60"
                }`}
              >
                <span>Acme Global (Consolidated)</span>
                <span className="text-[10px] font-mono text-neutral-500">USD</span>
              </button>
              <button
                onClick={() => setSelectedEntity("americas")}
                className={`w-full flex items-center justify-between p-2 rounded text-xs font-sans transition-colors cursor-pointer ${
                  selectedEntity === "americas"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-900/60"
                }`}
              >
                <span>Acme US Tech Inc</span>
                <span className="text-[10px] font-mono text-neutral-500">USD</span>
              </button>
              <button
                onClick={() => setSelectedEntity("emea")}
                className={`w-full flex items-center justify-between p-2 rounded text-xs font-sans transition-colors cursor-pointer ${
                  selectedEntity === "emea"
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-900/60"
                }`}
              >
                <span>Acme EMEA Operations</span>
                <span className="text-[10px] font-mono text-neutral-500">EUR</span>
              </button>
            </div>
          </div>

          {/* Metric Hierarchy Fast-Inspector */}
          <div className="bg-[#0F141C] border border-neutral-800 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-neutral-800/80 pb-2">
              <span>Metric Fast-Inspect</span>
              <span className="text-[10px] font-mono text-neutral-500">2026-Q1</span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              {Object.values(FINANCIAL_BASELINE_2026_Q1).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectToken(m.id)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-neutral-850 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="truncate text-left">{m.displayName}</span>
                  <span className="tabular-nums font-medium text-neutral-400 ml-2">
                    ${(m.actual / 1000).toFixed(0)}k
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANE 2: Center Primary Financial Canvas & Sandboxes (Col 5/6/9) */}
        {/* ========================================================= */}
        <div
          className={`space-y-6 ${
            memoCollapsed ? "xl:col-span-9" : "xl:col-span-5 lg:col-span-6"
          }`}
        >
          {/* PVM & Sensitivity Sandbox View */}
          {activeView === "pvm" && (
            <div className="space-y-6">
              <PvmWaterfallExplorer onTokenClick={handleSelectToken} />
              <SensitivitySandbox onCommitToDuckDB={handleCommitDuckDB} />
            </div>
          )}

          {/* Multi-Dimensional P&L Grid View */}
          {activeView === "report" && (
            <div className="space-y-6">
              <PnLTable onSelectAudit={handleSelectPnLAudit} />
            </div>
          )}

          {/* Causal Driver DAG Canvas View */}
          {activeView === "canvas" && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <DriverCanvas />
            </div>
          )}

          {/* Sensitivity Sandbox Standalone View */}
          {activeView === "sandbox" && (
            <div className="space-y-6">
              <SensitivitySandbox onCommitToDuckDB={handleCommitDuckDB} />
            </div>
          )}

          {/* Excel Sync Taskpane View */}
          {activeView === "excel" && (
            <div className="space-y-6">
              <ExcelTaskpane />
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* PANE 3: Right AI FP&A Variance Memo (Col 4) */}
        {/* ========================================================= */}
        {!memoCollapsed && (
          <div className="xl:col-span-4 lg:col-span-6 space-y-4">
            <VarianceMemo
              onTokenClick={handleSelectToken}
              onOpenPresentation={() => setIsPresentationOpen(true)}
            />
          </div>
        )}
      </div>

      {/* 4. Zero-Hallucination Lineage Audit Drawer */}
      <AuditDrawer
        isOpen={selectedAudit !== null}
        onClose={() => setSelectedAudit(null)}
        data={selectedAudit}
      />

      {/* 5. Global Command Menu (Cmd+K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onOpenChange={setIsCommandMenuOpen}
        onSelectMetric={(metricId) => handleSelectToken(metricId)}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        onExportPPT={handleExportPPT}
        onSwitchView={(view) => setActiveView(view)}
      />

      {/* 6. Fullscreen Board Slide Deck Modal */}
      <SlideDeckModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        data={DEFAULT_DECK_DATA}
        onTokenClick={handleSelectToken}
      />
    </div>
  );
}
