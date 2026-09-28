"use client";

import React, { useState } from "react";
import { MetricToken } from "./MetricToken";
import { Copy, Check, Sparkles } from "lucide-react";

interface VarianceMemoProps {
  onTokenClick: (metricId: string, sqlHash?: string) => void;
  onOpenPresentation?: () => void;
}

export function VarianceMemo({ onTokenClick, onOpenPresentation }: VarianceMemoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    const markdownContent = `# Q1 2026 Executive Performance Commentary (Actual vs Budget)

In Q1 2026, total recognized revenue stood at $1,250,000, underperforming budget expectations by -$125,000 (-9.1%). This variance was primarily driven by delayed enterprise software implementations in the APAC segment, partially offset by resilient ARR retention in North America.

Cost of Goods Sold (COGS) closed at $525,000, achieving favorable cost efficiency of +$30,000 (+5.4%) against the budget target of $555,000. Optimization in cloud compute clustering (AWS Graviton) lowered infrastructure ingestion unit costs.

Consequently, Gross Profit reached $725,000 against a $820,000 target, representing a gross variance of -$95,000 (-11.6%). Operating Expenses (OPEX) totaled $410,000, presenting a favorable variance of +$40,000 (+8.9%) due to tactical engineering hiring freezes.

Net Income closed at $315,000 (-$55,000 vs budget plan of $370,000). Total cash runway remains healthy at 28.4 Months.`;

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
            Q1 2026 Executive Performance Commentary (Actual vs Budget)
          </h3>
          <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">
            Model Gateway Adapter: Claude 3.7 / DuckDB Columnar Verification
          </p>
        </div>

        <p>
          In Q1 2026, total recognized revenue stood at $1,250,000, underperforming budget expectations by{" "}
          <MetricToken
            metricId="revenue"
            value={-125000}
            displayValue="-$125,000 (-9.1%)"
            sqlHash="a7f8e32c"
            category="Revenue"
            onClick={onTokenClick}
          />
          . This variance was primarily driven by delayed enterprise software implementations in the APAC segment, partially offset by resilient ARR retention in North America.
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
          against the budget target of $555,000. Optimization in cloud compute clustering (AWS Graviton) lowered infrastructure ingestion unit costs.
        </p>

        <p>
          Consequently, Gross Profit reached $725,000 against a $820,000 target, representing a gross variance of{" "}
          <MetricToken
            metricId="gross_profit"
            value={-95000}
            displayValue="-$95,000 (-11.6%)"
            sqlHash="e5d4c3b2"
            category="Profitability"
            onClick={onTokenClick}
          />
          . Operating Expenses (OPEX) totaled $410,000, presenting a favorable variance of{" "}
          <MetricToken
            metricId="opex"
            value={40000}
            displayValue="+$40,000 (+8.9%)"
            sqlHash="f1a2b3c4"
            category="Opex"
            onClick={onTokenClick}
          />{" "}
          due to tactical engineering hiring freezes.
        </p>

        <p>
          Net Income closed at $315,000 (
          <MetricToken
            metricId="net_income"
            value={-55000}
            displayValue="-$55,000 (-14.9%)"
            sqlHash="99e8d7c6"
            category="Profitability"
            onClick={onTokenClick}
          />{" "}
          vs budget plan of $370,000). Total cash runway remains healthy at 28.4 Months with positive gross operational margins.
        </p>
      </div>
    </div>
  );
}
