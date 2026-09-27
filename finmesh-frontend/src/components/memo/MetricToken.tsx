"use client";

import React from "react";

interface MetricTokenProps {
  metricId: string;
  value: string | number;
  displayValue: string;
  sqlHash?: string;
  category?: string;
  onClick?: (metricId: string, sqlHash?: string) => void;
}

export function MetricToken({
  metricId,
  value,
  displayValue,
  sqlHash = "a7f8e32c",
  category = "variance",
  onClick,
}: MetricTokenProps) {
  const num = typeof value === "number" ? value : parseFloat(value);
  const isPositive = num >= 0;

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(metricId, sqlHash)}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded text-xs font-mono font-medium border transition-all cursor-pointer shadow-sm hover:scale-105 ${
        isPositive
          ? "bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60"
          : "bg-rose-950/40 text-rose-300 border-rose-700/60 hover:bg-rose-900/60"
      }`}
      title={`Click to inspect SQL & Ledger entries (Hash: #${sqlHash})`}
    >
      <span>{displayValue}</span>
      <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-neutral-400 font-sans border border-neutral-700/50">
        #{sqlHash.slice(0, 4)}
      </span>
    </button>
  );
}
