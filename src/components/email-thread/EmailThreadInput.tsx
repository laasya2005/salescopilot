"use client";

interface EmailThreadInputProps {
  emailThread: string;
  setEmailThread: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  dealStage: string;
  setDealStage: (v: string) => void;
  dealAmount: string;
  setDealAmount: (v: string) => void;
  threadContext: string;
  setThreadContext: (v: string) => void;
  loading: boolean;
  onAnalyze: () => void;
}

export function EmailThreadInput({
  emailThread,
  setEmailThread,
  companyName,
  setCompanyName,
  dealStage,
  setDealStage,
  dealAmount,
  setDealAmount,
  threadContext,
  setThreadContext,
  loading,
  onAnalyze,
}: EmailThreadInputProps) {
  const emailCount = emailThread
    ? (emailThread.match(/^(From|Subject|Date|Sent)[\s]*:/gim) || []).length || (emailThread.trim() ? 1 : 0)
    : 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 ${loading ? "relative" : ""}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-loading-bar" />
          </div>
          <div className="absolute inset-0 bg-slate-950/40 rounded-xl pointer-events-none" />
        </div>
      )}

      {/* Email Thread Input */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 h-full flex flex-col">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Email Thread
          </label>
          <textarea
            className="w-full flex-1 min-h-[260px] bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 resize-y max-h-[600px] text-sm leading-relaxed font-mono"
            placeholder={"Paste the full email thread here...\n\nFrom: prospect@company.com\nTo: you@yourcompany.com\nSubject: Re: Follow up on our demo\nDate: Feb 18, 2026\n\nHi,\n\nThanks for the demo yesterday. We're interested but need to loop in our CTO...\n\n---\n\nFrom: you@yourcompany.com\nTo: prospect@company.com\nSubject: Follow up on our demo\nDate: Feb 17, 2026\n\nHi Jane,\n\nGreat meeting you today..."}
            value={emailThread}
            onChange={(e) => setEmailThread(e.target.value)}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              {emailThread.length > 0
                ? `${emailThread.split(/\s+/).filter(Boolean).length} words`
                : "Paste an email thread to get started"}
            </p>
            {emailCount > 0 && (
              <p className="text-xs text-indigo-400">
                ~{emailCount} email{emailCount !== 1 ? "s" : ""} detected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Inputs + Analyze Button */}
      <div className="flex flex-col gap-4">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 flex-1 flex flex-col">
          <h3 className="text-xs font-medium text-slate-300 mb-4">Deal Details</h3>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Deal Stage *
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm appearance-none"
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 6l3.5 4 3.5-4H4.5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="Discovery">Discovery</option>
                <option value="Demo">Demo</option>
                <option value="Negotiation">Negotiation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Deal Amount (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-4 py-2.5 text-white placeholder-slate-500 hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm"
                  placeholder="50,000"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Thread Context (optional)
              </label>
              <textarea
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm h-16 resize-y min-h-[64px] max-h-[200px]"
                placeholder="e.g. Cold outreach follow-up, post-demo thread, inbound inquiry..."
                value={threadContext}
                onChange={(e) => setThreadContext(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Email Thread
            </>
          )}
        </button>
      </div>
    </div>
  );
}
