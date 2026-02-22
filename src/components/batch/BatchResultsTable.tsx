"use client";

import { useState } from "react";
import type { BatchItem } from "@/lib/types";
import { AnalysisResults } from "@/components/results/AnalysisResults";
import { ScoreDot } from "@/components/ui/ScoreDot";

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

  // Total pipeline value across batch
  const totalPipelineValue = completed.reduce((sum, item) => {
    const pv = item.result?.financialAnalysis?.dealEconomics?.weightedPipelineValue;
    return sum + (pv ?? 0);
  }, 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-white">{completed.length}</p>
          <p className="text-xs text-slate-400">Analyzed</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-white">{avgLeadScore}</p>
          <p className="text-xs text-slate-400">Avg Lead Score</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-rose-400">{highRiskCount}</p>
          <p className="text-xs text-slate-400">High Risk</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{worthChasingCount}</p>
          <p className="text-xs text-slate-400">Worth Chasing</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-teal-400">
            {totalPipelineValue >= 1_000_000
              ? `$${(totalPipelineValue / 1_000_000).toFixed(1)}M`
              : totalPipelineValue >= 1_000
                ? `$${(totalPipelineValue / 1_000).toFixed(0)}K`
                : totalPipelineValue > 0
                  ? `$${totalPipelineValue.toLocaleString()}`
                  : "N/A"}
          </p>
          <p className="text-xs text-slate-400">Pipeline Value</p>
        </div>
      </div>

      {/* Results Table — Desktop */}
      <div className="hidden md:block bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
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
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={`${item.companyName} — Lead Score ${r.leadScore}, ${r.dealRisk} risk`}
                onClick={() => toggleExpand(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(item.id);
                  }
                }}
              >
                <span className="text-sm text-white font-medium truncate">
                  {item.companyName}
                </span>
                <span className="text-sm text-white font-mono w-12 text-center">
                  <ScoreDot value={r.leadScore} className="mr-2" />
                  {r.leadScore}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border w-20 text-center ${
                    r.dealRisk === "Low"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : r.dealRisk === "Medium"
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {r.dealRisk}
                </span>
                <span className="text-sm text-white font-mono w-12 text-center">
                  <ScoreDot value={r.closeForecast} className="mr-2" />
                  {r.closeForecast}%
                </span>
                <span className={`text-sm font-semibold w-16 text-center ${r.worthChasing ? "text-emerald-400" : "text-rose-400"}`}>
                  {r.worthChasing ? "Yes" : "No"}
                </span>
                <button
                  className="text-xs text-slate-400 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded px-2 py-1"
                  tabIndex={-1}
                >
                  {isExpanded ? "Hide" : "View Details"}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 py-6 border-b border-slate-800/50 bg-slate-950/30">
                  <AnalysisResults result={r} transcript={item.transcript} companyName={item.companyName} dealStage={item.dealStage} />
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

      {/* Results Cards — Mobile */}
      <div className="md:hidden space-y-3">
        {completed.map((item) => {
          const r = item.result!;
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden"
            >
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                className="p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleExpand(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(item.id);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white font-medium truncate flex-1">
                    {item.companyName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {isExpanded ? "Hide" : "Details"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Score</p>
                    <p className="text-sm text-white font-mono">
                      <ScoreDot value={r.leadScore} className="mr-2" />
                      {r.leadScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Risk</p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-block ${
                        r.dealRisk === "Low"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : r.dealRisk === "Medium"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {r.dealRisk}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Chase?</p>
                    <p className={`text-sm font-semibold ${r.worthChasing ? "text-emerald-400" : "text-rose-400"}`}>
                      {r.worthChasing ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/50 bg-slate-950/30">
                  <AnalysisResults result={r} transcript={item.transcript} companyName={item.companyName} dealStage={item.dealStage} />
                </div>
              )}
            </div>
          );
        })}

        {/* Error cards — Mobile */}
        {errors.map((item) => (
          <div
            key={item.id}
            className="bg-red-500/5 rounded-xl border border-red-500/20 p-4"
          >
            <p className="text-sm text-white font-medium">{item.companyName || "Unknown"}</p>
            <p className="text-xs text-red-400 mt-1">{item.error || "Analysis failed"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
