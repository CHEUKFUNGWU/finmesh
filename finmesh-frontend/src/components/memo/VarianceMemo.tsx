"use client";

import React, { useState } from "react";
import { MetricToken } from "./MetricToken";
import { Copy, Check, Sparkles, Lightbulb } from "lucide-react";
import type { IndustryMemoConfig } from "@/lib/industryTemplates";

interface VarianceMemoProps {
  onTokenClick: (metricId: string, sqlHash?: string) => void;
  onOpenPresentation?: () => void;
  config?: IndustryMemoConfig;
}

export function VarianceMemo({ onTokenClick, onOpenPresentation, config }: VarianceMemoProps) {
  const [copied, setCopied] = useState(false);

  const title = config?.title ?? "Q1 2026 Executive Performance Commentary (Actual vs Budget)";
  const period = config?.period ?? "2026-Q1 (Actual vs Budget)";
  const summary = config?.summary ?? "In Q1 2026, total recognized revenue stood at $1,250,000, underperforming budget expectations by -$125,000 (-9.1%).";

  const handleCopyMarkdown = () => {
    let markdownContent = `# ${title}\nPeriod: ${period}\n\n${summary}\n\n`;
    if (config?.bullets) {
      markdownContent += "### Variance Highlights:\n";
      config.bullets.forEach((b) => {
        markdownContent += `- ${b.textBefore} [${b.tokenValue}] ${b.textAfter}\n`;
      });
    }
    if (config?.recommendations) {
      markdownContent += "\n### Strategic Recommendations:\n";
      config.recommendations.forEach((r) => {
        markdownContent += `- ${r}\n`;
      });
    }

    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0F141C] border border-neutral-800 rounded-lg p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neutral-400" />
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              Autonomous FP&amp;A Variance Memo
            </h2>
            <p className="text-[11px] text-neutral-500 font-mono">
              Protocol-Neutral • DuckDB Verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs transition-colors cursor-pointer"
            title="Copy as Markdown"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Main Commentary Body */}
      <div className="space-y-3.5 text-xs text-neutral-300 leading-relaxed font-sans bg-[#070A10] p-4 rounded border border-neutral-800/80">
        <div className="border-b border-neutral-800/80 pb-2">
          <h3 className="text-xs font-semibold text-white">
            {title}
          </h3>
          <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">
            {period} • Model Gateway Adapter / DuckDB Columnar Lineage
          </p>
        </div>

        <p className="text-neutral-300 leading-relaxed">
          {summary}
        </p>

        {config?.bullets && config.bullets.length > 0 ? (
          <div className="space-y-2 pt-1 border-t border-neutral-800/60">
            {config.bullets.map((b, idx) => (
              <p key={idx} className="leading-relaxed">
                {b.textBefore}
                <MetricToken
                  metricId={b.tokenId}
                  value={0}
                  displayValue={b.tokenValue}
                  category={b.category || "Financial Metric"}
                  onClick={onTokenClick}
                />
                {b.textAfter}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-2 pt-1 border-t border-neutral-800/60">
            <p>
              Total revenue shortfall was contained by price discipline, but volume lagged budget by{" "}
              <MetricToken
                metricId="revenue"
                value={-125000}
                displayValue="-$125,000 (-9.1%)"
                sqlHash="a7f8e32c"
                category="Revenue"
                onClick={onTokenClick}
              />
              . This variance was primarily driven by delayed enterprise software implementations in the APAC segment.
            </p>
            <p>
              Cost of Goods Sold (COGS) closed at $525,000, achieving favorable cost efficiency of{" "}
              <MetricToken
                metricId="cogs"
                value={30000}
                displayValue="+$30,000 (+5.4%)"
                sqlHash="b2c9d1e4"
                category="COGS"
                onClick={onTokenClick}
              />{" "}
              against the budget target of $555,000. Optimization in cloud compute clustering lowered infrastructure ingestion unit costs.
            </p>
          </div>
        )}

        {config?.recommendations && config.recommendations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-neutral-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-400 font-semibold text-[11px]">
              <Lightbulb className="h-3.5 w-3.5 text-neutral-400" />
              <span>Strategic Action Items:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-neutral-400 text-[11px]">
              {config.recommendations.map((rec, idx) => (
                <li key={idx} className="leading-relaxed">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
