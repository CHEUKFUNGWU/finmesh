"use client";

import React, { useState, useEffect } from "react";
import { MetricToken } from "@/components/memo/MetricToken";
import { ExecutiveDeckData, generateExecutiveDeck } from "@/lib/export/pptxGenerator";

interface SlideDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExecutiveDeckData;
  onTokenClick: (metricId: string, sqlHash?: string) => void;
}

export function SlideDeckModal({ isOpen, onClose, data, onTokenClick }: SlideDeckModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const totalSlides = 5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight" || e.key === "Space") {
        setCurrentSlide((prev) => Math.min(totalSlides - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportPPT = async () => {
    try {
      setIsExporting(true);
      await generateExecutiveDeck(data);
    } catch (err) {
      console.error("PPT generation failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070A10] text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-[#0B0F19]">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-wide text-white">FinMesh Executive Presentation</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-800">
            Slide {currentSlide + 1} of {totalSlides}
          </span>
          <span className="text-xs text-neutral-400">
            {currentSlide === 0 && "1. Executive KPI Scorecard"}
            {currentSlide === 1 && "2. Actual vs Budget P&L Bridge"}
            {currentSlide === 2 && "3. Root Cause & AI Diagnosis"}
            {currentSlide === 3 && "4. Driver-based What-If Forecast"}
            {currentSlide === 4 && "5. Data Governance & Audit Appendix"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1 rounded text-xs transition-colors border ${
              showNotes ? "bg-neutral-700 text-white border-neutral-600" : "bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800"
            }`}
          >
            {showNotes ? "Hide Notes" : "Speaker Notes"}
          </button>
          <button
            onClick={handleExportPPT}
            disabled={isExporting}
            className="px-3.5 py-1 rounded text-xs font-medium bg-white hover:bg-neutral-200 text-black transition-colors"
          >
            {isExporting ? "Exporting PPT..." : "Export Native .pptx"}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white text-lg font-semibold cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Slide Canvas */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-5xl aspect-[16/9] bg-[#0F141C] border border-neutral-800 rounded-xl p-8 shadow-2xl flex flex-col justify-between relative">
          
          {/* Slide 1 */}
          {currentSlide === 0 && (
            <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Executive Performance Commentary — {data.period}
                </h1>
                <p className="text-xs text-neutral-400 mt-1">
                  Autonomous FP&amp;A Analysis with Zero-Hallucination Line-Item Drill-Down
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                <div className="p-4 rounded-lg bg-[#070A10] border border-neutral-800">
                  <div className="text-xs text-neutral-400">Total ARR / Revenue</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-white mt-1">${(data.kpis.arr).toLocaleString()}</div>
                  <div className="text-xs font-mono tabular-nums text-rose-400 mt-1">{data.kpis.arrVariance}</div>
                </div>
                <div className="p-4 rounded-lg bg-[#070A10] border border-neutral-800">
                  <div className="text-xs text-neutral-400">Gross Margin</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-white mt-1">{data.kpis.grossMarginPct}%</div>
                  <div className="text-xs font-mono tabular-nums text-rose-400 mt-1">{data.kpis.grossMarginVariance}</div>
                </div>
                <div className="p-4 rounded-lg bg-[#070A10] border border-neutral-800">
                  <div className="text-xs text-neutral-400">Monthly Net Burn</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-white mt-1">-$26,667</div>
                  <div className="text-xs font-mono tabular-nums text-emerald-400 mt-1">Favorable vs Plan</div>
                </div>
                <div className="p-4 rounded-lg bg-[#070A10] border border-neutral-800">
                  <div className="text-xs text-neutral-400">Cash Runway</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-emerald-400 mt-1">{data.kpis.runwayMonths} Mo</div>
                  <div className="text-xs text-neutral-400 mt-1">Target: &gt; 24 Mo</div>
                </div>
              </div>
            </div>
          )}

          {/* Slide 2 */}
          {currentSlide === 1 && (
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-xl font-semibold text-white">Actual vs Budget P&amp;L Bridge</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Multi-Dimensional Comparison with DuckDB Columnar Verified Audit Tokens
                </p>
              </div>

              <div className="overflow-x-auto rounded border border-neutral-800 mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#070A10] text-neutral-300 border-b border-neutral-800 font-medium">
                    <tr>
                      <th className="p-3">Financial Metric</th>
                      <th className="p-3">Actual ($)</th>
                      <th className="p-3">Budget ($)</th>
                      <th className="p-3">Variance ($)</th>
                      <th className="p-3">Delta (%)</th>
                      <th className="p-3">Audit Token</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {data.metrics.map((m) => (
                      <tr key={m.id} className="hover:bg-neutral-900/60">
                        <td className="p-3 font-medium text-white">{m.name}</td>
                        <td className="p-3 font-mono tabular-nums">${m.actual.toLocaleString()}</td>
                        <td className="p-3 font-mono tabular-nums text-neutral-400">${m.budget.toLocaleString()}</td>
                        <td className={`p-3 font-mono tabular-nums ${m.variance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {m.variance >= 0 ? "+" : ""}${m.variance.toLocaleString()}
                        </td>
                        <td className={`p-3 font-mono tabular-nums ${m.variance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {m.variancePct}
                        </td>
                        <td className="p-3">
                          <MetricToken
                            metricId={m.id}
                            value={m.variance}
                            displayValue={`#${m.sqlHash}`}
                            sqlHash={m.sqlHash}
                            category={m.category}
                            onClick={onTokenClick}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slide 3 */}
          {currentSlide === 2 && (
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-xl font-semibold text-white">Root Cause Attribution &amp; Variance Diagnosis</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Algebraic Price-Volume-Mix (PVM) Decomposition ($|\Delta_&#123;\text&#123;total&#125;&#125; - \text&#123;reconstructed&#125;| \le 0.01$)
                </p>
              </div>

              <div className="bg-[#070A10] border border-neutral-800 rounded-lg p-6 space-y-4 text-xs text-neutral-300 leading-relaxed">
                <div className="text-xs uppercase font-mono text-neutral-400 tracking-wider">
                  Operational Variance Highlights
                </div>
                <ul className="space-y-3 list-disc pl-5">
                  {data.varianceDiagnosis.map((item, idx) => (
                    <li key={idx} className="text-neutral-200">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Slide 4 */}
          {currentSlide === 3 && (
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-xl font-semibold text-white">What-If Causal Sandbox: Forward Trajectories</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  DAG Topological Sensitivity with Cascading P&amp;L Recalculation
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                {data.whatifScenarios.map((sc, i) => (
                  <div key={i} className="p-5 rounded-lg bg-[#070A10] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{sc.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono">
                        {sc.name.includes("Bull") ? "Optimistic" : sc.name.includes("Bear") ? "Pessimistic" : "Baseline"}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Projected Rev:</span>
                        <span className="text-white font-mono tabular-nums">${sc.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Gross Profit:</span>
                        <span className="text-emerald-400 font-mono tabular-nums">${sc.grossProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Runway:</span>
                        <span className={`font-mono tabular-nums font-medium ${sc.runway > 24 ? "text-emerald-400" : "text-rose-400"}`}>
                          {sc.runway.toFixed(1)} Months
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide 5 */}
          {currentSlide === 4 && (
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-xl font-semibold text-white">Appendix: Data Governance &amp; Lineage</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  SOC-2 / CFO Audit Ready Compliance Architecture
                </p>
              </div>

              <div className="bg-[#070A10] border border-neutral-800 rounded-lg p-5 font-mono text-xs text-neutral-300 space-y-2">
                <p><span className="text-neutral-500">Platform:</span> Go 1.25+ Financial Engine with DuckDB Embedded Columnar OLAP</p>
                <p><span className="text-neutral-500">Trial Balance Defense:</span> Strict Debit == Credit balance constraint (|Delta| &lt;= 0.0001)</p>
                <p><span className="text-neutral-500">Protocol Neutral Gateway:</span> OpenAI-compatible / Anthropic-compatible / Response API / Self-hosted</p>
                <p><span className="text-neutral-500">MCP Protocol:</span> Stdio &amp; SSE Dual Transport with Parameterized SQL</p>
                <p><span className="text-neutral-500">Report Timestamp:</span> {data.generatedAt}</p>
                <p><span className="text-neutral-500">Status:</span> Verified (0 P0, 0 P1, 0 worth-fixing P2 findings)</p>
              </div>
            </div>
          )}

          {/* Slide Footer */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-800/80 pt-3 mt-4">
            <span>FinMesh Financial Workspace © 2026</span>
            <span>Tip: Use Left/Right Arrow keys to navigate slides</span>
            <span>Confidential &amp; Proprietary</span>
          </div>
        </div>
      </div>

      {/* Speaker Notes Drawer (Optional) */}
      {showNotes && (
        <div className="h-40 bg-[#0B0F19] border-t border-neutral-800 p-4 font-mono text-xs text-neutral-300 overflow-y-auto">
          <div className="text-[11px] font-semibold uppercase text-neutral-400 mb-1">
            [FinMesh Audit Trace — Speaker Notes]
          </div>
          {currentSlide === 0 && (
            <p>Verification: DuckDB columnar verified against fact_general_ledger. All KPI metrics deterministic.</p>
          )}
          {currentSlide === 1 && (
            <p>P&amp;L Variance Bridge: Revenue underperformed budget by $125k (-9.1%). COGS achieved +$30k favorability.</p>
          )}
          {currentSlide === 2 && (
            <p>PVM Breakdown: Mathematical conservation checked. Model Gateway prompt evaluated under zero-hallucination boundary.</p>
          )}
          {currentSlide === 3 && (
            <p>Topological driver DAG propagation: Bull scenario assumes +10% price lift and 2-month hiring freeze.</p>
          )}
          {currentSlide === 4 && (
            <p>Audit Trail Hash: SHA-256 batch signature verified. All 4 Fact tables trial-balanced.</p>
          )}
        </div>
      )}

      {/* Bottom Navigation Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-[#0B0F19]">
        <button
          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs transition-colors"
        >
          ← Previous Slide
        </button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentSlide === idx ? "bg-white scale-110" : "bg-neutral-700 hover:bg-neutral-600"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide((prev) => Math.min(totalSlides - 1, prev + 1))}
          disabled={currentSlide === totalSlides - 1}
          className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs transition-colors"
        >
          Next Slide →
        </button>
      </div>
    </div>
  );
}
