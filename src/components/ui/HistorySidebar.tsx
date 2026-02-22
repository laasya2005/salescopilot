"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { HistoryEntry } from "@/lib/types";
import { companySlug } from "@/lib/slug";

/* ── Helpers ── */

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

function timeGroup(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;
  if (ts >= todayStart) return "Today";
  if (ts >= yesterdayStart) return "Yesterday";
  return "Earlier";
}

const modeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  transcript: {
    label: "Call",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  "email-thread": {
    label: "Email",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  "event-form": {
    label: "Event",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  batch: {
    label: "Batch",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
};

function ScoreBar({ value }: { value: number }) {
  const color =
    value >= 70 ? "bg-emerald-400" : value >= 40 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-300 tabular-nums w-6 text-right">{value}</span>
    </div>
  );
}

function RiskPill({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const styles = {
    Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    High: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${styles[risk]}`}>
      {risk} Risk
    </span>
  );
}

export function HistorySidebar({
  entries,
  open,
  onToggle,
  onSelect,
  onRemove,
  activeEntryId,
}: {
  entries: HistoryEntry[];
  open: boolean;
  onToggle: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  activeEntryId: string | null;
}) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? entries.filter((e) =>
        e.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (e.result?.nextSteps || []).some((s) => s.toLowerCase().includes(search.toLowerCase()))
      )
    : entries;

  // Group by time
  const groups: { label: string; items: HistoryEntry[] }[] = [];
  const buckets: Record<string, HistoryEntry[]> = {};
  for (const entry of filtered) {
    const g = timeGroup(entry.timestamp);
    if (!buckets[g]) buckets[g] = [];
    buckets[g].push(entry);
  }
  for (const label of ["Today", "Yesterday", "Earlier"]) {
    if (buckets[label]?.length) groups.push({ label, items: buckets[label] });
  }

  return (
    <>
      {/* Toggle Button — left edge */}
      <button
        onClick={onToggle}
        aria-label={open ? "Close session history" : "Open session history"}
        className={`fixed top-20 left-0 z-30 flex items-center gap-1.5 pl-2.5 pr-3 py-2.5 rounded-r-xl border border-l-0 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          open
            ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300"
            : "bg-slate-900/90 backdrop-blur border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/90"
        }`}
      >
        {/* Sidebar icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">History</span>
        {entries.length > 0 && (
          <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
            {entries.length}
          </span>
        )}
      </button>

      {/* Sidebar Panel — left side */}
      <div
        role="complementary"
        aria-label="Session history"
        className={`fixed top-0 left-0 h-full z-20 bg-slate-950/95 backdrop-blur-md border-r border-slate-800 shadow-2xl shadow-black/60 transition-transform duration-300 ease-in-out w-[88vw] sm:w-[360px] flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white leading-tight">Session History</h2>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {entries.length} {entries.length === 1 ? "analysis" : "analyses"}
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              aria-label="Close sidebar"
              className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          {entries.length > 0 && (
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Entry List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {/* Empty state */}
          {entries.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">No history yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mx-auto">
                Analyze a transcript, email, or event conversation and it will appear here for quick access.
              </p>
            </div>
          )}

          {/* No search results */}
          {entries.length > 0 && filtered.length === 0 && (
            <div className="text-center py-12 px-4">
              <svg className="w-8 h-8 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-xs text-slate-500">No results for &ldquo;{search}&rdquo;</p>
            </div>
          )}

          {/* Grouped entries */}
          {groups.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2 px-1">
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{group.label}</h3>
                <div className="flex-1 h-px bg-slate-800/60" />
                <span className="text-[10px] text-slate-600">{group.items.length}</span>
              </div>

              <div className="space-y-2">
                {group.items.map((entry) => {
                  const m = modeConfig[entry.mode] || modeConfig.transcript;
                  const isActive = activeEntryId === entry.id;
                  const nextStep = entry.result?.nextSteps?.[0];

                  return (
                    <div
                      key={entry.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${entry.companyName} — ${m.label}, score ${entry.leadScore}`}
                      onClick={() => onSelect(entry)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(entry);
                        }
                      }}
                      className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 ${
                        isActive
                          ? "bg-indigo-500/10 border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                          : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(entry.id);
                        }}
                        aria-label={`Remove ${entry.companyName}`}
                        className="absolute top-2.5 right-2.5 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:opacity-100"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Top row: mode icon + company + time */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-md ${m.bg} ${m.color} flex items-center justify-center shrink-0`}>
                          {m.icon}
                        </div>
                        <span className="text-sm font-medium text-white truncate flex-1">
                          {entry.companyName}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {relativeTime(entry.timestamp)}
                        </span>
                      </div>

                      {/* Score bar + pills */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <ScoreBar value={entry.leadScore} />
                        <RiskPill risk={entry.dealRisk} />
                      </div>

                      {/* Worth chasing + mode label */}
                      <div className="flex items-center gap-2 text-[11px]">
                        {entry.worthChasing ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Worth pursuing
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Pass
                          </span>
                        )}
                        <span className="text-slate-700">|</span>
                        <span className={`${m.color} text-[10px] font-medium`}>{m.label}</span>
                        {entry.dealStage && (
                          <>
                            <span className="text-slate-700">|</span>
                            <span className="text-slate-500 truncate">{entry.dealStage}</span>
                          </>
                        )}
                      </div>

                      {/* Financial indicators */}
                      {entry.result?.financialAnalysis && (() => {
                        const fa = entry.result.financialAnalysis!;
                        const pv = fa.dealEconomics.weightedPipelineValue;
                        const bh = fa.budgetHealth.status;
                        if (pv == null && !bh) return null;
                        const budgetColor =
                          bh === "Confirmed" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                          bh === "Exploring" ? "bg-blue-500/15 text-blue-400 border-blue-500/20" :
                          bh === "Constrained" ? "bg-amber-500/15 text-amber-400 border-amber-500/20" :
                          "bg-rose-500/15 text-rose-400 border-rose-500/20";
                        return (
                          <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                            {pv != null && (
                              <span className="text-teal-400 font-semibold">
                                {pv >= 1_000_000 ? `$${(pv / 1_000_000).toFixed(1)}M` : pv >= 1_000 ? `$${(pv / 1_000).toFixed(0)}K` : `$${pv}`}
                              </span>
                            )}
                            {bh && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${budgetColor}`}>
                                {bh}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Next step preview */}
                      {nextStep && (
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-2 border-t border-slate-800/50 pt-2">
                          <span className="text-slate-400 font-medium">Next:</span> {nextStep}
                        </p>
                      )}

                      {/* Deal Room link — always visible */}
                      <Link
                        href={`/deal/${companySlug(entry.companyName)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 mt-2.5 w-full py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-medium hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Deal Room
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="shrink-0 px-4 py-3 border-t border-slate-800/60">
            <p className="text-[10px] text-slate-600 text-center">
              Click any entry to restore it. Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">Esc</kbd> to close.
            </p>
          </div>
        )}
      </div>

      {/* Overlay when open */}
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/30 backdrop-blur-[2px]"
          onClick={onToggle}
        />
      )}
    </>
  );
}
