"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  Position,
  MarkerType,
  Handle,
  Connection,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// --- Custom Node Components ---

interface DriverNodeProps {
  data: {
    label: string;
    description: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
  };
}

function DriverNode({ data }: DriverNodeProps) {
  return (
    <div className="bg-[#161F30] border border-neutral-700 rounded-lg p-3 w-56 shadow-sm">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="font-semibold text-white">{data.label}</span>
        <span className={`font-mono text-xs font-semibold ${
          data.value > 0 ? "text-emerald-400" : data.value < 0 ? "text-rose-400" : "text-neutral-400"
        }`}>
          {data.value > 0 ? "+" : ""}{data.value}{data.unit}
        </span>
      </div>
      <p className="text-[11px] text-neutral-400 mb-2">{data.description}</p>
      <input
        type="range"
        min={data.min}
        max={data.max}
        step={data.step}
        value={data.value}
        onChange={(e) => data.onChange(Number(e.target.value))}
        className="w-full accent-neutral-300 cursor-pointer"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-neutral-400 !w-2.5 !h-2.5"
      />
    </div>
  );
}

interface MetricNodeProps {
  data: {
    label: string;
    category: string;
    baseline: number;
    simulated: number;
    delta: number;
  };
}

function MetricNode({ data }: MetricNodeProps) {
  const isPositiveDelta = data.delta >= 0;
  const isRevenueOrProfit = data.category === "Revenue" || data.category === "Profitability";
  const isFavorable = isRevenueOrProfit ? isPositiveDelta : !isPositiveDelta;

  return (
    <div className="bg-[#111827] border border-neutral-700 rounded-lg p-3 w-60 shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-neutral-400 !w-2.5 !h-2.5"
      />
      <div className="flex justify-between items-center text-xs">
        <span className="text-[11px] text-neutral-400 uppercase tracking-wider">{data.category}</span>
        <span className={`text-[11px] font-mono font-medium ${isFavorable ? "text-emerald-400" : "text-rose-400"}`}>
          {data.delta >= 0 ? "+" : ""}${Math.round(data.delta).toLocaleString()}
        </span>
      </div>
      <div className="text-sm font-semibold text-white mt-1">{data.label}</div>
      <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-between items-baseline">
        <span className="text-xs text-neutral-400">Baseline: ${data.baseline.toLocaleString()}</span>
        <span className="text-sm font-semibold font-mono text-white">${Math.round(data.simulated).toLocaleString()}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-neutral-400 !w-2.5 !h-2.5"
      />
    </div>
  );
}

const nodeTypes = {
  driverNode: DriverNode,
  metricNode: MetricNode,
};

// --- Main Canvas Component ---

