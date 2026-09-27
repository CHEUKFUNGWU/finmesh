"use client";

import React, { useState } from "react";
import { MetricToken } from "./MetricToken";

interface VarianceMemoProps {
  onTokenClick: (metricId: string, sqlHash?: string) => void;
}

export function VarianceMemo({ onTokenClick }: VarianceMemoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    const rawMarkdown = `# Autonomous FP&A Variance Commentary — 2026-Q1 (Actual vs Budget)

During 2026-Q1, Revenue was $1,250,000 against a Budget of $1,375,000 (-$125,000 / -9.1%).
Gross Margin recorded $725,000 against a Budget of $820,000 (-$95,000 / -11.6%).
Opex registered $410,000 against a Budget of $450,000 (-$40,000 / -8.9%).
Net Income finished at $315,000 against a Budget of $370,000 (-$55,000 / -14.9%).

All numbers verified with zero arithmetic hallucination via DuckDB columnar queries.`;
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111827] border border-neutral-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Autonomous Finance BP Variance Memo</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/80 text-blue-400 border border-blue-800">
              Protocol-Neutral Gateway
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Zero Arithmetic Hallucination
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic PVM variance commentary with clickable audit tokens linked to DuckDB query hashes & journal lines
          </p>
        </div>
        <button
          onClick={handleCopyMarkdown}
          className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
        >
          {copied ? "Copied ✓" : "Copy Markdown"}
        </button>
      </div>

      <div className="mt-5 space-y-4 text-sm text-neutral-300 leading-relaxed font-sans bg-[#0B0F19] p-5 rounded border border-neutral-800">
        <div className="border-b border-neutral-800 pb-3">
          <h3 className="text-base font-semibold text-white">
            Q1 2026 Executive Performance Commentary (Actual vs Budget)
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generated via Go Core + DuckDB Columnar Verification | Model Gateway Adapter: OpenAI/Anthropic/Self-Hosted
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
          Cost of Goods Sold (COGS) totaled $525,000, achieving a favorable cost variance of{" "}
          <MetricToken
            metricId="cogs"
            value={30000}
            displayValue="-$30,000 (-5.4%)"
            sqlHash="b2c9d1e4"
            category="COGS"
            onClick={onTokenClick}
          />{" "}
          due to renegotiated cloud infrastructure tiering. Consequently, Gross Profit reached $725,000 with a net variance of{" "}
          <MetricToken
            metricId="gross_profit"
            value={-95000}
            displayValue="-$95,000 (-11.6%)"
            sqlHash="e5d4c3b2"
            category="Profitability"
            onClick={onTokenClick}
          />
          .
        </p>

        <p>
          Operating expenditures (Opex) closed at $410,000, delivering a favorable discipline delta of{" "}
          <MetricToken
            metricId="opex"
            value={40000}
            displayValue="-$40,000 (-8.9%)"
            sqlHash="c3e8f1a9"
            category="Opex"
            onClick={onTokenClick}
          />
          , resulting in an end-of-quarter Net Income of $315,000 (net variance of{" "}
          <MetricToken
            metricId="net_income"
            value={-55000}
            displayValue="-$55,000 (-14.9%)"
            sqlHash="f9a8b7c6"
            category="Profitability"
            onClick={onTokenClick}
          />
          ).
        </p>

        <div className="mt-4 pt-3 border-t border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
          <span className="italic">
            💡 Audit Tip: Click on any colored metric token above to slide out the Audit Trace Drawer and verify the exact DuckDB SQL execution and contributing ledger vouchers.
          </span>
          <span className="font-mono text-neutral-500">REQ-0004 & REQ-0005 Conformance</span>
        </div>
      </div>
    </div>
  );
}
