"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Presentation,
  Sliders,
} from "lucide-react";
import { FINANCIAL_BASELINE_2026_Q1 } from "@/lib/financialBaseline";

export interface CommandAction {
  id: string;
  title: string;
  category: "Navigation" | "Financial Metric" | "Quick Action";
  action: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface CommandMenuProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectMetric?: (metricId: string) => void;
  onOpenPresentation?: () => void;
  onExportPPT?: () => void;
  onSwitchView?: (view: "report" | "pvm" | "canvas" | "sandbox" | "excel") => void;
}

export function CommandMenu({
  isOpen,
  onOpenChange,
  onSelectMetric,
  onOpenPresentation,
  onExportPPT,
  onSwitchView,
}: CommandMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === "function" ? val(open) : val;
    if (onOpenChange) onOpenChange(nextVal);
    setInternalOpen(nextVal);
  };

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const allActions = useMemo(() => {
    const actions: CommandAction[] = [
      // 1. Navigation Actions
      {
        id: "nav-pvm",
        title: "PVM Variance Waterfall & Sensitivity Sandbox",
        category: "Navigation",
        icon: Sliders,
        action: () => {
          onSwitchView?.("pvm");
          setOpen(false);
        },
      },
      {
        id: "nav-report",
        title: "P&L Financial Grid (Actual vs Budget Multi-Dimensional)",
        category: "Navigation",
        icon: Layers,
        action: () => {
          onSwitchView?.("report");
          setOpen(false);
        },
      },
      {
        id: "nav-canvas",
        title: "Causal Driver DAG Canvas (React Flow Topological)",
        category: "Navigation",
        icon: Sparkles,
        action: () => {
          onSwitchView?.("canvas");
          setOpen(false);
        },
      },
      {
        id: "nav-sandbox",
        title: "What-If Sensitivity Sandbox (Driver Sliders)",
        category: "Navigation",
        icon: Sliders,
        action: () => {
          onSwitchView?.("sandbox");
          setOpen(false);
        },
      },
      {
        id: "nav-excel",
        title: "Excel Two-Way Sync Taskpane Simulator",
        category: "Navigation",
        icon: FileSpreadsheet,
        action: () => {
          onSwitchView?.("excel");
          setOpen(false);
        },
      },

      // 2. Quick Actions
      {
        id: "act-presentation",
        title: "Open Fullscreen Board Presentation Deck",
        category: "Quick Action",
        icon: Presentation,
        badge: "Slide Deck",
        action: () => {
          onOpenPresentation?.();
          setOpen(false);
        },
      },
      {
        id: "act-export-pptx",
        title: "Export Native PowerPoint Presentation (.pptx)",
        category: "Quick Action",
        icon: Presentation,
        badge: "PptxGenJS",
        action: () => {
          onExportPPT?.();
          setOpen(false);
        },
      },
      {
        id: "act-audit-check",
        title: "Verify DuckDB Trial Balance Defenses (|Δ| = 0.00)",
        category: "Quick Action",
        icon: ShieldCheck,
        badge: "Deterministic",
        action: () => {
          onSelectMetric?.("revenue");
          setOpen(false);
        },
      },

      // 3. Metric Lineage Inspections (Single Source of Truth)
      {
        id: "metric-revenue",
        title: `Inspect ${FINANCIAL_BASELINE_2026_Q1.revenue.displayName}`,
        category: "Financial Metric",
        badge: `$${(FINANCIAL_BASELINE_2026_Q1.revenue.actual / 1000).toFixed(0)}k`,
        action: () => {
          onSelectMetric?.("revenue");
          setOpen(false);
        },
      },
      {
        id: "metric-cogs",
        title: `Inspect ${FINANCIAL_BASELINE_2026_Q1.cogs.displayName}`,
        category: "Financial Metric",
        badge: `$${(FINANCIAL_BASELINE_2026_Q1.cogs.actual / 1000).toFixed(0)}k`,
        action: () => {
          onSelectMetric?.("cogs");
          setOpen(false);
        },
      },
      {
        id: "metric-gp",
        title: `Inspect ${FINANCIAL_BASELINE_2026_Q1.gross_profit.displayName}`,
        category: "Financial Metric",
        badge: `$${(FINANCIAL_BASELINE_2026_Q1.gross_profit.actual / 1000).toFixed(0)}k`,
        action: () => {
          onSelectMetric?.("gross_profit");
          setOpen(false);
        },
      },
      {
        id: "metric-opex",
        title: `Inspect ${FINANCIAL_BASELINE_2026_Q1.opex.displayName}`,
        category: "Financial Metric",
        badge: `$${(FINANCIAL_BASELINE_2026_Q1.opex.actual / 1000).toFixed(0)}k`,
        action: () => {
          onSelectMetric?.("opex");
          setOpen(false);
        },
      },
      {
        id: "metric-ni",
        title: `Inspect ${FINANCIAL_BASELINE_2026_Q1.net_income.displayName}`,
        category: "Financial Metric",
        badge: `$${(FINANCIAL_BASELINE_2026_Q1.net_income.actual / 1000).toFixed(0)}k`,
        action: () => {
          onSelectMetric?.("net_income");
          setOpen(false);
        },
      },
    ];
    return actions;
  }, [onSelectMetric, onOpenPresentation, onExportPPT, onSwitchView]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return allActions;
    const lower = query.toLowerCase();
    return allActions.filter(
      (a) => a.title.toLowerCase().includes(lower) || a.category.toLowerCase().includes(lower)
    );
  }, [allActions, query]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Full Keyboard Navigation Listener (Cmd+K, Escape, ArrowUp, ArrowDown, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredActions.length > 0 ? (prev + 1) % filteredActions.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredActions.length > 0
            ? (prev - 1 + filteredActions.length) % filteredActions.length
            : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredActions, selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Modal Dialog - Pure Monochrome */}
      <div className="relative w-full max-w-xl rounded-lg border border-neutral-800 bg-[#0F141C] text-neutral-200 shadow-2xl overflow-hidden font-sans z-10 animate-in fade-in-0 zoom-in-95 duration-100">
        <div className="flex items-center border-b border-neutral-800 px-3.5 py-3">
          <Search className="h-4 w-4 text-neutral-500 mr-2.5 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, metric, or quick action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-500">
              No matching actions found.
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon || ArrowRight;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors group cursor-pointer ${
                    isSelected
                      ? "bg-neutral-800 text-white ring-1 ring-neutral-700"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className="h-4 w-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 tabular-nums">
                        {item.badge}
                      </span>
                    )}
                    <CornerDownLeft
                      className={`h-3 w-3 text-neutral-400 transition-opacity ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800/80 px-3.5 py-2 text-[11px] text-neutral-500 bg-[#070A10]">
          <div className="flex items-center space-x-3">
            <span>Navigation &amp; Drill-down</span>
            <span>•</span>
            <span>Zero Mental Math</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span>Use</span>
            <kbd className="px-1 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono">↑</kbd>
            <kbd className="px-1 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono">↓</kbd>
            <span>and</span>
            <kbd className="px-1 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono">↵</kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
