export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <svg
              className="w-9 h-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 w-16 h-16">
            <svg className="w-full h-full animate-spin" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray="140 60"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E4ED8" />
                  <stop offset="100%" stopColor="#2E42C8" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-white mb-1">
            Sales Intelligence Copilot
          </h2>
          <p className="text-sm text-slate-500">Loading your workspace...</p>
        </div>

        {/* Skeleton preview */}
        <div className="w-80 space-y-3 mt-4">
          <div className="h-3 bg-slate-800 rounded-full animate-pulse" />
          <div className="h-3 bg-slate-800 rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-slate-800 rounded-full animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  );
}
