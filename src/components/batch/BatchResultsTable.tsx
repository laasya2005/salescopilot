"use client";

import { useState } from "react";
import type { BatchItem } from "@/lib/types";
import { AnalysisResults } from "@/components/results/AnalysisResults";

function ScoreDot({ value, thresholds }: { value: number; thresholds: [number, number] }) {
  const color =
    value >= thresholds[1]
      ? "bg-emerald-400"
      : value >= thresholds[0]
      ? "bg-amber-400"
      : "bg-red-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-2`} />;
}

export function BatchResultsTable({ items }: { items: BatchItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completed = items.filter((i) => i.status === "completed" && i.result);
  const errors = items.filter((i) => i.status === "error");

  if (completed.length === 0 && errors.length === 0) return null;

  // Summary stats
  const avgLeadScore =
    completed.length > 0
      ? Math.round(completed.reduce((s, i) => s + (i.result?.leadScore || 0), 0) / completed.length)
      : 0;
  const highRiskCount = completed.filter((i) => i.result?.dealRisk === "High").length;
  const worthChasingCount = completed.filter((i) => i.result?.worthChasing).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-white">{completed.length}</p>
          <p className="text-xs text-slate-400">Analyzed</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-white">{avgLeadScore}</p>
          <p className="text-xs text-slate-400">Avg Lead Score</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{highRiskCount}</p>
          <p className="text-xs text-slate-400">High Risk</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{worthChasingCount}</p>
          <p className="text-xs text-slate-400">Worth Chasing</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <span>Company</span>
          <span>Lead Score</span>
          <span>Deal Risk</span>
          <span>Close %</span>
          <span>Worth Chasing</span>
          <span />
        </div>

        {/* Table Rows */}
        {completed.map((item) => {
          const r = item.result!;
          const isExpanded = expandedId === item.id;

          return (
            <div key={item.id}>
              <div
                className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-4 items-center border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/30 transition-colors ${
                  isExpanded ? "bg-slate-800/20" : ""
                }`}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <span className="text-sm text-white font-medium truncate">
                  {item.companyName}
                </span>
                <span className="text-sm text-white font-mono w-12 text-center">
                  <ScoreDot value={r.leadScore} thresholds={[40, 70]} />
                  {r.leadScore}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border w-20 text-center ${
                    r.dealRisk === "Low"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : r.dealRisk === "Medium"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {r.dealRisk}
                </span>
                <span className="text-sm text-white font-mono w-12 text-center">
                  <ScoreDot value={r.closeForecast} thresholds={[30, 60]} />
                  {r.closeForecast}%
                </span>
                <span className={`text-sm font-semibold w-16 text-center ${r.worthChasing ? "text-emerald-400" : "text-red-400"}`}>
                  {r.worthChasing ? "Yes" : "No"}
                </span>
                <button className="text-xs text-slate-400 hover:text-white transition-colors whitespace-nowrap">
                  {isExpanded ? "Hide" : "View Details"}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 py-6 border-b border-slate-800/50 bg-slate-950/30">
                  <AnalysisResults result={r} />
                </div>
              )}
            </div>
          );
        })}

        {/* Error rows */}
        {errors.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_1fr] gap-4 px-6 py-4 items-center border-b border-slate-800/50 bg-red-500/5"
          >
            <span className="text-sm text-white">{item.companyName || "Unknown"}</span>
            <span className="text-xs text-red-400">{item.error || "Analysis failed"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
