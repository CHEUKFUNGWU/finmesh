"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronRight } from "lucide-react";

export interface PvmBar {
  id: string;
  label: string;
  amount: number;
  type: "baseline" | "positive" | "negative" | "total";
  skus: { name: string; impact: number; changePct: string }[];
}

const DEFAULT_PVM_DATA: PvmBar[] = [
  {
    id: "baseline",
    label: "2026-Q1 Budget",
    amount: 1375000,
    type: "baseline",
    skus: [],
  },
  {
    id: "price",
    label: "Price Effect",
    amount: 25000,
    type: "positive",
    skus: [
      { name: "Enterprise Platform Tier", impact: 18000, changePct: "+4.5%" },
      { name: "Custom Integration Seat", impact: 7000, changePct: "+2.1%" },
    ],
  },
  {
    id: "volume",
    label: "Volume Effect",
    amount: -110000,
    type: "negative",
    skus: [
      { name: "APAC Mid-Market Expansion", impact: -75000, changePct: "-18.2%" },
      { name: "EMEA Pilot Conversion", impact: -35000, changePct: "-8.4%" },
    ],
  },
  {
    id: "mix",
    label: "Mix / Churn Effect",
    amount: -40000,
    type: "negative",
    skus: [
      { name: "Legacy Starter Downgrades", impact: -28000, changePct: "-6.1%" },
      { name: "Partner Reseller Margin Split", impact: -12000, changePct: "-3.3%" },
    ],
  },
  {
    id: "actual",
    label: "Recognized Revenue",
    amount: 1250000,
    type: "total",
    skus: [],
  },
];

interface PvmWaterfallExplorerProps {
  data?: PvmBar[];
  onTokenClick?: (metricId: string, sqlHash?: string) => void;
}

export function PvmWaterfallExplorer({ data = DEFAULT_PVM_DATA, onTokenClick }: PvmWaterfallExplorerProps) {
  const [selectedBar, setSelectedBar] = useState<PvmBar>(data[2]); // Default select Volume effect
  const [showFormula, setShowFormula] = useState(false);

  const totalVariance = data[4].amount - data[0].amount;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      {/* Header with Title & Formula Tooltip */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            PVM Variance Decomposition
          </h3>
          <div className="relative">
            <button
              onMouseEnter={() => setShowFormula(true)}
              onMouseLeave={() => setShowFormula(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              aria-label="PVM calculation formula"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
            {showFormula && (
              <div className="absolute left-0 top-6 z-50 w-72 rounded-md border border-neutral-700 bg-neutral-900 p-3 shadow-xl text-[11px] font-mono leading-relaxed text-neutral-300">
                <div className="font-semibold text-white mb-1.5">Algebraic PVM Invariant:</div>
                <div className="text-neutral-400">ΔPrice = (Price_act - Price_plan) × Vol_act</div>
                <div className="text-neutral-400">ΔVol = (Vol_act - Vol_plan) × Price_plan</div>
                <div className="text-neutral-400">ΔMix = Gross Deviation - ΔPrice - ΔVol</div>
                <div className="mt-1.5 pt-1.5 border-t border-neutral-800 text-neutral-500 text-[10px]">
                  |Δ_total - Reconstructed| ≤ $0.01 (Trial-Balanced)
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-muted-foreground">Net Variance:</span>
          <span className={`font-semibold tabular-nums ${totalVariance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {totalVariance >= 0 ? `+$${totalVariance.toLocaleString()}` : `-$${Math.abs(totalVariance).toLocaleString()}`} (-9.1%)
          </span>
        </div>
      </div>

      {/* Visual Waterfall Bars */}
      <div className="grid grid-cols-5 gap-2 items-end pt-2 pb-2">
        {data.map((bar) => {
          const isSelected = selectedBar?.id === bar.id;
          const isTotal = bar.type === "baseline" || bar.type === "total";
          const isPositive = bar.type === "positive";
          const isNegative = bar.type === "negative";

          return (
            <button
              key={bar.id}
              onClick={() => bar.skus.length > 0 && setSelectedBar(bar)}
              className={`group flex flex-col items-center text-center p-2 rounded transition-colors ${
                isSelected
                  ? "bg-neutral-800/80 ring-1 ring-neutral-700"
                  : "hover:bg-neutral-800/40 cursor-pointer"
              }`}
            >
              <div className="text-[11px] font-mono font-medium text-foreground mb-1 tabular-nums">
                {isNegative
                  ? `-$${Math.abs(bar.amount / 1000).toFixed(0)}k`
                  : isTotal
                  ? `$${(bar.amount / 1000).toFixed(0)}k`
                  : `+$${(bar.amount / 1000).toFixed(0)}k`}
              </div>

              {/* Bar visualization: pure neutral for totals, color ONLY for variance bars */}
              <div className="w-full flex items-end justify-center h-28 bg-neutral-900/60 rounded-[2px] p-1 border border-neutral-850">
                <div
                  style={{
                    height: isTotal
                      ? "85%"
                      : `${Math.min(100, Math.max(25, (Math.abs(bar.amount) / 120000) * 100))}%`,
                  }}
                  className={`w-full max-w-[42px] rounded-[2px] transition-all ${
                    isTotal
                      ? "bg-neutral-300"
                      : isPositive
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
              </div>

              <div className="mt-2 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                {bar.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Drill-down SKU Contribution List */}
      {selectedBar && selectedBar.skus.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Segment & Product Attribution: {selectedBar.label}</span>
            <span className="font-mono text-[11px]">Ranked by Net Deviation</span>
          </div>

          <div className="divide-y divide-border/60 rounded border border-border bg-neutral-900/40">
            {selectedBar.skus.map((sku) => (
              <div
                key={sku.name}
                className="flex items-center justify-between p-2.5 text-xs transition hover:bg-neutral-800/40"
              >
                <div className="flex items-center space-x-2">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{sku.name}</span>
                </div>
                <div className="flex items-center space-x-3 font-mono tabular-nums">
                  <span
                    className={
                      sku.impact >= 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"
                    }
                  >
                    {sku.impact >= 0
                      ? `+$${sku.impact.toLocaleString()}`
                      : `-$${Math.abs(sku.impact).toLocaleString()}`}
                  </span>
                  <span className="text-muted-foreground text-[11px] w-12 text-right">
                    {sku.changePct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
