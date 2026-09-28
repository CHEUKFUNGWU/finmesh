"use client";

import React, { useState, useEffect } from "react";
import { Sliders, RotateCcw, ArrowRight, Check } from "lucide-react";
import { FINANCIAL_BASELINE_2026_Q1 } from "@/lib/financialBaseline";
import type { SandboxConfig } from "@/lib/industryTemplates";

export interface SensitivityScenarioOverrides {
  priceLift: number;
  cloudCostDelta: number;
  hiringDelay: number;
  churnDelta: number;
  simulatedGrossProfit: number;
  simulatedNetIncome: number;
}

interface SensitivitySandboxProps {
  config?: SandboxConfig;
  onSimulateChange?: (overrides: SensitivityScenarioOverrides) => void;
  onCommitToDuckDB?: (overrides: SensitivityScenarioOverrides) => void;
  isSyncing?: boolean;
}

export function SensitivitySandbox({
  config,
  onSimulateChange,
  onCommitToDuckDB,
  isSyncing = false,
}: SensitivitySandboxProps) {
  // Configurable base values
  const baseRevenue = config?.baseRevenue ?? FINANCIAL_BASELINE_2026_Q1.revenue.actual;
  const baseCogs = config?.baseCogs ?? FINANCIAL_BASELINE_2026_Q1.cogs.actual;
  const baseOpex = config?.baseOpex ?? FINANCIAL_BASELINE_2026_Q1.opex.actual;
  const baseNetIncome = config?.baseNetIncome ?? FINANCIAL_BASELINE_2026_Q1.net_income.actual;
  const baseGrossMarginRatio = (baseRevenue - baseCogs) / baseRevenue;
  const baseGrossMarginPct = (baseGrossMarginRatio * 100).toFixed(1);

  // Driver defaults from config
  const d1Default = config?.driver1Default ?? 0;
  const d2Default = config?.driver2Default ?? -5;
  const d3Default = config?.driver3Default ?? 2;
  const d4Default = config?.driver4Default ?? -1;

  const [priceLift, setPriceLift] = useState(d1Default);
  const [cloudCostDelta, setCloudCostDelta] = useState(d2Default);
  const [hiringDelay, setHiringDelay] = useState(d3Default);
  const [churnDelta, setChurnDelta] = useState(d4Default);
  const [committed, setCommitted] = useState(false);

  // Synchronize defaults on industry change
  useEffect(() => {
    if (config) {
      setPriceLift(config.driver1Default);
      setCloudCostDelta(config.driver2Default);
      setHiringDelay(config.driver3Default);
      setChurnDelta(config.driver4Default);
    }
  }, [config?.title, config?.baseRevenue]);

  // 1. Direct Gross Margin Drivers (Revenue & COGS):
  const deltaRevenue = (priceLift / 100) * baseRevenue;
  const deltaCogs = (cloudCostDelta / 100) * baseCogs;
  const simulatedRevenue = Math.max(1, baseRevenue + deltaRevenue);
  const simulatedCogs = Math.max(0, baseCogs + deltaCogs);
  const simulatedGrossProfit = simulatedRevenue - simulatedCogs;
  const simulatedGrossMarginPct = ((simulatedGrossProfit / simulatedRevenue) * 100).toFixed(1);
  const grossMarginBpsDelta = Math.round(((simulatedGrossProfit / simulatedRevenue) - baseGrossMarginRatio) * 10000);

  // 2. Operating & Retention Drivers (OPEX & Retention):
  const opexSavings = hiringDelay * (baseOpex * 0.03); // Scaled monthly savings
  const churnProfitDelta = (-churnDelta / 100) * (baseRevenue * 0.01);
  const simulatedOpex = Math.max(0, baseOpex - opexSavings);
  const simulatedNetIncome = Math.round(simulatedGrossProfit - simulatedOpex + churnProfitDelta);
  const netIncomeDelta = simulatedNetIncome - baseNetIncome;
  const simulatedNetMarginPct = ((simulatedNetIncome / simulatedRevenue) * 100).toFixed(1);

  const notifyChange = (p: number, c: number, h: number, ch: number) => {
    setCommitted(false);
    if (onSimulateChange) {
      const dRev = (p / 100) * baseRevenue;
      const dCogs = (c / 100) * baseCogs;
      const simRev = Math.max(1, baseRevenue + dRev);
      const simC = Math.max(0, baseCogs + dCogs);
      const simGp = simRev - simC;
      const opexSav = h * (baseOpex * 0.03);
      const churnDeltaVal = (-ch / 100) * (baseRevenue * 0.01);
      const simOp = Math.max(0, baseOpex - opexSav);
      const simNi = Math.round(simGp - simOp + churnDeltaVal);
      onSimulateChange({
        priceLift: p,
        cloudCostDelta: c,
        hiringDelay: h,
        churnDelta: ch,
        simulatedGrossProfit: Math.round(simGp),
        simulatedNetIncome: simNi,
      });
    }
  };

  const handleReset = () => {
    setPriceLift(d1Default);
    setCloudCostDelta(d2Default);
    setHiringDelay(d3Default);
    setChurnDelta(d4Default);
    notifyChange(d1Default, d2Default, d3Default, d4Default);
  };

  const handleCommit = () => {
    if (onCommitToDuckDB) {
      onCommitToDuckDB({
        priceLift,
        cloudCostDelta,
        hiringDelay,
        churnDelta,
        simulatedGrossProfit: Math.round(simulatedGrossProfit),
        simulatedNetIncome,
      });
      setCommitted(true);
      setTimeout(() => setCommitted(false), 3000);
    }
  };

  // Labels and configuration
  const title = config?.title ?? "What-If Causal Sensitivity Sandbox";
  const marginLabel = config?.marginName ?? "Gross Margin";
  const profitLabel = config?.profitName ?? "Net Income";

  const d1Label = config?.driver1Label ?? "Price Optimization (ASP)";
  const d1Unit = config?.driver1Unit ?? "%";
  const d1Min = config?.driver1Min ?? -10;
  const d1Max = config?.driver1Max ?? 25;
  const d1Step = config?.driver1Step ?? 1;

  const d2Label = config?.driver2Label ?? "Direct Cost (COGS) Delta";
  const d2Unit = config?.driver2Unit ?? "%";
  const d2Min = config?.driver2Min ?? -20;
  const d2Max = config?.driver2Max ?? 15;
  const d2Step = config?.driver2Step ?? 1;

  const d3Label = config?.driver3Label ?? "Hiring Delay / Payroll OpEx";
  const d3Unit = config?.driver3Unit ?? " Mo";
  const d3Min = config?.driver3Min ?? 0;
  const d3Max = config?.driver3Max ?? 6;
  const d3Step = config?.driver3Step ?? 1;

  const d4Label = config?.driver4Label ?? "Customer Retention / Churn Impact";
  const d4Unit = config?.driver4Unit ?? "%";
  const d4Min = config?.driver4Min ?? -5;
  const d4Max = config?.driver4Max ?? 5;
  const d4Step = config?.driver4Step ?? 0.5;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="h-4 w-4 text-neutral-400" />
          <h3 className="text-sm font-semibold tracking-tight text-white">
            {title}
          </h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-white transition-colors p-1 cursor-pointer"
          title="Reset to Base Assumptions"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sliders Area - Strict Monochrome */}
      <div className="space-y-3.5 text-xs">
        {/* Driver 1 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">{d1Label}</span>
            <span className="font-mono tabular-nums text-white">
              {priceLift >= 0 ? `+${priceLift}${d1Unit}` : `${priceLift}${d1Unit}`}
            </span>
          </div>
          <input
            type="range"
            min={d1Min}
            max={d1Max}
            step={d1Step}
            value={priceLift}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceLift(val);
              notifyChange(val, cloudCostDelta, hiringDelay, churnDelta);
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 2 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">{d2Label}</span>
            <span className="font-mono tabular-nums text-white">
              {cloudCostDelta >= 0 ? `+${cloudCostDelta}${d2Unit}` : `${cloudCostDelta}${d2Unit}`}
            </span>
          </div>
          <input
            type="range"
            min={d2Min}
            max={d2Max}
            step={d2Step}
            value={cloudCostDelta}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCloudCostDelta(val);
              notifyChange(priceLift, val, hiringDelay, churnDelta);
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 3 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">{d3Label}</span>
            <span className="font-mono tabular-nums text-white">{hiringDelay}{d3Unit}</span>
          </div>
          <input
            type="range"
            min={d3Min}
            max={d3Max}
            step={d3Step}
            value={hiringDelay}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHiringDelay(val);
              notifyChange(priceLift, cloudCostDelta, val, churnDelta);
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 4 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">{d4Label}</span>
            <span className="font-mono tabular-nums text-white">
              {churnDelta <= 0 ? `${churnDelta}${d4Unit}` : `+${churnDelta}${d4Unit}`}
            </span>
          </div>
          <input
            type="range"
            min={d4Min}
            max={d4Max}
            step={d4Step}
            value={churnDelta}
            onChange={(e) => {
              const val = Number(e.target.value);
              setChurnDelta(val);
              notifyChange(priceLift, cloudCostDelta, hiringDelay, val);
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>
      </div>

      {/* Simulated Outcomes Card */}
      <div className="rounded border border-border/80 bg-[#070A10] p-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-neutral-400 font-medium">Simulated {marginLabel}:</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-neutral-500 line-through font-mono">{baseGrossMarginPct}%</span>
            <span className="text-base font-semibold font-mono tabular-nums text-white">
              {simulatedGrossMarginPct}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono border-t border-border/40 pt-1.5">
          <span className="text-neutral-400">{marginLabel} Impact:</span>
          <span className={grossMarginBpsDelta >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
            {grossMarginBpsDelta >= 0 ? `+${grossMarginBpsDelta} bps` : `${grossMarginBpsDelta} bps`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-neutral-400">{profitLabel} Impact:</span>
          <span className={netIncomeDelta >= 0 ? "text-emerald-400 font-semibold tabular-nums" : "text-rose-400 font-semibold tabular-nums"}>
            {netIncomeDelta >= 0
              ? `+$${netIncomeDelta.toLocaleString()}`
              : `-$${Math.abs(netIncomeDelta).toLocaleString()}`} ({simulatedNetMarginPct}% Net)
          </span>
        </div>
      </div>

      {/* Commit to DuckDB Ledger Action */}
      <button
        onClick={handleCommit}
        disabled={isSyncing || committed}
        className="w-full py-2 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-white border border-neutral-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
      >
        {committed ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Scenario Committed to DuckDB Ledger</span>
          </>
        ) : (
          <>
            <span>{isSyncing ? "Writing Scenario to DuckDB..." : "Commit Scenario to DuckDB Ledger"}</span>
            <ArrowRight className="h-3 w-3" />
          </>
        )}
      </button>
    </div>
  );
}
