"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { AnalysisResult, CoachingScript, BudgetHealth } from "@/lib/types";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import { companySlug } from "@/lib/slug";

const INITIAL_SHOW = 3;

function getScoreColor(value: number): string {
  if (value >= 86) return "#1E4ED8"; // Royal Blue — Exceptional (brand)
  if (value >= 71) return "#10b981"; // emerald-500 — Strong
  if (value >= 56) return "#38B2E8"; // teal-400 — Promising
  if (value >= 41) return "#eab308"; // yellow-500 — Moderate
  if (value >= 26) return "#f97316"; // orange-500 — Low
  return "#f43f5e";                  // rose-500 — Critical
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function getBudgetHealthColor(status: BudgetHealth): string {
  switch (status) {
    case "Confirmed": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    case "Exploring": return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    case "Constrained": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    case "No Budget": return "bg-rose-500/15 text-rose-400 border-rose-500/20";
    default: return "bg-slate-500/15 text-slate-400 border-slate-500/20";
  }
}

function getRiskScoreColor(value: number): string {
  if (value <= 25) return "text-emerald-400";
  if (value <= 50) return "text-yellow-400";
  if (value <= 75) return "text-orange-400";
  return "text-rose-400";
}

function getRiskScoreBg(value: number): string {
  if (value <= 25) return "bg-emerald-400";
  if (value <= 50) return "bg-yellow-400";
  if (value <= 75) return "bg-orange-400";
  return "bg-rose-400";
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  transcript?: string;
  companyName?: string;
  dealStage?: string;
  source?: string;
}

export function AnalysisResults({ result, transcript, companyName, dealStage, source }: AnalysisResultsProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceLoadingStep, setVoiceLoadingStep] = useState("");
  const [coachingScript, setCoachingScript] = useState<CoachingScript | null>(null);
  const [showCoachingNotes, setShowCoachingNotes] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { copy, copied } = useCopyToClipboard();

  const [showAllSignals, setShowAllSignals] = useState(false);
  const [showAllObjections, setShowAllObjections] = useState(false);

  // Pre-generated coaching script cached from background fetch
  const prefetchPromiseRef = useRef<Promise<CoachingScript | null> | null>(null);

  // Revoke the Object URL when the component unmounts or audioUrl changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Pre-generate coaching script in background as soon as results mount
  useEffect(() => {
    if (!transcript || !companyName) return;
    const controller = new AbortController();

    prefetchPromiseRef.current = fetch("/api/coaching-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        companyName,
        dealStage: dealStage || "Discovery",
        source: source || undefined,
        analysisResult: result,
      }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CoachingScript | null) => {
        if (data?.script && data.script.length >= 100) return data;
        return null;
      })
      .catch(() => null);

    return () => controller.abort();
  }, [transcript, companyName, dealStage, source, result]);

  async function handleVoiceCoaching() {
    if (!result.coachingSummary) return;
    setVoiceLoading(true);
    setVoiceError("");

    // Await pre-generated script if available, fallback to coachingSummary
    let speechText = result.coachingSummary;
    if (prefetchPromiseRef.current) {
      try {
        setVoiceLoadingStep("Generating Personalized Coaching...");
        const cached = await prefetchPromiseRef.current;
        if (cached) {
          speechText = cached.script;
          setCoachingScript(cached);
        }
      } catch {
        // Fallback to coachingSummary
      }
    }

    // Convert to audio
    try {
      setVoiceLoadingStep("Converting to Audio...");
      const res = await fetch("/api/voice-coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: speechText }),
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
      setTimeout(() => { audioRef.current?.play().catch(() => {}); }, 100);
    } catch {
      setVoiceError("Failed to generate voice coaching.");
    } finally {
      setVoiceLoading(false);
      setVoiceLoadingStep("");
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

  const suggestedQuestions = result.suggestedQuestions || [];

  return (
    <div className="space-y-6">
      {/* Track this Deal banner */}
      {companyName && (
        <Link
          href={`/deal/${companySlug(companyName)}`}
          className="block rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/15 via-violet-600/10 to-indigo-600/15 p-5 hover:border-indigo-500/50 hover:from-indigo-600/20 hover:via-violet-600/15 hover:to-indigo-600/20 transition-all group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-accent-400/20 shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-white mb-0.5">{companyName}</p>
                <p className="text-sm text-slate-400">Open Deal Room to track tasks, notes &amp; documents for this account</p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-accent-400/20 group-hover:shadow-accent-400/30 group-hover:scale-[1.02] transition-all text-sm">
              Track this Deal
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>
      )}

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

      {/* Financial Intelligence */}
      {result.financialAnalysis && (() => {
        const fa = result.financialAnalysis!;
        const de = fa.dealEconomics;
        const rr = fa.revenueRisk;
        const cp = fa.competitivePricing;
        const roi = fa.roiPayback;
        const bh = fa.budgetHealth;

        return (
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Financial Intelligence</h2>
            </div>

            {/* Top Row: 4-column key metrics */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Pipeline Value */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 text-center">
                <p className="text-xs text-slate-400 mb-1">Pipeline Value</p>
                <p className="text-xl font-bold text-white">{formatCurrency(de.weightedPipelineValue)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Weighted by close %</p>
              </div>

              {/* MRR / ARR */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 text-center">
                <p className="text-xs text-slate-400 mb-1">MRR / ARR</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(de.extractedMonthlySpend)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {de.extractedAnnualSpend != null ? `${formatCurrency(de.extractedAnnualSpend)}/yr` : "Annual N/A"}
                </p>
              </div>

              {/* TCV */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 text-center">
                <p className="text-xs text-slate-400 mb-1">Total Contract Value</p>
                <p className="text-xl font-bold text-white">{formatCurrency(de.totalContractValue)}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {de.contractTermMonths != null ? `${de.contractTermMonths}mo term` : "Term N/A"}
                </p>
              </div>

              {/* Budget Health */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 text-center">
                <p className="text-xs text-slate-400 mb-1">Budget Health</p>
                <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full border mt-1 ${getBudgetHealthColor(bh.status)}`}>
                  {bh.status}
                </span>
                {bh.budgetOwner && (
                  <p className="text-[10px] text-slate-500 mt-2 truncate">Owner: {bh.budgetOwner}</p>
                )}
              </div>
            </div>

            {/* Middle Row: Revenue Risk + Competitive Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenue Risk Assessment */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Revenue Risk
                </h3>

                {/* Risk Score */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${getRiskScoreBg(rr.overallScore)} transition-all duration-500`} style={{ width: `${rr.overallScore}%` }} />
                  </div>
                  <span className={`text-lg font-bold tabular-nums ${getRiskScoreColor(rr.overallScore)}`}>{rr.overallScore}</span>
                </div>

                {/* Sub-indicators */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                    Budget: {rr.budgetConstraintSeverity}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                    Delay: {rr.paymentDelayLikelihood}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                    Cancel: {rr.cancellationRisk}
                  </span>
                </div>

                {/* Risk items */}
                {rr.risks.length > 0 && (
                  <div className="space-y-2 mt-3 border-t border-slate-800 pt-3">
                    {rr.risks.map((r, i) => (
                      <div key={i} className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            r.severity === "High" ? "bg-rose-500/15 text-rose-400 border-rose-500/20" :
                            r.severity === "Medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/20" :
                            "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          }`}>{r.severity}</span>
                          <p className="text-xs text-white font-medium">{r.risk}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 italic">&ldquo;{r.evidence}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Competitive Pricing Intel */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Competitive Pricing
                </h3>

                {/* Discount pressure */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-400">Discount Pressure:</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    cp.discountPressureLevel === "High" ? "bg-rose-500/15 text-rose-400 border-rose-500/20" :
                    cp.discountPressureLevel === "Medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/20" :
                    cp.discountPressureLevel === "Low" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" :
                    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  }`}>{cp.discountPressureLevel}</span>
                </div>

                {cp.priceSensitivitySignal && (
                  <p className="text-xs text-slate-400 mb-3">{cp.priceSensitivitySignal}</p>
                )}

                {/* Competitor rows */}
                {cp.competitorsDetected.length > 0 ? (
                  <div className="space-y-2">
                    {cp.competitorsDetected.map((c, i) => (
                      <div key={i} className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white font-medium">{c.competitor}</p>
                          <p className="text-[11px] text-slate-400 truncate">{c.context}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.mentionedPrice && (
                            <span className="text-xs text-teal-400 font-mono">{c.mentionedPrice}</span>
                          )}
                          {c.discountPressure && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">DISCOUNT</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No competitors mentioned.</p>
                )}
              </div>
            </div>

            {/* Bottom Row: ROI & Payback */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                ROI &amp; Payback Analysis
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ml-auto ${
                  roi.dataConfidence === "High" ? "bg-emerald-500/15 text-emerald-400" :
                  roi.dataConfidence === "Medium" ? "bg-yellow-500/15 text-yellow-400" :
                  roi.dataConfidence === "Low" ? "bg-orange-500/15 text-orange-400" :
                  "bg-slate-500/15 text-slate-400"
                }`}>
                  {roi.dataConfidence} Confidence
                </span>
              </h3>

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${roi.dataConfidence === "Insufficient" ? "opacity-50" : ""}`}>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Current Cost</p>
                  <p className="text-lg font-bold text-white">{roi.prospectCurrentCost || "N/A"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Expected Savings</p>
                  <p className="text-lg font-bold text-white">{roi.prospectExpectedSavings || "N/A"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Implied ROI</p>
                  <p className="text-lg font-bold text-teal-400">{roi.impliedROIPercent != null ? `${roi.impliedROIPercent}%` : "N/A"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">Payback Period</p>
                  <p className="text-lg font-bold text-teal-400">{roi.paybackPeriodMonths != null ? `${roi.paybackPeriodMonths}mo` : "N/A"}</p>
                </div>
              </div>

              {roi.reasoning && (
                <p className="text-xs text-slate-400 mt-3 border-t border-slate-800 pt-3">{roi.reasoning}</p>
              )}
            </div>
          </div>
        );
      })()}

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

      {/* Questions You Should Ask */}
      {suggestedQuestions.length > 0 && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Questions You Should Ask
          </h3>
          <div className="space-y-3">
            {suggestedQuestions.map((q, i) => (
              <div key={i} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                <p className="text-sm text-white font-medium">{q.question}</p>
                <p className="text-xs text-slate-400 mt-1">{q.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
      <div className="bg-gradient-to-r from-slate-900/80 to-accent-950/30 rounded-xl border border-accent-400/20 p-5">
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
                  {voiceLoadingStep || "Generating Voice..."}
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
              <p className="text-xs text-slate-500 mt-2">Converting coaching to audio — this usually takes 5-10 seconds</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <audio ref={audioRef} controls src={audioUrl} className="w-full mt-2" />

            {/* Coaching Notes Toggle */}
            {coachingScript && (
              <div>
                <button
                  onClick={() => setShowCoachingNotes((v) => !v)}
                  className="text-xs text-violet-300 hover:text-white hover:bg-violet-500/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${showCoachingNotes ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showCoachingNotes ? "Hide Coaching Notes" : "Read Coaching Notes"}
                </button>

                {showCoachingNotes && (
                  <div className="mt-4 space-y-4">
                    {/* Strengths */}
                    {coachingScript.sections.strengths.length > 0 && (
                      <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
                        <h4 className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Strengths</h4>
                        <ul className="space-y-1.5">
                          {coachingScript.sections.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <svg className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {coachingScript.sections.improvements.length > 0 && (
                      <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
                        <h4 className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">Areas to Improve</h4>
                        <ul className="space-y-1.5">
                          {coachingScript.sections.improvements.map((s, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                              <svg className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                              </svg>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missed Questions */}
                    {coachingScript.sections.missedQuestions.length > 0 && (
                      <div className="bg-cyan-500/5 rounded-lg p-4 border border-cyan-500/20">
                        <h4 className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">Questions You Missed</h4>
                        <div className="space-y-2">
                          {coachingScript.sections.missedQuestions.map((q, i) => (
                            <div key={i} className="bg-slate-950/30 rounded-lg p-2.5 border border-slate-800">
                              <p className="text-sm text-white font-medium">{q.question}</p>
                              <p className="text-xs text-slate-400 mt-1">{q.why}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Call Questions */}
                    {coachingScript.sections.nextCallQuestions.length > 0 && (
                      <div className="bg-indigo-500/5 rounded-lg p-4 border border-indigo-500/20">
                        <h4 className="text-xs font-semibold text-indigo-400 mb-2 uppercase tracking-wider">Questions for Next Call</h4>
                        <div className="space-y-2">
                          {coachingScript.sections.nextCallQuestions.map((q, i) => (
                            <div key={i} className="bg-slate-950/30 rounded-lg p-2.5 border border-slate-800">
                              <p className="text-sm text-white font-medium">{q.question}</p>
                              <p className="text-xs text-slate-400 mt-1">{q.why}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
