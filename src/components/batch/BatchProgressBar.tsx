"use client";

export function BatchProgressBar({
  current,
  total,
  currentCompanyName,
}: {
  current: number;
  total: number;
  currentCompanyName?: string;
}) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Batch analysis progress: ${current} of ${total}`}
      className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
        <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Batch Analysis in Progress
        </h3>
        <span className="text-sm text-slate-400">
          {currentCompanyName
            ? `Analyzing "${currentCompanyName}" (${current} of ${total})...`
            : `Analyzing ${current} of ${total} conversations...`}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">{percent}% complete</p>
    </div>
  );
}
