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
} from "lucide-react";

import { KpiStatCard } from "@/components/cockpit/KpiStatCard";
import { PvmWaterfallExplorer } from "@/components/cockpit/PvmWaterfallExplorer";
import { SensitivitySandbox } from "@/components/cockpit/SensitivitySandbox";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { PnLTable } from "@/components/report/PnLTable";
import { DriverCanvas } from "@/components/canvas/DriverCanvas";
import { AuditDrawer } from "@/components/audit/AuditDrawer";
import { VarianceMemo } from "@/components/memo/VarianceMemo";
import { ExcelTaskpane } from "@/components/excel/ExcelTaskpane";
import { SlideDeckModal } from "@/components/presentation/SlideDeckModal";
import { ExecutiveDeckData, generateExecutiveDeck } from "@/lib/export/pptxGenerator";

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
      name: "Total Revenue",
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
  const [activeView, setActiveView] = useState<"report" | "pvm" | "canvas" | "sandbox" | "excel">("pvm");
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

  const handleSelectToken = (metricId: string, sqlHash?: string) => {
    const meta: Record<
      string,
      { displayName: string; category: string; actual: number; budget: number; formula: string }
    > = {
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
      sqlHash: sqlHash || "a7f8e32c",
      sqlQuery: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount\nFROM fact_general_ledger\nWHERE scenario = 'actual' AND posting_date BETWEEN '2026-01-01' AND '2026-03-31'\n  AND account_category = '${item.category}'\nORDER BY posting_date DESC\nLIMIT 20; -- [Token Hash: #${sqlHash || "a7f8e32c"}]`,
    });
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

  return (
    <div className="space-y-6">
      {/* 1. Global Action & Scenario Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Left: Scenario & Period Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-md bg-neutral-900 border border-neutral-800 p-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-neutral-800 text-white font-medium">
              2026-Q1 (Jan - Mar)
            </span>
            <span className="px-2.5 py-1 text-muted-foreground font-mono">
              Actual vs Budget
            </span>
          </div>

          <span className="text-neutral-700 hidden sm:inline">|</span>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveView("pvm")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeView === "pvm"
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>PVM &amp; Sensitivity</span>
            </button>

            <button
              onClick={() => setActiveView("report")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeView === "report"
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Multi-Dimensional P&amp;L</span>
            </button>

            <button
              onClick={() => setActiveView("canvas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeView === "canvas"
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Causal Driver DAG</span>
            </button>

            <button
              onClick={() => setActiveView("excel")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeView === "excel"
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel Sync</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Command Trigger & Presentation Actions */}
        <div className="flex items-center gap-2">
          {/* Cmd+K Quick Trigger */}
          <button
            onClick={() => setIsCommandMenuOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs bg-neutral-900 hover:bg-neutral-850 text-muted-foreground hover:text-white border border-neutral-800 transition-colors"
          >
            <Search className="h-3.5 w-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Commands &amp; Metrics</span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-400">
              ⌘K
            </kbd>
          </button>

          {/* Presentation Deck Modal Button */}
          <button
            onClick={() => setIsPresentationOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
          >
            <Presentation className="h-3.5 w-3.5 text-neutral-400" />
            <span>Deck</span>
          </button>

          {/* Export PPTX Button */}
          <button
            onClick={handleExportPPT}
            disabled={isExportingPPT}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-white hover:bg-neutral-200 text-black transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExportingPPT ? "Exporting..." : "Export .pptx"}</span>
          </button>

          {/* Toggle Right Memo Panel */}
          <button
            onClick={() => setMemoCollapsed(!memoCollapsed)}
            className="p-1.5 rounded text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition-colors"
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

      {/* 2. Top Executive Scorecard (4 KpiStatCard row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiStatCard
          title="Total Revenue / ARR"
          value="$1,250,000"
          change="-$125,000 (-9.1%)"
          trend="down"
          subtext="Budget: $1,375,000 • Volume Drag"
          sparklineData={[1375, 1340, 1310, 1280, 1250]}
          onClick={() => handleSelectToken("revenue", "a7f8e32c")}
        />

        <KpiStatCard
          title="Gross Profit Margin"
          value="58.0%"
          change="-1.6% vs Plan"
          trend="down"
          subtext="Budget: 59.6% • COGS $525,000"
          sparklineData={[60, 59.5, 59, 58.2, 58.0]}
          onClick={() => handleSelectToken("gross_profit", "e5d4c3b2")}
        />

        <KpiStatCard
          title="Operating Expenses (OPEX)"
          value="$410,000"
          change="+$40,000 (+8.9%)"
          trend="up"
          subtext="Budget: $450,000 • Favorable Freeze"
          sparklineData={[450, 440, 425, 418, 410]}
          onClick={() => handleSelectToken("opex", "f1a2b3c4")}
        />

        <KpiStatCard
          title="Net Income &amp; Runway"
          value="$315,000"
          change="-$55,000 (-14.9%)"
          trend="down"
          subtext="Runway: 28.4 Months • Target > 24m"
          sparklineData={[370, 355, 340, 325, 315]}
          onClick={() => handleSelectToken("net_income", "99e8d7c6")}
        />
      </div>

      {/* 3. Integrated 3-Pane Command Workbench */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left/Center Workspace (Responsive Col 12 or Col 7/8 depending on memo) */}
        <div className={`space-y-6 ${memoCollapsed ? "xl:col-span-12" : "xl:col-span-8"}`}>
          {/* PVM & Sensitivity Sandbox View */}
          {activeView === "pvm" && (
            <div className="space-y-6">
              <PvmWaterfallExplorer onTokenClick={handleSelectToken} />
              <SensitivitySandbox />
            </div>
          )}

          {/* Multi-Dimensional P&L Grid View */}
          {activeView === "report" && (
            <div className="space-y-6">
              <PnLTable onSelectAudit={(row) => setSelectedAudit(row)} />
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
              <SensitivitySandbox />
            </div>
          )}

          {/* Excel Sync Taskpane View */}
          {activeView === "excel" && (
            <div className="space-y-6">
              <ExcelTaskpane />
            </div>
          )}
        </div>

        {/* Right Pane: AI Executive Variance Memo */}
        {!memoCollapsed && (
          <div className="xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-200">
                  Autonomous FP&amp;A Memo
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                Claude 3.7 • DuckDB Proof
              </span>
            </div>

            <VarianceMemo onTokenClick={handleSelectToken} />
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
        onSwitchView={(view) => setActiveView(view as any)}
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
