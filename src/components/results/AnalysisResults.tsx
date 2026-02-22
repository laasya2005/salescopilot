"use client";

import { useRef, useState, useEffect } from "react";
import type { AnalysisResult } from "@/lib/types";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";

const INITIAL_SHOW = 3;

function getScoreColor(value: number): string {
  if (value >= 86) return "#6366f1"; // indigo-500 — Exceptional (brand)
  if (value >= 71) return "#10b981"; // emerald-500 — Strong
  if (value >= 56) return "#14b8a6"; // teal-500 — Promising
  if (value >= 41) return "#eab308"; // yellow-500 — Moderate
  if (value >= 26) return "#f97316"; // orange-500 — Low
  return "#f43f5e";                  // rose-500 — Critical
}

export function AnalysisResults({ result }: { result: AnalysisResult }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const { copy, copied } = useCopyToClipboard();

  const [showAllSignals, setShowAllSignals] = useState(false);
  const [showAllObjections, setShowAllObjections] = useState(false);

  // Revoke the Object URL when the component unmounts or audioUrl changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  async function handleVoiceCoaching() {
    if (!result.coachingSummary) return;
    setVoiceLoading(true);
    setVoiceError("");
    try {
      const res = await fetch("/api/voice-coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachingSummary: result.coachingSummary }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setVoiceError(errData.error || "Voice generation failed.");
        return;
      }
      const blob = await res.blob();
      // Revoke previous URL before creating a new one
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => { audioRef.current?.play(); }, 100);
    } catch {
      setVoiceError("Failed to generate voice coaching.");
    } finally {
      setVoiceLoading(false);
    }
  }

  const visibleSignals = showAllSignals
    ? result.buyingSignals
    : result.buyingSignals.slice(0, INITIAL_SHOW);
  const hiddenSignalCount = result.buyingSignals.length - INITIAL_SHOW;

  const visibleObjections = showAllObjections
    ? result.objections
    : result.objections.slice(0, INITIAL_SHOW);
  const hiddenObjectionCount = result.objections.length - INITIAL_SHOW;

  return (
    <div className="space-y-6">
      {/* Score Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Worth Chasing */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.worthChasing ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
              {result.worthChasing ? (
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400">Worth Chasing?</p>
              <p className={`text-lg font-bold ${result.worthChasing ? "text-emerald-400" : "text-rose-400"}`}>
                {result.worthChasing ? "YES" : "NO"}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400">{result.worthChasingReasoning}</p>
        </div>

        {/* Lead Score */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 flex flex-col items-center">
          <ScoreRing
            value={result.leadScore}
            label="Lead Score"
            color={getScoreColor(result.leadScore)}
          />
          <p className="text-xs text-slate-400 mt-1 text-center">{result.leadScoreReasoning}</p>
        </div>

        {/* Deal Risk */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 flex flex-col items-center justify-center">
          <p className="text-xs text-slate-400 mb-2">Deal Risk</p>
          <RiskBadge risk={result.dealRisk} />
          <p className="text-xs text-slate-400 mt-3 text-center">{result.dealRiskReasoning}</p>
        </div>

        {/* Close Forecast */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 flex flex-col items-center">
          <ScoreRing
            value={result.closeForecast}
            label="Close Forecast"
            color={getScoreColor(result.closeForecast)}
          />
          <p className="text-xs text-slate-400 mt-1 text-center">{result.closeForecastReasoning}</p>
        </div>
      </div>

      {/* Buying Signals & Objections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buying Signals */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Buying Signals
          </h3>
          {result.buyingSignals.length > 0 ? (
            <div className="space-y-3">
              {visibleSignals.map((s, i) => (
                <div key={i} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                  <p className="text-sm text-white font-medium">{s.signal}</p>
                  <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{s.evidence}&rdquo;</p>
                </div>
              ))}
              {hiddenSignalCount > 0 && !showAllSignals && (
                <button
                  onClick={() => setShowAllSignals(true)}
                  className="text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Show {hiddenSignalCount} more
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No clear buying signals detected.</p>
          )}
        </div>

        {/* Objections */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Objections Detected
          </h3>
          {result.objections.length > 0 ? (
            <div className="space-y-3">
              {visibleObjections.map((o, i) => (
                <div key={i} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                  <p className="text-sm text-white font-medium">{o.objection}</p>
                  <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{o.evidence}&rdquo;</p>
                </div>
              ))}
              {hiddenObjectionCount > 0 && !showAllObjections && (
                <button
                  onClick={() => setShowAllObjections(true)}
                  className="text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Show {hiddenObjectionCount} more
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No objections detected.</p>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Recommended Next Steps
        </h3>
        <div className="space-y-2">
          {result.nextSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Email */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-violet-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Follow-Up Email Draft
          </h3>
          <button
            onClick={() => copy(result.followUpEmail)}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 overflow-x-auto max-h-[500px] overflow-y-auto">
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
            {result.followUpEmail}
          </pre>
        </div>
      </div>

      {/* AI Voice Coaching */}
      <div className="bg-gradient-to-r from-slate-900/80 to-violet-950/30 rounded-xl border border-violet-500/20 p-5">
        <h3 className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          AI Voice Coaching
        </h3>
        <p className="text-sm text-slate-400 mb-4">{result.coachingSummary}</p>
        {voiceError && (
          <p className="text-xs text-red-400 mb-2">{voiceError}</p>
        )}
        {!audioUrl ? (
          <div>
            <button
              onClick={handleVoiceCoaching}
              disabled={voiceLoading}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {voiceLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating Voice...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Listen to AI Coach
                </>
              )}
            </button>
            {voiceLoading && (
              <p className="text-xs text-slate-500 mt-2">This usually takes 5-10 seconds</p>
            )}
          </div>
        ) : (
          <audio ref={audioRef} controls src={audioUrl} className="w-full mt-2" />
        )}
      </div>
    </div>
  );
}
