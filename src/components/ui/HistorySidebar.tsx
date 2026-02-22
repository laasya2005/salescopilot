"use client";

import type { HistoryEntry } from "@/lib/types";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const modeLabels: Record<string, { label: string; color: string }> = {
  transcript: { label: "Transcript", color: "bg-blue-500/20 text-blue-400" },
  "email-thread": { label: "Email", color: "bg-cyan-500/20 text-cyan-400" },
  "event-form": { label: "Event", color: "bg-violet-500/20 text-violet-400" },
  batch: { label: "Batch", color: "bg-amber-500/20 text-amber-400" },
};

function ScoreDot({ value }: { value: number }) {
  const color = value >= 70 ? "bg-emerald-400" : value >= 40 ? "bg-amber-400" : "bg-red-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
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
  return (
    <>
      {/* Toggle Button — always visible */}
      <button
        onClick={onToggle}
        className={`fixed top-20 right-0 z-30 flex items-center gap-1.5 px-3 py-2 rounded-l-lg border border-r-0 text-xs font-medium transition-all duration-200 ${
          open
            ? "bg-blue-600/20 border-blue-500/30 text-blue-300"
            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {entries.length > 0 && (
          <span className="bg-blue-500/30 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {entries.length}
          </span>
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-20 bg-slate-950 border-l border-slate-800 shadow-2xl shadow-black/50 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "320px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Session History</h2>
          <button
            onClick={onToggle}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Entry List */}
        <div className="overflow-y-auto h-[calc(100%-57px)] px-3 py-3 space-y-2">
          {entries.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-8 h-8 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-slate-600">No analyses yet this session</p>
              <p className="text-[11px] text-slate-700 mt-1">Results will appear here as you analyze</p>
            </div>
          )}

          {entries.map((entry) => {
            const m = modeLabels[entry.mode] || modeLabels.transcript;
            const isActive = activeEntryId === entry.id;

            return (
              <div
                key={entry.id}
                onClick={() => onSelect(entry)}
                className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50"
                }`}
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(entry.id);
                  }}
                  className="absolute top-2 right-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Company + Mode badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-white truncate flex-1">
                    {entry.companyName}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.color}`}>
                    {m.label}
                  </span>
                </div>

                {/* Score row */}
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ScoreDot value={entry.leadScore} />
                    Score {entry.leadScore}
                  </span>
                  <span className={entry.worthChasing ? "text-emerald-500" : "text-red-400"}>
                    {entry.worthChasing ? "Worth it" : "Pass"}
                  </span>
                  <span
                    className={
                      entry.dealRisk === "Low"
                        ? "text-emerald-500"
                        : entry.dealRisk === "High"
                        ? "text-red-400"
                        : "text-amber-400"
                    }
                  >
                    {entry.dealRisk}
                  </span>
                </div>

                {/* Timestamp */}
                <p className="text-[10px] text-slate-600 mt-1.5">{formatTime(entry.timestamp)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlay when open */}
      {open && (
        <div
          className="fixed inset-0 z-10 bg-black/30"
          onClick={onToggle}
        />
      )}
    </>
  );
}
