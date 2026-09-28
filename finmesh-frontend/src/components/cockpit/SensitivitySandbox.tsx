"use client";

import React, { useState } from "react";
import { Sliders, RotateCcw, ArrowRight } from "lucide-react";

interface SensitivitySandboxProps {
  onSimulateChange?: (overrides: {
    priceLift: number;
    cloudCostDelta: number;
    hiringDelay: number;
    churnDelta: number;
  }) => void;
  onCommitToDuckDB?: () => void;
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
  const [churnDelta, setChurnDelta] = useState(-1); // -1% churn reduction

  // Calculations grounded in baseline Revenue $180,000, Gross Profit $144,000 (80%), Net Income $80,000
  // Margin impacts in Basis Points (bps):
  // 1% price lift = +100 bps margin, 1% cloud cost change = -20 bps, 1 month hiring delay = +35 bps, 1% churn reduction = +45 bps
  const marginImpactBps = Math.round(
    priceLift * 100 - cloudCostDelta * 20 + hiringDelay * 35 - churnDelta * 45
  );
  const baselineMargin = 80.0;
  const simulatedMargin = (baselineMargin + marginImpactBps / 100).toFixed(1);
  const netProfitImpact = Math.round(marginImpactBps * 18); // ~ $18 per bps on $180k rev

  const handleReset = () => {
    setPriceLift(0);
    setCloudCostDelta(0);
    setHiringDelay(0);
    setChurnDelta(0);
    if (onSimulateChange) {
      onSimulateChange({ priceLift: 0, cloudCostDelta: 0, hiringDelay: 0, churnDelta: 0 });
    }
  };

  const handlePriceChange = (val: number) => {
    setPriceLift(val);
    if (onSimulateChange) {
      onSimulateChange({ priceLift: val, cloudCostDelta, hiringDelay, churnDelta });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            What-If Sensitivity Sandbox
          </h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Reset to Base Assumptions"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sliders Area - Strict Monochrome */}
      <div className="space-y-3.5 text-xs">
        {/* Driver 1: Price Lift */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-muted-foreground">Price Optimization</span>
            <span className="font-mono tabular-nums text-foreground">
              {priceLift >= 0 ? `+${priceLift}%` : `${priceLift}%`}
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="25"
            step="1"
            value={priceLift}
            onChange={(e) => handlePriceChange(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 2: Cloud / Infrastructure Cost */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-muted-foreground">Cloud Hosting / COGS Delta</span>
            <span className="font-mono tabular-nums text-foreground">
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
              if (onSimulateChange) onSimulateChange({ priceLift, cloudCostDelta: val, hiringDelay, churnDelta });
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 3: Hiring Delay */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-muted-foreground">Hiring Delay (Non-Critical)</span>
            <span className="font-mono tabular-nums text-foreground">{hiringDelay} Mo</span>
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
              if (onSimulateChange) onSimulateChange({ priceLift, cloudCostDelta, hiringDelay: val, churnDelta });
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>

        {/* Driver 4: Churn Reduction */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-medium">
            <span className="text-muted-foreground">Customer Churn Improvement</span>
            <span className="font-mono tabular-nums text-foreground">
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
              if (onSimulateChange) onSimulateChange({ priceLift, cloudCostDelta, hiringDelay, churnDelta: val });
            }}
            className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-300"
          />
        </div>
      </div>

      {/* Simulated Outcomes Card */}
      <div className="rounded border border-border/80 bg-neutral-900/50 p-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground font-medium">Simulated Gross Margin:</span>
          <span className="text-lg font-semibold font-mono tabular-nums text-white">
            {simulatedMargin}%
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono border-t border-border/40 pt-1.5">
          <span className="text-muted-foreground">Net Margin Impact:</span>
          <span className={marginImpactBps >= 0 ? "text-emerald-400" : "text-rose-400"}>
            {marginImpactBps >= 0 ? `+${marginImpactBps} bps` : `${marginImpactBps} bps`}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-muted-foreground">Net Profit Impact:</span>
          <span className={netProfitImpact >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
            {netProfitImpact >= 0
              ? `+$${netProfitImpact.toLocaleString()}`
              : `-$${Math.abs(netProfitImpact).toLocaleString()}`}
          </span>
        </div>
      </div>

      {onCommitToDuckDB && (
        <button
          onClick={onCommitToDuckDB}
          disabled={isSyncing}
          className="w-full py-2 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors flex items-center justify-center space-x-1.5"
        >
          <span>{isSyncing ? "Writing to DuckDB..." : "Commit Scenario to Ledger"}</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