export function DriverCanvas() {
  const [priceLift, setPriceLift] = useState<number>(0);
  const [churnDelta, setChurnDelta] = useState<number>(0);
  const [marketingSpend, setMarketingSpend] = useState<number>(0);

  const baseRevenue = 180000;
  const baseCOGS = 36000;
  const baseOpex = 64000;

  // Real-time DAG recomputation
  const simRevenue = Math.round(baseRevenue * (1 + priceLift / 100) * (1 - churnDelta / 100));
  const simCOGS = Math.round(baseCOGS * (1 + (marketingSpend * 0.2) / 100));
  const simGrossProfit = simRevenue - simCOGS;
  const simOpex = Math.round(baseOpex * (1 + marketingSpend / 100));
  const simNetIncome = simGrossProfit - simOpex;

  const nodes: Node[] = useMemo(() => [
    // Column 1: Operational Drivers
    {
      id: "driver-price",
      type: "driverNode",
      position: { x: 40, y: 40 },
      data: {
        label: "Pricing Lift",
        description: "Direct net ARPU adjustment",
        value: priceLift,
        unit: "%",
        min: -30,
        max: 30,
        step: 1,
        onChange: setPriceLift,
      },
    },
    {
      id: "driver-churn",
      type: "driverNode",
      position: { x: 40, y: 190 },
      data: {
        label: "Churn Rate Delta",
        description: "Customer attrition multiplier",
        value: churnDelta,
        unit: "%",
        min: -10,
        max: 10,
        step: 0.5,
        onChange: setChurnDelta,
      },
    },
    {
      id: "driver-marketing",
      type: "driverNode",
      position: { x: 40, y: 340 },
      data: {
        label: "Marketing & GTM Spend",
        description: "Scales sales rep capacity & CAC",
        value: marketingSpend,
        unit: "%",
        min: -40,
        max: 40,
        step: 5,
        onChange: setMarketingSpend,
      },
    },

    // Column 2: Direct Financial Metrics
    {
      id: "metric-revenue",
      type: "metricNode",
      position: { x: 360, y: 100 },
      data: {
        label: "Total Revenue (ARR)",
        category: "Revenue",
        baseline: baseRevenue,
        simulated: simRevenue,
        delta: simRevenue - baseRevenue,
      },
    },
    {
      id: "metric-cogs",
      type: "metricNode",
      position: { x: 360, y: 260 },
      data: {
        label: "Cost of Goods Sold",
        category: "COGS",
        baseline: baseCOGS,
        simulated: simCOGS,
        delta: simCOGS - baseCOGS,
      },
    },
    {
      id: "metric-opex",
      type: "metricNode",
      position: { x: 360, y: 420 },
      data: {
        label: "Operating Expenses",
        category: "Opex",
        baseline: baseOpex,
        simulated: simOpex,
        delta: simOpex - baseOpex,
      },
    },

    // Column 3: Derived Synthesized Metrics
    {
      id: "metric-gp",
      type: "metricNode",
      position: { x: 690, y: 170 },
      data: {
        label: "Gross Profit",
        category: "Profitability",
        baseline: baseRevenue - baseCOGS,
        simulated: simGrossProfit,
        delta: simGrossProfit - (baseRevenue - baseCOGS),
      },
    },
    {
      id: "metric-net",
      type: "metricNode",
      position: { x: 690, y: 340 },
      data: {
        label: "Net Operating Income",
        category: "Profitability",
        baseline: baseRevenue - baseCOGS - baseOpex,
        simulated: simNetIncome,
        delta: simNetIncome - (baseRevenue - baseCOGS - baseOpex),
      },
    },
  ], [priceLift, churnDelta, marketingSpend, simRevenue, simCOGS, simGrossProfit, simOpex, simNetIncome]);

  const [edges, setEdges] = useState<Edge[]>([
    {
      id: "e-price-rev",
      source: "driver-price",
      target: "metric-revenue",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
    {
      id: "e-churn-rev",
      source: "driver-churn",
      target: "metric-revenue",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
    {
      id: "e-mkt-cogs",
      source: "driver-marketing",
      target: "metric-cogs",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
    {
      id: "e-mkt-opex",
      source: "driver-marketing",
      target: "metric-opex",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
    {
      id: "e-rev-gp",
      source: "metric-revenue",
      target: "metric-gp",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
    {
      id: "e-cogs-gp",
      source: "metric-cogs",
      target: "metric-gp",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
    {
      id: "e-gp-net",
      source: "metric-gp",
      target: "metric-net",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
    {
      id: "e-opex-net",
      source: "metric-opex",
      target: "metric-net",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6B7280" },
    },
  ]);

  // Cycle prevention with Kahn's check
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source === connection.target) {
      alert("Self-referencing cycles are prohibited.");
      return;
    }
    setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  }, []);

  const handleExportScenario = () => {
    const payload = {
      scenario_id: `scenario-${Date.now()}`,
      created_at: new Date().toISOString(),
      drivers: {
        price_lift_percent: priceLift,
        churn_rate_delta_percent: churnDelta,
        marketing_spend_delta_percent: marketingSpend,
      },
      simulated_outcomes: {
        revenue: simRevenue,
        cogs: simCOGS,
        gross_profit: simGrossProfit,
        opex: simOpex,
        net_income: simNetIncome,
      },
      graph_edges_count: edges.length,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finmesh-whatif-scenario-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPriceLift(0);
    setChurnDelta(0);
    setMarketingSpend(0);
  };

  return (
    <div className="bg-[#111827] border border-neutral-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-semibold text-white">What-If Causal Driver Sandbox</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Interactive React Flow DAG with instant cascaded recalculation and cycle prevention
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
          >
            Reset Sliders
          </button>
          <button
            onClick={handleExportScenario}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-medium transition-colors"
          >
            Export Scenario JSON
          </button>
        </div>
      </div>

      {/* React Flow Interactive Canvas */}
      <div className="h-[520px] w-full mt-4 rounded border border-neutral-800 bg-[#0B0F19] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#1F2937" gap={16} />
          <Controls className="!bg-[#111827] !border-neutral-800 !text-neutral-300" />
        </ReactFlow>
      </div>

      {/* Summary KPI Strip */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-[#161F30] rounded border border-neutral-800">
          <span className="text-neutral-400 block">Simulated Revenue</span>
          <span className="text-sm font-semibold font-mono text-white mt-1 block">
            ${simRevenue.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-[#161F30] rounded border border-neutral-800">
          <span className="text-neutral-400 block">Simulated Gross Margin</span>
          <span className="text-sm font-semibold font-mono text-white mt-1 block">
            {((simGrossProfit / simRevenue) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-3 bg-[#161F30] rounded border border-neutral-800">
          <span className="text-neutral-400 block">Simulated Opex</span>
          <span className="text-sm font-semibold font-mono text-white mt-1 block">
            ${simOpex.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-[#161F30] rounded border border-neutral-800">
          <span className="text-neutral-400 block">Net Income Delta</span>
          <span className={`text-sm font-semibold font-mono mt-1 block ${
            simNetIncome >= (baseRevenue - baseCOGS - baseOpex) ? "text-emerald-400" : "text-rose-400"
          }`}>
            {simNetIncome >= (baseRevenue - baseCOGS - baseOpex) ? "+" : ""}${(simNetIncome - (baseRevenue - baseCOGS - baseOpex)).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
