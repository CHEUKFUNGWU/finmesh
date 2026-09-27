"use client";

import React, { useState } from "react";

export function DriverCanvas() {
  const [priceLift, setPriceLift] = useState<number>(0);
  const [churnDelta, setChurnDelta] = useState<number>(0);
  const [marketingBudgetDelta, setMarketingBudgetDelta] = useState<number>(0);

  const baseRevenue = 180000;
  const baseCOGS = 36000;
  const baseOpex = 64000;

  // Real-time cascaded sensitivity
  const simulatedRevenue = Math.round(baseRevenue * (1 + priceLift / 100) * (1 - churnDelta / 100));
  const simulatedCOGS = Math.round(baseCOGS * (1 + (marketingBudgetDelta * 0.2) / 100));
  const simulatedOpex = Math.round(baseOpex * (1 + marketingBudgetDelta / 100));
  const simulatedGrossProfit = simulatedRevenue - simulatedCOGS;
  const simulatedNetIncome = simulatedGrossProfit - simulatedOpex;

  const revenueDelta = simulatedRevenue - baseRevenue;
  const netIncomeDelta = simulatedNetIncome - (baseRevenue - baseCOGS - baseOpex);

  return (
    <div className="bg-[#111827] border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-semibold text-white">What-If Causal Driver Sandbox</h2>
          <p className="text-xs text-neutral-400 mt-1">Instant DAG recomputation with interactive parameter sliders</p>
        </div>
        <div>
          <button
            onClick={() => {
              setPriceLift(0);
              setChurnDelta(0);
              setMarketingBudgetDelta(0);
            }}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
          >
            Reset Sliders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Slider 1 */}
        <div className="p-4 bg-[#161F30] rounded-lg border border-neutral-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-neutral-300 font-medium">Pricing Adjustment</span>
            <span className={`font-semibold ${priceLift > 0 ? "text-emerald-400" : priceLift < 0 ? "text-rose-400" : "text-neutral-400"}`}>
              {priceLift > 0 ? "+" : ""}{priceLift}%
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={priceLift}
            onChange={(e) => setPriceLift(Number(e.target.value))}
            className="w-full accent-neutral-300 cursor-pointer"
          />
          <span className="text-xs text-neutral-400 block mt-1">Directly impacts Net ARPU</span>
        </div>

        {/* Slider 2 */}
        <div className="p-4 bg-[#161F30] rounded-lg border border-neutral-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-neutral-300 font-medium">Churn Rate Delta</span>
            <span className={`font-semibold ${churnDelta < 0 ? "text-emerald-400" : churnDelta > 0 ? "text-rose-400" : "text-neutral-400"}`}>
              {churnDelta > 0 ? "+" : ""}{churnDelta}%
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={churnDelta}
            onChange={(e) => setChurnDelta(Number(e.target.value))}
            className="w-full accent-neutral-300 cursor-pointer"
          />
          <span className="text-xs text-neutral-400 block mt-1">Customer attrition multiplier</span>
        </div>

        {/* Slider 3 */}
        <div className="p-4 bg-[#161F30] rounded-lg border border-neutral-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-neutral-300 font-medium">Marketing / GTM Spend</span>
            <span className={`font-semibold ${marketingBudgetDelta > 0 ? "text-rose-400" : marketingBudgetDelta < 0 ? "text-emerald-400" : "text-neutral-400"}`}>
              {marketingBudgetDelta > 0 ? "+" : ""}{marketingBudgetDelta}%
            </span>
          </div>
          <input
            type="range"
            min="-40"
            max="40"
            step="5"
            value={marketingBudgetDelta}
            onChange={(e) => setMarketingBudgetDelta(Number(e.target.value))}
            className="w-full accent-neutral-300 cursor-pointer"
          />
          <span className="text-xs text-neutral-400 block mt-1">Scale CAC & Sales capacity</span>
        </div>
      </div>

      {/* Simulated Outcomes */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0B0F19] rounded-lg border border-neutral-800">
          <div className="text-neutral-400 text-xs">Simulated Revenue</div>
          <div className="text-xl font-semibold text-white mt-1">
            ${simulatedRevenue.toLocaleString()}
          </div>
          <div className={`text-xs mt-1 ${revenueDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {revenueDelta >= 0 ? "+" : ""}${revenueDelta.toLocaleString()}
          </div>
        </div>

        <div className="p-4 bg-[#0B0F19] rounded-lg border border-neutral-800">
          <div className="text-neutral-400 text-xs">Simulated Gross Profit</div>
          <div className="text-xl font-semibold text-white mt-1">
            ${simulatedGrossProfit.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            Margin: {((simulatedGrossProfit / simulatedRevenue) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="p-4 bg-[#0B0F19] rounded-lg border border-neutral-800">
          <div className="text-neutral-400 text-xs">Simulated Opex</div>
          <div className="text-xl font-semibold text-white mt-1">
            ${simulatedOpex.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            R&D + G&A + Sales
          </div>
        </div>

        <div className="p-4 bg-[#0B0F19] rounded-lg border border-neutral-800">
          <div className="text-neutral-400 text-xs">Simulated Net Income</div>
          <div className="text-xl font-semibold text-white mt-1">
            ${simulatedNetIncome.toLocaleString()}
          </div>
          <div className={`text-xs mt-1 ${netIncomeDelta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            Net shift: {netIncomeDelta >= 0 ? "+" : ""}${netIncomeDelta.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
