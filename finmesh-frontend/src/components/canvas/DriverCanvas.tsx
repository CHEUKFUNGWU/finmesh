"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
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
    <div className="bg-[#0F141C] border border-neutral-800 rounded-lg p-3 w-56 shadow-sm">
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
    <div className="bg-[#0F141C] border border-neutral-800 rounded-lg p-3 w-60 shadow-sm">
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

interface DriverCanvasProps {
  baseRevenue?: number;
  baseCOGS?: number;
  baseOpex?: number;
}

export function DriverCanvas({
  baseRevenue = 1250000,
  baseCOGS = 525000,
  baseOpex = 410000,
}: DriverCanvasProps = {}) {
  const [priceLift, setPriceLift] = useState<number>(0);
  const [churnDelta, setChurnDelta] = useState<number>(0);
  const [marketingSpend, setMarketingSpend] = useState<number>(0);

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

  const [cycleError, setCycleError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<{
    id: string;
    label: string;
    category: string;
    baseline: number;
    simulated: number;
    delta: number;
    waterfall: { name: string; impact: number; note: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DFS/Reachability cycle prevention: verifies that target cannot already reach source
  const wouldCreateCycle = (source: string, target: string, currentEdges: Edge[]): boolean => {
    if (source === target) return true;
    const adjacency = new Map<string, string[]>();
    for (const e of currentEdges) {
      const list = adjacency.get(e.source) || [];
      list.push(e.target);
      adjacency.set(e.source, list);
    }
    const visited = new Set<string>();
    const queue = [target];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === source) return true;
      if (!visited.has(curr)) {
        visited.add(curr);
        const neighbors = adjacency.get(curr) || [];
        for (const n of neighbors) {
          if (!visited.has(n)) queue.push(n);
        }
      }
    }
    return false;
  };

  const onConnect = useCallback((connection: Connection) => {
    setCycleError(null);
    if (!connection.source || !connection.target) return;

    if (wouldCreateCycle(connection.source, connection.target, edges)) {
      setCycleError(
        `循环引用阻断 (Cycle Blocked): 连接 [${connection.source}] → [${connection.target}] 会导致 DAG 有向无环图出现闭环，系统已自动拦截。`
      );
      return;
    }
    setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  }, [edges]);

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

  const handleImportScenario = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.drivers) {
          if (typeof data.drivers.price_lift_percent === "number") setPriceLift(data.drivers.price_lift_percent);
          if (typeof data.drivers.churn_rate_delta_percent === "number") setChurnDelta(data.drivers.churn_rate_delta_percent);
          if (typeof data.drivers.marketing_spend_delta_percent === "number") setMarketingSpend(data.drivers.marketing_spend_delta_percent);
          setCycleError(null);
        }
      } catch (err) {
        setCycleError("Failed to parse scenario JSON file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setPriceLift(0);
    setChurnDelta(0);
    setMarketingSpend(0);
    setCycleError(null);
    setSelectedMetric(null);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    if (node.type === "metricNode") {
      const data = node.data as {
        label?: string;
        category?: string;
        baseline?: number;
        simulated?: number;
        delta?: number;
      };

      const baseline = data.baseline ?? 0;
      const simulated = data.simulated ?? baseline;
      const delta = data.delta ?? (simulated - baseline);

      // Compute marginal upstream waterfall contributions per REQ-0003 §4.3
      const waterfall: { name: string; impact: number; note: string }[] = [];
      if (node.id === "metric-revenue") {
        const priceImpact = baseRevenue * (priceLift / 100);
        const churnImpact = -baseRevenue * (churnDelta / 100);
        waterfall.push({ name: "Pricing Lift Driver", impact: priceImpact, note: `${priceLift >= 0 ? "+" : ""}${priceLift}% rate adjustment` });
        waterfall.push({ name: "Churn Rate Delta Driver", impact: churnImpact, note: `${churnDelta >= 0 ? "+" : ""}${churnDelta}% client churn` });
      } else if (node.id === "metric-cogs") {
        const mktImpact = baseCOGS * (marketingSpend / 100) * 0.3;
        waterfall.push({ name: "Marketing Cloud Scale Factor", impact: mktImpact, note: `30% infra elastic demand elasticity` });
      } else if (node.id === "metric-opex") {
        const mktImpact = baseOpex * (marketingSpend / 100) * 0.5;
        waterfall.push({ name: "Marketing Discretionary Spend", impact: mktImpact, note: `Direct demand generation budget` });
      } else if (node.id === "metric-gp") {
        waterfall.push({ name: "Revenue Expansion / Contraction", impact: simRevenue - baseRevenue, note: `Topline revenue pass-through` });
        waterfall.push({ name: "Direct Cost Variance", impact: -(simCOGS - baseCOGS), note: `COGS efficiency offset` });
      } else if (node.id === "metric-net") {
        waterfall.push({ name: "Gross Profit Conversion", impact: simGrossProfit - (baseRevenue - baseCOGS), note: `Operating margin contribution` });
        waterfall.push({ name: "Overhead & Opex Variance", impact: -(simOpex - baseOpex), note: `SG&A and R&D impact` });
      }

      setSelectedMetric({
        id: node.id,
        label: data.label || node.id,
        category: data.category || "General",
        baseline,
        simulated,
        delta,
        waterfall,
      });
    }
  };

  return (
    <div className="bg-[#0F141C] border border-neutral-800 rounded-lg p-5 shadow-sm relative">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-white">What-If Causal Driver Sandbox</h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Interactive React Flow DAG with instant cascaded recalculation and cycle prevention
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImportScenario}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs transition-colors"
          >
            Import JSON
          </button>
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs transition-colors"
          >
            Reset Sliders
          </button>
          <button
            onClick={handleExportScenario}
            className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 text-xs font-medium transition-colors"
          >
            Export Scenario JSON
          </button>
        </div>
      </div>

      {cycleError && (
        <div className="mt-3 p-3 bg-neutral-900 border border-rose-900/60 rounded text-rose-300 text-xs flex justify-between items-center">
          <span>{cycleError}</span>
          <button onClick={() => setCycleError(null)} className="text-rose-400 hover:text-white ml-3 font-semibold cursor-pointer">✕</button>
        </div>
      )}

      {/* React Flow Interactive Canvas */}
      <div className="h-[520px] w-full mt-4 rounded border border-neutral-800 bg-[#070A10] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#21262D" gap={16} />
          <Controls className="!bg-[#0F141C] !border-neutral-800 !text-neutral-300" />
        </ReactFlow>
      </div>

      {/* Waterfall Drawer modal for clicked metric node */}
      {selectedMetric && (
        <div className="mt-4 p-4 bg-[#0F141C] border border-neutral-800 rounded-lg">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Waterfall Attribution: {selectedMetric.label}</h3>
              <p className="text-xs text-neutral-400">Baseline vs What-If Simulated Outcome</p>
            </div>
            <button
              onClick={() => setSelectedMetric(null)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            <div className="p-2.5 bg-neutral-900/80 rounded border border-neutral-800">
              <span className="text-neutral-400 block">Baseline Value</span>
              <span className="text-sm font-mono font-semibold text-white mt-1 block tabular-nums">
                ${(selectedMetric.baseline ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-neutral-900/80 rounded border border-neutral-800">
              <span className="text-neutral-400 block">Simulated Value</span>
              <span className="text-sm font-mono font-semibold text-white mt-1 block tabular-nums">
                ${(selectedMetric.simulated ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-neutral-900/80 rounded border border-neutral-800">
              <span className="text-neutral-400 block">Total Impact Delta</span>
              <span className={`text-sm font-mono font-semibold mt-1 block tabular-nums ${
                (selectedMetric.simulated ?? 0) >= (selectedMetric.baseline ?? 0) ? "text-emerald-400" : "text-rose-400"
              }`}>
                {(selectedMetric.simulated ?? 0) >= (selectedMetric.baseline ?? 0) ? "+" : ""}
                ${((selectedMetric.simulated ?? 0) - (selectedMetric.baseline ?? 0)).toLocaleString()} (
                {((((selectedMetric.simulated ?? 0) - (selectedMetric.baseline ?? 0)) / (selectedMetric.baseline || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Upstream Marginal Driver Waterfall Breakdown per REQ-0003 §4.3 */}
          {selectedMetric.waterfall.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Upstream Driver Marginal Attribution / 边际动因拆解
              </div>
              <div className="space-y-1.5">
                {selectedMetric.waterfall.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-neutral-900/60 border border-neutral-800/80 text-xs">
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-neutral-500 text-[11px] ml-2">({item.note})</span>
                    </div>
                    <span className={`font-mono font-semibold ${item.impact >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {item.impact >= 0 ? "+" : ""}${Math.round(item.impact).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
