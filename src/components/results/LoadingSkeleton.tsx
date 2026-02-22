"use client";

export function LoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading analysis results">
      {/* Progress header */}
      <div className="flex flex-col items-center py-6">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
        <h3 className="text-indigo-400 font-semibold text-lg">Analyzing your transcript...</h3>
        <p className="text-slate-500 text-sm mt-1">AI is extracting insights and scoring this deal</p>
        <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-accent-400 rounded-full animate-loading-bar" />
        </div>
      </div>

      {/* Skeleton: Score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-slate-800 animate-pulse" />
              <div className="w-20 h-3 bg-slate-800 rounded-full animate-pulse" />
              <div className="w-full h-2 bg-slate-800/50 rounded-full animate-pulse mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton: Financial Intelligence */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
          <div className="w-40 h-4 bg-slate-800 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 text-center">
              <div className="w-16 h-3 bg-slate-800 rounded-full animate-pulse mx-auto mb-2" />
              <div className="w-20 h-6 bg-slate-800 rounded-full animate-pulse mx-auto" />
              <div className="w-12 h-2 bg-slate-800/50 rounded-full animate-pulse mx-auto mt-2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
              <div className="w-32 h-4 bg-slate-800 rounded-full animate-pulse mb-4" />
              <div className="w-full h-2 bg-slate-800 rounded-full animate-pulse mb-3" />
              <div className="flex gap-2 mb-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="w-16 h-5 bg-slate-800 rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton: Signals & Objections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
            <div className="w-32 h-4 bg-slate-800 rounded-full animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                  <div className="w-3/4 h-3 bg-slate-800 rounded-full animate-pulse" />
                  <div className="w-full h-2 bg-slate-800/50 rounded-full animate-pulse mt-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton: Next Steps */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
        <div className="w-40 h-4 bg-slate-800 rounded-full animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-800 animate-pulse flex-shrink-0" />
              <div className="w-full h-3 bg-slate-800/60 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton: Email */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
        <div className="w-36 h-4 bg-slate-800 rounded-full animate-pulse mb-4" />
        <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-2.5 bg-slate-800/50 rounded-full animate-pulse"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
