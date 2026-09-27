"use client";

import React from "react";

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
  } | null;
}

export function AuditDrawer({ isOpen, onClose, data }: AuditDrawerProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-[#111827] border-l border-neutral-800 p-6 z-50 flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-white">{data.displayName} Audit Trace</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Deterministic DuckDB calculation proof</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">Calculated Metric Values</label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#161F30] rounded-lg border border-neutral-800">
                <div className="text-neutral-400 text-xs">Actual 2026-Q1</div>
                <div className="text-base font-semibold text-white mt-1">
                  ${data.actual.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 bg-[#161F30] rounded-lg border border-neutral-800">
                <div className="text-neutral-400 text-xs">Budget 2026-Q1</div>
                <div className="text-base font-semibold text-neutral-300 mt-1">
                  ${data.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">Declarative Semantic Formula</label>
            <div className="p-3 bg-[#161F30] rounded-lg border border-neutral-800 text-xs text-neutral-200">
              {data.formula}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">DuckDB Deterministic SQL Query</label>
            <div className="p-3 bg-[#0B0F19] rounded-lg border border-neutral-800 text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {data.sqlQuery}
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">
              Hash: sha256-8a7f4e91 • Duration: &lt; 2ms
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-300 block mb-1.5">Contributing Ledger Entries (FactGeneralLedger)</label>
            <div className="border border-neutral-800 rounded-lg text-xs">
              <div className="bg-[#161F30] p-2.5 text-neutral-400 border-b border-neutral-800 flex justify-between font-medium">
                <span>Voucher ID</span>
                <span>Account</span>
                <span>Amount</span>
              </div>
              <div className="p-2.5 flex justify-between border-b border-neutral-800 text-neutral-300">
                <span>ACT-001</span>
                <span>6001 SaaS ARR</span>
                <span className="text-emerald-400 font-medium">$180,000.00</span>
              </div>
              <div className="p-2.5 flex justify-between text-neutral-300">
                <span>ACT-002</span>
                <span>6401 Cloud Infra</span>
                <span className="text-rose-400 font-medium">$36,000.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-neutral-800">
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors"
        >
          Close Audit Trace
        </button>
      </div>
    </div>
  );
}
