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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Email Thread Input */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email Thread
          </label>
          <textarea
            className="w-full h-72 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed font-mono"
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
              <p className="text-xs text-blue-400">
                ~{emailCount} email{emailCount !== 1 ? "s" : ""} detected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Inputs */}
      <div className="space-y-4">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-medium text-slate-300">Deal Details</h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Deal Stage *
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={dealStage}
              onChange={(e) => setDealStage(e.target.value)}
            >
              <option value="Discovery">Discovery</option>
              <option value="Demo">Demo</option>
              <option value="Negotiation">Negotiation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Deal Amount (optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm">
                $
              </span>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="50,000"
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Thread Context (optional)
            </label>
            <textarea
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-16 resize-none"
              placeholder="e.g. Cold outreach follow-up, post-demo thread, inbound inquiry..."
              value={threadContext}
              onChange={(e) => setThreadContext(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
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
