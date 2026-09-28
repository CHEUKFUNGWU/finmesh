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
  category,
  onClick,
}: MetricTokenProps) {
  const num = typeof value === "number" ? value : parseFloat(value);
  const isPositive = num >= 0;

  return (
    <button
      type="button"
      data-category={category}
      onClick={() => onClick && onClick(metricId, sqlHash)}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded text-xs font-mono font-medium bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-850 transition-colors cursor-pointer"
      title={`Click to inspect ${category ? `[${category}] ` : ""}DuckDB SQL & Ledger vouchers (Hash: #${sqlHash})`}
    >
      <span className={`tabular-nums ${isPositive ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}`}>
        {displayValue}
      </span>
      <span className="text-[10px] text-neutral-500 font-mono">
        #{sqlHash.slice(0, 4)}
      </span>
    </button>
  );
}
