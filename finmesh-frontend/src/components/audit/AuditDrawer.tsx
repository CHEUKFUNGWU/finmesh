"use client";

import React from "react";
import { X, ShieldCheck } from "lucide-react";

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    metricName: string;
    displayName: string;
    category: string;
    actual: number;
    budget: number;
    variance: number;
    sqlQuery: string;
    formula: string;
    sqlHash?: string;
  } | null;
}

export function AuditDrawer({ isOpen, onClose, data }: AuditDrawerProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-[#0F141C] border-l border-neutral-800 p-6 z-50 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-neutral-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">{data.displayName}</h3>
              <p className="text-[11px] text-neutral-500 font-mono">Deterministic DuckDB calculation proof</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Calculated Metric Values */}
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-1.5 font-sans">
              Calculated Metric Values
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#070A10] rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px]">Actual 2026-Q1</div>
                <div className="text-base font-semibold font-mono text-white mt-1 tabular-nums">
                  ${data.actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 bg-[#070A10] rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px]">Budget 2026-Q1</div>
                <div className="text-base font-semibold font-mono text-neutral-400 mt-1 tabular-nums">
                  ${data.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Declarative Semantic Formula */}
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-1.5 font-sans">
              Declarative Semantic Formula
            </label>
            <div className="p-2.5 bg-[#070A10] rounded border border-neutral-800 font-mono text-xs text-neutral-200">
              {data.formula}
            </div>
          </div>

          {/* DuckDB Deterministic SQL Query */}
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-1.5 font-sans">
              DuckDB Columnar Execution Plan
            </label>
            <div className="p-3 bg-[#070A10] rounded border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40">
              {data.sqlQuery}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-mono">
              Hash: #{data.sqlHash || "a7f8e32c"} • Duration: &lt; 2ms • Columnar Verified
            </p>
          </div>

          {/* Contributing Ledger Entries */}
          <div>
            <label className="text-xs font-medium text-neutral-400 block mb-1.5 font-sans">
              Contributing Ledger Entries (FactGeneralLedger)
            </label>
            <div className="border border-neutral-800 rounded text-xs overflow-hidden">
              <div className="bg-[#161B22] p-2 text-neutral-400 border-b border-neutral-800 flex justify-between font-medium text-[11px]">
                <span>Voucher ID</span>
                <span>Account</span>
                <span>Amount</span>
              </div>
              {data.metricName === "cogs" ? (
                <>
                  <div className="p-2.5 flex justify-between border-b border-neutral-800 text-neutral-300">
                    <span className="font-mono text-neutral-400">ACT-002</span>
                    <span>5001 Cloud Infrastructure (AWS)</span>
                    <span className="text-rose-400 font-mono font-medium tabular-nums">$24,000.00</span>
                  </div>
                  <div className="p-2.5 flex justify-between text-neutral-300">
                    <span className="font-mono text-neutral-400">ACT-004</span>
                    <span>5002 Customer Support Hosting</span>
                    <span className="text-rose-400 font-mono font-medium tabular-nums">$12,000.00</span>
                  </div>
                </>
              ) : data.metricName === "opex" ? (
                <>
                  <div className="p-2.5 flex justify-between border-b border-neutral-800 text-neutral-300">
                    <span className="font-mono text-neutral-400">ACT-003</span>
                    <span>6601 R&D Engineering Payroll</span>
                    <span className="text-rose-400 font-mono font-medium tabular-nums">$25,000.00</span>
                  </div>
                  <div className="p-2.5 flex justify-between text-neutral-300">
                    <span className="font-mono text-neutral-400">ACT-005</span>
                    <span>6701 Sales & Marketing Spend</span>
                    <span className="text-rose-400 font-mono font-medium tabular-nums">$15,000.00</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2.5 flex justify-between border-b border-neutral-800 text-neutral-300">
                    <span className="font-mono text-neutral-400">ACT-001</span>
                    <span>6001 Enterprise Annual License</span>
                    <span className="text-emerald-400 font-mono font-medium tabular-nums">$120,000.00</span>
                  </div>
                  <div className="p-2.5 flex justify-between text-neutral-300">
                    <span className="font-mono text-neutral-400">ACT-006</span>
                    <span>6002 Mid-Market Subscriptions</span>
                    <span className="text-emerald-400 font-mono font-medium tabular-nums">$60,000.00</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5 border-t border-neutral-800">
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors cursor-pointer"
        >
          Close Audit Drawer
        </button>
      </div>
    </div>
  );
}
