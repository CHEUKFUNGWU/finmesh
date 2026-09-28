"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiStatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtext?: string;
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

export function KpiStatCard({
  title,
  value,
  change,
  trend = "neutral",
  subtext,
  sparklineData,
  onClick,
  className,
}: KpiStatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-neutral-700",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground tracking-tight">
          {title}
        </span>
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium",
              trend === "up" && "text-emerald-400 bg-emerald-950/30 border border-emerald-900/40",
              trend === "down" && "text-rose-400 bg-rose-950/30 border border-rose-900/40",
              trend === "neutral" && "text-muted-foreground bg-muted border border-border"
            )}
          >
            {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
            <span>{change}</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-semibold font-mono tracking-tight text-foreground tabular-nums">
          {value}
        </div>

        {/* Lightweight SVG/CSS Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="flex items-end gap-1 h-6 shrink-0">
            {sparklineData.map((val, idx) => {
              const max = Math.max(...sparklineData);
              const heightPct = Math.max(15, Math.round((val / max) * 100));
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className="w-1.5 rounded-t-[1px] bg-neutral-700 group-hover:bg-neutral-500 transition-colors"
                />
              );
            })}
          </div>
        )}
      </div>

      {subtext && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground font-sans">
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
