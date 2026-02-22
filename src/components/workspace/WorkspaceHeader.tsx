"use client";

import type { HistoryEntry, WorkspaceTask } from "@/lib/types";

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

export function WorkspaceHeader({
  companyName,
  interactions,
  tasks,
}: {
  companyName: string;
  interactions: HistoryEntry[];
  tasks: WorkspaceTask[];
}) {
  const avgScore =
    interactions.length > 0
      ? Math.round(
          interactions.reduce((sum, e) => sum + e.leadScore, 0) /
            interactions.length
        )
      : 0;

  const latestRisk =
    interactions.length > 0 ? interactions[0].dealRisk : null;

  const openTasks = tasks.filter((t) => t.status === "pending").length;

  const lastActivity =
    interactions.length > 0
      ? relativeTime(
          Math.max(...interactions.map((e) => e.timestamp))
        )
      : "No activity";

  const riskColors: Record<string, string> = {
    Low: "text-emerald-400 bg-emerald-500/10",
    Medium: "text-amber-400 bg-amber-500/10",
    High: "text-rose-400 bg-rose-500/10",
  };

  const scoreColor =
    avgScore >= 70
      ? "text-emerald-400"
      : avgScore >= 40
        ? "text-amber-400"
        : "text-rose-400";

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">{companyName}</h1>
      <p className="text-sm text-slate-400 mb-5">Deal Room</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* Interactions */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
            Interactions
          </p>
          <p className="text-xl font-bold text-white">{interactions.length}</p>
        </div>

        {/* Avg Score */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
            Avg Score
          </p>
          <p className={`text-xl font-bold ${scoreColor}`}>
            {interactions.length > 0 ? avgScore : "—"}
          </p>
        </div>

        {/* Risk */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
            Risk
          </p>
          {latestRisk ? (
            <span
              className={`inline-block text-sm font-semibold px-2 py-0.5 rounded-md ${riskColors[latestRisk]}`}
            >
              {latestRisk}
            </span>
          ) : (
            <p className="text-xl font-bold text-slate-600">—</p>
          )}
        </div>

        {/* Open Tasks */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
            Open Tasks
          </p>
          <p className="text-xl font-bold text-white">{openTasks}</p>
        </div>

        {/* Last Activity */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
            Last Activity
          </p>
          <p className="text-sm font-medium text-slate-300">{lastActivity}</p>
        </div>
      </div>
    </div>
  );
}
