"use client";

import React, { useState, useEffect } from "react";
import { functionEvaluator, FormulaResult } from "@/lib/excel/customFunctions";

interface CellState {
  raw: string; // e.g. '=FINMESH.METRIC("revenue", "2026-Q1", "actual")' or '100' or 'Revenue'
  evaluated: number | string;
  sqlHash?: string;
  isFormula: boolean;
  status?: "ok" | "error" | "loading";
  error?: string;
}

export function ExcelTaskpane() {
  const [activePaneTab, setActivePaneTab] = useState<"catalog" | "whatif" | "audit" | "manifest">("catalog");
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>({ r: 2, c: 2 });
  const [batchCount, setBatchCount] = useState(1);
  const [lastLatencyMs, setLastLatencyMs] = useState(2.4);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Driver overrides in Taskpane
  const [priceLift, setPriceLift] = useState(0.1);
  const [hiringDelay, setHiringDelay] = useState(2);
  const [churnImprovement, setChurnImprovement] = useState(0.02);

  // Grid initialization (10 rows x 5 columns)
  // Columns: A=Metric Label, B=Actual (Formula), C=Budget (Formula), D=Variance ($), E=Audit Token
  const [grid, setGrid] = useState<CellState[][]>(() => {
    const rows: CellState[][] = [];
    
    // Row 0: Headers
    rows.push([
      { raw: "Line Item", evaluated: "Line Item", isFormula: false },
      { raw: "Actuals Q1", evaluated: "Actuals Q1", isFormula: false },
      { raw: "Budget Q1", evaluated: "Budget Q1", isFormula: false },
      { raw: "Variance ($)", evaluated: "Variance ($)", isFormula: false },
      { raw: "Audit Token", evaluated: "Audit Token", isFormula: false },
    ]);

    // Row 1: Revenue
    rows.push([
      { raw: "Total Revenue", evaluated: "Total Revenue", isFormula: false },
      { raw: '=FINMESH.METRIC("revenue", "2026-Q1", "actual")', evaluated: 180000, sqlHash: "a7f8e32c", isFormula: true, status: "ok" },
      { raw: '=FINMESH.METRIC("revenue", "2026-Q1", "budget")', evaluated: 200000, sqlHash: "b9e2f41d", isFormula: true, status: "ok" },
      { raw: "-$20,000", evaluated: "-$20,000 (-10.0%)", isFormula: false },
      { raw: "#a7f8e32c", evaluated: "#a7f8e32c", isFormula: false },
    ]);

    // Row 2: COGS
    rows.push([
      { raw: "Cost of Goods Sold", evaluated: "Cost of Goods Sold", isFormula: false },
      { raw: '=FINMESH.METRIC("cogs", "2026-Q1", "actual")', evaluated: 36000, sqlHash: "b2c9d1e4", isFormula: true, status: "ok" },
      { raw: '=FINMESH.METRIC("cogs", "2026-Q1", "budget")', evaluated: 30000, sqlHash: "c4d5e6f7", isFormula: true, status: "ok" },
      { raw: "+$6,000", evaluated: "+$6,000 (Cost Overrun)", isFormula: false },
      { raw: "#b2c9d1e4", evaluated: "#b2c9d1e4", isFormula: false },
    ]);

    // Row 3: Gross Profit
    rows.push([
      { raw: "Gross Profit", evaluated: "Gross Profit", isFormula: false },
      { raw: '=FINMESH.METRIC("gross_profit", "2026-Q1", "actual")', evaluated: 144000, sqlHash: "e5d4c3b2", isFormula: true, status: "ok" },
      { raw: '=FINMESH.METRIC("gross_profit", "2026-Q1", "budget")', evaluated: 170000, sqlHash: "d8c7b6a5", isFormula: true, status: "ok" },
      { raw: "-$26,000", evaluated: "-$26,000 (-15.3%)", isFormula: false },
      { raw: "#e5d4c3b2", evaluated: "#e5d4c3b2", isFormula: false },
    ]);

    // Row 4: OPEX
    rows.push([
      { raw: "Operating Expenses", evaluated: "Operating Expenses", isFormula: false },
      { raw: '=FINMESH.METRIC("opex", "2026-Q1", "actual")', evaluated: 64000, sqlHash: "f1a2b3c4", isFormula: true, status: "ok" },
      { raw: '=FINMESH.METRIC("opex", "2026-Q1", "budget")', evaluated: 60000, sqlHash: "e9f8a7b6", isFormula: true, status: "ok" },
      { raw: "+$4,000", evaluated: "+$4,000", isFormula: false },
      { raw: "#f1a2b3c4", evaluated: "#f1a2b3c4", isFormula: false },
    ]);

    // Row 5: Net Income
    rows.push([
      { raw: "Net Income", evaluated: "Net Income", isFormula: false },
      { raw: '=FINMESH.METRIC("net_income", "2026-Q1", "actual")', evaluated: 80000, sqlHash: "99e8d7c6", isFormula: true, status: "ok" },
      { raw: '=FINMESH.METRIC("net_income", "2026-Q1", "budget")', evaluated: 110000, sqlHash: "88d7c6b5", isFormula: true, status: "ok" },
      { raw: "-$30,000", evaluated: "-$30,000 (-27.3%)", isFormula: false },
      { raw: "#99e8d7c6", evaluated: "#99e8d7c6", isFormula: false },
    ]);

    return rows;
  });

  const [drilldownData, setDrilldownData] = useState<{
    metricName: string;
    period: string;
    scenario: string;
    cteSql?: string;
    sqlHash?: string;
    vouchers?: Array<{
      voucher_id: string;
      line_no: number;
      posting_date: string;
      account_code: string;
      account_name: string;
      account_category: string;
      debit_amount: number;
      credit_amount: number;
    }>;
    isLoading: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const cell = grid[selectedCell.r]?.[selectedCell.c];
    if (!cell || !cell.isFormula || !cell.raw.startsWith("=")) {
      setDrilldownData(null);
      return;
    }

    const match = cell.raw.match(/=FINMESH\.METRIC\(\s*["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?(?:,\s*["']([^"']+)["'])?(?:,\s*["']([^"']+)["'])?\s*\)/i);
    if (!match) {
      setDrilldownData(null);
      return;
    }

    const metric = match[1];
    const period = match[2] || "2026-Q1";
    const scenario = match[3] || "actual";

    let isMounted = true;
    setDrilldownData({ metricName: metric, period, scenario, isLoading: true });

    const apiUrl = process.env.NEXT_PUBLIC_FINMESH_API_URL || "http://localhost:8080";
    fetch(`${apiUrl}/api/v1/metrics/drilldown?metric_name=${encodeURIComponent(metric)}&period=${encodeURIComponent(period)}&scenario=${encodeURIComponent(scenario)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setDrilldownData({
          metricName: metric,
          period,
          scenario,
          cteSql: data.cte_sql,
          sqlHash: data.sql_hash || cell.sqlHash,
          vouchers: data.vouchers || [],
          isLoading: false,
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setDrilldownData((prev) => prev ? {
          ...prev,
          isLoading: false,
          error: "Backend drilldown offline (showing simulated query plan)",
          cteSql: `SELECT voucher_id, line_no, posting_date, account_code, debit_amount, credit_amount\nFROM fact_general_ledger\nWHERE scenario = '${scenario}'\nORDER BY posting_date DESC\nLIMIT 20;`,
          sqlHash: cell.sqlHash || "a7f8e32c",
        } : null);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCell, grid]);

  const parseAndEvaluateFormula = async (r: number, c: number, formulaStr: string) => {
    // Regex for =FINMESH.METRIC("metric", ["period"], ["scenario"], ["department"])
    const match = formulaStr.match(/=FINMESH\.METRIC\(\s*["']([^"']+)["']\s*(?:,\s*["']([^"']+)["'])?(?:,\s*["']([^"']+)["'])?(?:,\s*["']([^"']+)["'])?\s*\)/i);
    if (!match) {
      setGrid((prev) => {
        const next = [...prev.map((row) => [...row])];
        next[r][c] = { raw: formulaStr, evaluated: "#VALUE!", isFormula: true, status: "error", error: "Syntax: =FINMESH.METRIC(\"name\", [\"period\"], [\"scenario\"], [\"department\"])" };
        return next;
      });
      return;
    }

    const metricName = match[1];
    const period = match[2] || "2026-Q1";
    const scenario = match[3] || "actual";
    const department = match[4] || "";

    setGrid((prev) => {
      const next = [...prev.map((row) => [...row])];
      next[r][c] = { ...next[r][c], raw: formulaStr, evaluated: "Calculating...", status: "loading" };
      return next;
    });

    const start = performance.now();
    const res: FormulaResult = await functionEvaluator.evaluate(metricName, period, scenario, department);
    const latency = performance.now() - start;

    setLastLatencyMs(Math.round(latency * 10) / 10);
    setBatchCount((prev) => prev + 1);

    setGrid((prev) => {
      const next = [...prev.map((row) => [...row])];
      if (res.status === "ok") {
        next[r][c] = {
          raw: formulaStr,
          evaluated: res.value,
          sqlHash: res.sqlHash,
          isFormula: true,
          status: "ok",
        };
      } else {
        next[r][c] = {
          raw: formulaStr,
          evaluated: res.error || "#ERROR!",
          isFormula: true,
          status: "error",
          error: res.error,
        };
      }
      return next;
    });
  };

  const handleCellChange = (r: number, c: number, newRaw: string) => {
    if (newRaw.startsWith("=")) {
      parseAndEvaluateFormula(r, c, newRaw);
    } else {
      setGrid((prev) => {
        const next = [...prev.map((row) => [...row])];
        next[r][c] = { raw: newRaw, evaluated: newRaw, isFormula: false };
        return next;
      });
    }
  };

  const handleInsertMetric = (metricKey: string) => {
    const formula = `=FINMESH.METRIC("${metricKey}", "2026-Q1", "actual")`;
    handleCellChange(selectedCell.r, selectedCell.c, formula);
  };

  const handleCommitSandbox = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const payload = {
        scenario_name: "WhatIf_Excel",
        driver_overrides: {
          price_lift: priceLift,
          hiring_delay_months: hiringDelay,
          churn_rate: -churnImprovement,
        },
      };

      const res = await fetch("http://localhost:8080/api/v1/scenarios/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Backend override endpoint unreachable");
      const json = await res.json();
      setSyncStatus(`Scenario "${json.scenario_name}" updated in DuckDB! Projected Rev: $${json.simulated_revenue.toLocaleString()} (Runway: ${json.simulated_runway_months} Mo)`);
    } catch {
      // Offline fallback feedback
      const simRev = 180000 * (1 + priceLift + churnImprovement);
      setSyncStatus(`Offline Simulation: Scenario "WhatIf_Excel" committed! Projected Rev: $${Math.round(simRev).toLocaleString()} (Runway: 28.5 Mo)`);
    } finally {
      setIsSyncing(false);
    }
  };

  const currentCellData = grid[selectedCell.r]?.[selectedCell.c] || { raw: "", evaluated: "", isFormula: false };

  return (
    <div className="bg-[#111827] border border-neutral-800 rounded-lg p-5 shadow-sm space-y-5">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Excel Two-Way Sync Add-in (Office.js)</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              Live DuckDB Formula Binding
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950 text-blue-400 border border-blue-800">
              50ms Batch Debouncing
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Simulate native Excel 365 formulas (=FINMESH.METRIC) communicating with DuckDB semantic layers with zero arithmetic error
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400 font-mono">Telemetry:</span>
          <span className="px-2 py-1 rounded bg-[#0B0F19] border border-neutral-800 text-neutral-300 font-mono">
            Batches: {batchCount}
          </span>
          <span className="px-2 py-1 rounded bg-[#0B0F19] border border-neutral-800 text-emerald-400 font-mono">
            {lastLatencyMs}ms Latency
          </span>
        </div>
      </div>

      {/* Main Split Layout: Excel Sheet Emulator + Office.js Taskpane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Excel Sheet Grid Emulator (8 cols) */}
        <div className="lg:col-span-8 bg-[#0B0F19] border border-neutral-800 rounded-lg p-4 space-y-3">
          
          {/* Excel Formula Bar */}
          <div className="flex items-center gap-2 bg-[#111827] border border-neutral-700/80 rounded px-3 py-1.5 text-xs font-mono">
            <span className="text-neutral-400 font-bold">
              {String.fromCharCode(65 + selectedCell.c)}{selectedCell.r + 1}
            </span>
            <span className="text-neutral-600">|</span>
            <span className="text-emerald-400 font-bold">fx</span>
            <input
              type="text"
              value={currentCellData.raw}
              onChange={(e) => handleCellChange(selectedCell.r, selectedCell.c, e.target.value)}
              className="flex-1 bg-transparent text-white focus:outline-none text-xs font-mono"
              placeholder='Type =FINMESH.METRIC("revenue", "2026-Q1", "actual")'
            />
          </div>

          {/* Table Grid */}
          <div className="overflow-x-auto border border-neutral-800 rounded">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1F2937]/50 text-neutral-400 border-b border-neutral-800 font-mono">
                  <th className="w-10 p-2 text-center border-r border-neutral-800">#</th>
                  <th className="p-2 border-r border-neutral-800">A (Line Item)</th>
                  <th className="p-2 border-r border-neutral-800">B (Actuals)</th>
                  <th className="p-2 border-r border-neutral-800">C (Budget)</th>
                  <th className="p-2 border-r border-neutral-800">D (Variance)</th>
                  <th className="p-2">E (Audit Hash)</th>
                </tr>
              </thead>
              <tbody>
                {grid.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-neutral-800/80 hover:bg-neutral-900/40">
                    <td className="p-2 text-center text-neutral-500 font-mono bg-[#111827]/40 border-r border-neutral-800">
                      {rIdx + 1}
                    </td>
                    {row.map((cell, cIdx) => {
                      const isSelected = selectedCell.r === rIdx && selectedCell.c === cIdx;
                      return (
                        <td
                          key={cIdx}
                          onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                          className={`p-2 border-r border-neutral-800/60 font-mono cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-950/60 text-white ring-2 ring-blue-500 z-10"
                              : "text-neutral-300"
                          } ${cell.status === "error" ? "text-rose-400" : ""}`}
                        >
                          {typeof cell.evaluated === "number" ? `$${cell.evaluated.toLocaleString()}` : cell.evaluated}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
            <span>Click any cell to edit formula or inspect audit tokens.</span>
            <span>Formula standard: <code>=FINMESH.METRIC(metric, period, [scenario])</code></span>
          </div>
        </div>

        {/* Right Column: Office.js Taskpane Sidebar Emulator (4 cols) */}
        <div className="lg:col-span-4 bg-[#0B0F19] border border-neutral-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Taskpane Nav */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">
                Taskpane Inspector
              </span>
              <div className="flex gap-1">
                {(["catalog", "whatif", "audit", "manifest"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActivePaneTab(tab)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      activePaneTab === tab
                        ? "bg-neutral-800 text-white border border-neutral-700"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1: Catalog */}
            {activePaneTab === "catalog" && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">
                  Click any verified metric below to insert formula into selected cell:
                </p>
                <div className="space-y-2">
                  {[
                    { key: "revenue", name: "Total Revenue (ARR)", category: "Revenue", formula: "SUM(credit) - SUM(debit)" },
                    { key: "cogs", name: "Cost of Goods Sold", category: "COGS", formula: "SUM(debit) - SUM(credit)" },
                    { key: "gross_profit", name: "Gross Profit", category: "Profitability", formula: "revenue - cogs" },
                    { key: "opex", name: "Operating Expenses", category: "Opex", formula: "SUM(debit) - SUM(credit)" },
                    { key: "net_income", name: "Net Income", category: "Profitability", formula: "gross_profit - opex" },
                  ].map((m) => (
                    <div
                      key={m.key}
                      onClick={() => handleInsertMetric(m.key)}
                      className="p-2.5 rounded bg-[#111827] border border-neutral-800 hover:border-blue-700/80 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-mono">
                          {m.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-1">
                        =FINMESH.METRIC(&quot;{m.key}&quot;, ...)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: What-If Driver Write-Back */}
            {activePaneTab === "whatif" && (
              <div className="space-y-4">
                <p className="text-xs text-neutral-400">
                  Tweak operational assumptions in Excel and sync back to FinMesh Causal Canvas:
                </p>

                <div className="space-y-3 bg-[#111827] p-3 rounded border border-neutral-800 text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Price Lift (%)</span>
                      <span className="font-mono text-emerald-400">+{(priceLift * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="-0.2"
                      max="0.4"
                      step="0.05"
                      value={priceLift}
                      onChange={(e) => setPriceLift(parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Hiring Delay (Months)</span>
                      <span className="font-mono text-amber-400">{hiringDelay} Mo</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="1"
                      value={hiringDelay}
                      onChange={(e) => setHiringDelay(parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-300 mb-1">
                      <span>Churn Reduction (%)</span>
                      <span className="font-mono text-blue-400">-{(churnImprovement * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.05"
                      step="0.01"
                      value={churnImprovement}
                      onChange={(e) => setChurnImprovement(parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCommitSandbox}
                  disabled={isSyncing}
                  className="w-full py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  {isSyncing ? "Syncing with DuckDB..." : "Commit Scenario to Canvas"}
                </button>

                {syncStatus && (
                  <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] leading-relaxed">
                    {syncStatus}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Audit Inspector */}
            {activePaneTab === "audit" && (
              <div className="space-y-3">
                <div className="text-xs text-neutral-400">
                  Active Formula Lineage ({String.fromCharCode(65 + selectedCell.c)}{selectedCell.r + 1}):
                </div>

                <div className="bg-[#111827] p-3 rounded border border-neutral-800 space-y-2.5 font-mono text-xs">
                  <div>
                    <span className="text-neutral-500">Raw Formula:</span>
                    <p className="text-white break-all">{currentCellData.raw}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Calculated Value:</span>
                    <p className="text-emerald-400 font-bold">${typeof currentCellData.evaluated === "number" ? currentCellData.evaluated.toLocaleString() : currentCellData.evaluated}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Audit Token Hash:</span>
                    <p className="text-blue-400 font-bold">#{drilldownData?.sqlHash || currentCellData.sqlHash || "a7f8e32c"}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">DuckDB Execution Plan:</span>
                    <p className="text-neutral-400 text-[10px] bg-[#070A10] p-2 rounded border border-neutral-900 overflow-x-auto whitespace-pre-wrap max-h-24">
                      {drilldownData?.cteSql || "SELECT SUM(credit_amount) - SUM(debit_amount) FROM fact_general_ledger WHERE scenario = 'actual'"}
                    </p>
                  </div>

                  {drilldownData?.isLoading && (
                    <div className="text-[11px] text-blue-400 py-1">Querying DuckDB drilldown vouchers...</div>
                  )}

                  {drilldownData?.vouchers && drilldownData.vouchers.length > 0 && (
                    <div>
                      <span className="text-neutral-500 block mb-1">Backing Ledger Entries ({drilldownData.vouchers.length}):</span>
                      <div className="max-h-36 overflow-y-auto rounded border border-neutral-800 text-[10px]">
                        <table className="w-full text-left">
                          <thead className="bg-[#0B0F19] text-neutral-400 sticky top-0">
                            <tr>
                              <th className="p-1">Voucher</th>
                              <th className="p-1">Account</th>
                              <th className="p-1 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drilldownData.vouchers.map((v, idx) => (
                              <tr key={idx} className="border-t border-neutral-850 hover:bg-neutral-800/40">
                                <td className="p-1 text-neutral-300">{v.voucher_id}</td>
                                <td className="p-1 text-neutral-400">{v.account_name}</td>
                                <td className="p-1 text-right font-mono text-emerald-400">
                                  ${(v.credit_amount > 0 ? v.credit_amount : v.debit_amount).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Manifest */}
            {activePaneTab === "manifest" && (
              <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                <p className="text-neutral-400">
                  To sideload this Add-in into your native Microsoft Excel 365:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-neutral-300">
                  <li>Download the XML manifest: <a href="/excel/manifest.xml" target="_blank" className="text-blue-400 underline">manifest.xml</a></li>
                  <li>In Excel (Desktop), go to <strong>Insert</strong> &gt; <strong>My Add-ins</strong></li>
                  <li>Click <strong>Upload My Add-in</strong> and select <code>manifest.xml</code></li>
                </ol>
                <div className="p-2.5 rounded bg-[#111827] border border-neutral-800 text-[11px] font-mono text-neutral-400">
                  XML Endpoint: /excel/manifest.xml
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800/80 text-[11px] text-neutral-500 flex justify-between">
            <span>Office.js v1.1 Standard</span>
            <span className="text-emerald-400">● Engine Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
