"use client";

import { useState } from "react";
import type { HistoryEntry } from "@/lib/types";

const modeConfig: Record<string, { label: string; color: string; bg: string }> = {
  transcript: { label: "Call", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  "email-thread": { label: "Email", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  "event-form": { label: "Event", color: "text-violet-400", bg: "bg-violet-500/10" },
  batch: { label: "Batch", color: "text-amber-400", bg: "bg-amber-500/10" },
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

function RiskPill({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const styles = {
    Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    High: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${styles[risk] || styles.Medium}`}>
      {risk} Risk
    </span>
  );
}

export function InteractionTimeline({
  interactions,
}: {
  interactions: HistoryEntry[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...interactions].sort((a, b) => b.timestamp - a.timestamp);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
          <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-slate-400 mb-1">No interactions yet</h3>
        <p className="text-xs text-slate-500 max-w-[260px] mx-auto">
          Analyze a transcript, email, or event for this company and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-800" />

      <div className="space-y-4">
        {sorted.map((entry) => {
          const m = modeConfig[entry.mode] || modeConfig.transcript;
          const expanded = expandedId === entry.id;
          const scoreColor =
            entry.leadScore >= 70
              ? "bg-emerald-400"
              : entry.leadScore >= 40
                ? "bg-amber-400"
                : "bg-rose-400";

          return (
            <div key={entry.id} className="relative">
              {/* Dot */}
              <div className={`absolute -left-3.5 top-4 w-3 h-3 rounded-full border-2 border-slate-950 ${m.bg.replace("/10", "/40")} ${m.color.replace("text-", "bg-").replace("-400", "-500")}`} />

              <button
                onClick={() => setExpandedId(expanded ? null : entry.id)}
                className="w-full text-left bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-150"
              >
                {/* Header row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${m.bg} ${m.color}`}>
                    {m.label}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-auto">
                    {relativeTime(entry.timestamp)}
                  </span>
                </div>

                {/* Score bar + risk */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreColor} transition-all duration-500`}
                        style={{ width: `${entry.leadScore}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 tabular-nums w-6 text-right">
                      {entry.leadScore}
                    </span>
                  </div>
                  <RiskPill risk={entry.dealRisk} />
                </div>

                {/* Next steps preview */}
                {!expanded && entry.result?.nextSteps?.slice(0, 2).map((step, i) => (
                  <p key={i} className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">
                    <span className="text-slate-400 font-medium">{i + 1}.</span> {step}
                  </p>
                ))}

                {/* Expand indicator */}
                <div className="flex justify-center mt-2">
                  <svg
                    className={`w-4 h-4 text-slate-600 transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded details */}
              {expanded && (
                <div className="mt-2 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                  {/* Worth chasing */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Worth Pursuing:</span>
                    {entry.worthChasing ? (
                      <span className="text-xs font-medium text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-xs font-medium text-rose-400">No</span>
                    )}
                  </div>

                  {/* All next steps */}
                  {entry.result?.nextSteps?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-400 mb-2">Next Steps</h4>
                      <div className="space-y-1.5">
                        {entry.result.nextSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-xs text-slate-300">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buying signals */}
                  {entry.result?.buyingSignals?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-400 mb-2">Buying Signals</h4>
                      <div className="space-y-1.5">
                        {entry.result.buyingSignals.map((s, i) => (
                          <div key={i} className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                            <p className="text-xs text-white font-medium">{s.signal}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 italic">&ldquo;{s.evidence}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objections */}
                  {entry.result?.objections?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 mb-2">Objections</h4>
                      <div className="space-y-1.5">
                        {entry.result.objections.map((o, i) => (
                          <div key={i} className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                            <p className="text-xs text-white font-medium">{o.objection}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 italic">&ldquo;{o.evidence}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Insights */}
                  {entry.result?.financialAnalysis && (() => {
                    const fa = entry.result.financialAnalysis!;
                    const pv = fa.dealEconomics.weightedPipelineValue;
                    const bh = fa.budgetHealth.status;
                    const rr = fa.revenueRisk.overallScore;
                    const comps = fa.competitivePricing.competitorsDetected;
                    const budgetColor =
                      bh === "Confirmed" ? "text-emerald-400" :
                      bh === "Exploring" ? "text-blue-400" :
                      bh === "Constrained" ? "text-amber-400" :
                      "text-rose-400";
                    const riskColor =
                      rr <= 25 ? "text-emerald-400" :
                      rr <= 50 ? "text-yellow-400" :
                      rr <= 75 ? "text-orange-400" :
                      "text-rose-400";
                    return (
                      <div>
                        <h4 className="text-xs font-semibold text-teal-400 mb-2">Financial Insights</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800 text-center">
                            <p className="text-[10px] text-slate-500">Pipeline</p>
                            <p className="text-sm font-bold text-white">
                              {pv != null ? (pv >= 1_000_000 ? `$${(pv / 1_000_000).toFixed(1)}M` : pv >= 1_000 ? `$${(pv / 1_000).toFixed(0)}K` : `$${pv}`) : "N/A"}
                            </p>
                          </div>
                          <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800 text-center">
                            <p className="text-[10px] text-slate-500">Budget</p>
                            <p className={`text-sm font-bold ${budgetColor}`}>{bh}</p>
                          </div>
                          <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800 text-center">
                            <p className="text-[10px] text-slate-500">Revenue Risk</p>
                            <p className={`text-sm font-bold ${riskColor}`}>{rr}/100</p>
                          </div>
                          <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800 text-center">
                            <p className="text-[10px] text-slate-500">Competitors</p>
                            <p className="text-sm font-bold text-white">{comps.length > 0 ? comps.map((c) => c.competitor).join(", ") : "None"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Coaching summary */}
                  {entry.result?.coachingSummary && (
                    <div>
                      <h4 className="text-xs font-semibold text-violet-400 mb-2">Coaching Summary</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{entry.result.coachingSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
