"use client";

import React, { useState } from "react";
import { Sliders, RotateCcw, ArrowRight, Check } from "lucide-react";

interface SensitivitySandboxProps {
  onSimulateChange?: (overrides: {
    priceLift: number;
    cloudCostDelta: number;
    hiringDelay: number;
    churnDelta: number;
    simulatedGrossProfit: number;
    simulatedNetIncome: number;
  }) => void;
  onCommitToDuckDB?: (overrides: {
    priceLift: number;
    cloudCostDelta: number;
    hiringDelay: number;
    churnDelta: number;
    simulatedGrossProfit: number;
    simulatedNetIncome: number;
  }) => void;
  isSyncing?: boolean;
}

export function SensitivitySandbox({
  onSimulateChange,
  onCommitToDuckDB,
  isSyncing = false,
}: SensitivitySandboxProps) {
  const [priceLift, setPriceLift] = useState(0); // 0%
  const [cloudCostDelta, setCloudCostDelta] = useState(-5); // -5% cloud savings
  const [hiringDelay, setHiringDelay] = useState(2); // 2 months
  const [churnDelta, setChurnDelta] = useState(-1); // -1% churn improvement
  const [committed, setCommitted] = useState(false);

  // Grounded in 2026-Q1 Canonical Financial Baseline:
  // Base Revenue = $1,250,000
  // Base COGS = $525,000 -> Base Gross Profit = $725,000 (58.0% Gross Margin)
  // Base OPEX = $410,000 -> Base Net Income = $315,000 (25.2% Net Margin)

  // 1. Direct Gross Margin Drivers (Revenue & COGS only):
  // 1% price lift = +$12,500 Gross Profit (+100 bps on Gross Margin)
  // 1% cloud cost increase = +$5,250 COGS (-42 bps on Gross Margin)
  const deltaRevenue = (priceLift / 100) * 1250000;
  const deltaCogs = (cloudCostDelta / 100) * 525000;
  const simulatedRevenue = 1250000 + deltaRevenue;
  const simulatedCogs = 525000 + deltaCogs;
  const simulatedGrossProfit = simulatedRevenue - simulatedCogs;
  const simulatedGrossMarginPct = ((simulatedGrossProfit / simulatedRevenue) * 100).toFixed(1);
  const grossMarginBpsDelta = Math.round(((simulatedGrossProfit / simulatedRevenue) - 0.58) * 10000);

  // 2. Operating & Retention Drivers (OPEX & Churn):
  // Hiring delay saves ~$13,333/month in non-critical engineering/SG&A compensation
  const opexSavings = hiringDelay * 13333;
  // Churn improvement preserves revenue and profit
  const churnProfitDelta = (-churnDelta / 100) * 12500;
  const simulatedOpex = Math.max(0, 410000 - opexSavings);
  const simulatedNetIncome = Math.round(simulatedGrossProfit - simulatedOpex + churnProfitDelta);
  const netIncomeDelta = simulatedNetIncome - 315000;
  const simulatedNetMarginPct = ((simulatedNetIncome / simulatedRevenue) * 100).toFixed(1);

  const notifyChange = (p: number, c: number, h: number, ch: number) => {
    setCommitted(false);
    if (onSimulateChange) {
      const dRev = (p / 100) * 1250000;
      const dCogs = (c / 100) * 525000;
      const simRev = 1250000 + dRev;
      const simCogs = 525000 + dCogs;
      const simGp = simRev - simCogs;
      const opexSav = h * 13333;
      const churnDeltaVal = (-ch / 100) * 12500;
      const simOp = Math.max(0, 410000 - opexSav);
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
    setPriceLift(0);
    setCloudCostDelta(0);
    setHiringDelay(0);
    setChurnDelta(0);
    setCommitted(false);
    notifyChange(0, 0, 0, 0);
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

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="h-4 w-4 text-neutral-400" />
          <h3 className="text-sm font-semibold tracking-tight text-white">
            What-If Causal Sensitivity Sandbox
          </h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-white transition-colors p-1"
          title="Reset to Base Assumptions"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sliders Area - Strict Monochrome */}
      <div className="space-y-3.5 text-xs">
        {/* Driver 1: Price Optimization (Gross Margin Driver) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">Price Optimization (ASP)</span>
            <span className="font-mono tabular-nums text-white">
              {priceLift >= 0 ? `+${priceLift}%` : `${priceLift}%`}
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="25"
            step="1"
            value={priceLift}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPriceLift(val);
              notifyChange(val, cloudCostDelta, hiringDelay, churnDelta);
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 2: Cloud / Infrastructure Cost (COGS Driver) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">Cloud Hosting &amp; COGS Delta</span>
            <span className="font-mono tabular-nums text-white">
              {cloudCostDelta >= 0 ? `+${cloudCostDelta}%` : `${cloudCostDelta}%`}
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="15"
            step="1"
            value={cloudCostDelta}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCloudCostDelta(val);
              notifyChange(priceLift, val, hiringDelay, churnDelta);
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 3: Hiring Delay (OPEX Driver) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">Hiring Delay (Non-Critical Roles)</span>
            <span className="font-mono tabular-nums text-white">{hiringDelay} Mo</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={hiringDelay}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHiringDelay(val);
              notifyChange(priceLift, cloudCostDelta, val, churnDelta);
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 4: Churn Reduction (Retention Driver) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-neutral-400">Customer Churn Improvement</span>
            <span className="font-mono tabular-nums text-white">
              {churnDelta <= 0 ? `${churnDelta}%` : `+${churnDelta}%`}
            </span>
          </div>
          <input
            type="range"
            min="-5"
            max="2"
            step="0.5"
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
          <span className="text-xs text-neutral-400 font-medium">Simulated Gross Margin:</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-neutral-500 line-through font-mono">58.0%</span>
            <span className="text-base font-semibold font-mono tabular-nums text-white">
              {simulatedGrossMarginPct}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono border-t border-border/40 pt-1.5">
          <span className="text-neutral-400">Gross Margin Impact:</span>
          <span className={grossMarginBpsDelta >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
            {grossMarginBpsDelta >= 0 ? `+${grossMarginBpsDelta} bps` : `${grossMarginBpsDelta} bps`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-neutral-400">Net Income Impact:</span>
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
