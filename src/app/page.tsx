"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { InputMode, AnalysisResult, EventFormData, BatchItem, HistoryEntry } from "@/lib/types";
import { eventFormToTranscript } from "@/lib/event-form-to-transcript";
import { ModeSwitcher } from "@/components/ui/ModeSwitcher";
import { HistorySidebar } from "@/components/ui/HistorySidebar";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { TranscriptInput } from "@/components/transcript/TranscriptInput";
import { EmailThreadInput } from "@/components/email-thread/EmailThreadInput";
import { EventConversationForm } from "@/components/event-form/EventConversationForm";
import { BatchUpload } from "@/components/batch/BatchUpload";
import { BatchProgressBar } from "@/components/batch/BatchProgressBar";
import { BatchResultsTable } from "@/components/batch/BatchResultsTable";
import { AnalysisResults } from "@/components/results/AnalysisResults";
import { LoadingSkeleton } from "@/components/results/LoadingSkeleton";

const emptyEventForm: EventFormData = {
  prospectName: "",
  prospectTitle: "",
  companyName: "",
  eventName: "",
  painPoint: "",
  budget: "",
  budgetNotes: "",
  decisionMaker: "",
  decisionMakerName: "",
  timeline: "",
  competitorsMentioned: "",
  interestLevel: "",
  nextStepsDiscussed: "",
  notableQuotes: "",
  additionalNotes: "",
};

function ClearButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-all duration-150 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-700 hover:border-red-500/40 hover:bg-red-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 whitespace-nowrap"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {label || "Clear"}
    </button>
  );
}

export default function Home() {
  const [mode, setMode] = useState<InputMode>("transcript");

  // ── Persistent history ──
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const historyIdCounter = useRef(0);

  // Load history from server on mount
  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
          // Set counter past the highest existing id to avoid collisions
          for (const entry of data) {
            const match = entry.id?.match(/^h-(\d+)-/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > historyIdCounter.current) historyIdCounter.current = num;
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // ── Escape key to close sidebar ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && historyOpen) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [historyOpen]);

  // ── Transcript mode state ──
  const [transcript, setTranscript] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [dealStage, setDealStage] = useState("Discovery");
  const [dealAmount, setDealAmount] = useState("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<AnalysisResult | null>(null);
  const [transcriptError, setTranscriptError] = useState("");

  // ── Email thread mode state ──
  const [emailThread, setEmailThread] = useState("");
  const [emailCompanyName, setEmailCompanyName] = useState("");
  const [emailDealStage, setEmailDealStage] = useState("Discovery");
  const [emailDealAmount, setEmailDealAmount] = useState("");
  const [emailThreadContext, setEmailThreadContext] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<AnalysisResult | null>(null);
  const [emailError, setEmailError] = useState("");

  // ── Event form mode state ──
  const [eventForm, setEventForm] = useState<EventFormData>(emptyEventForm);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventResult, setEventResult] = useState<AnalysisResult | null>(null);
  const [eventError, setEventError] = useState("");

  // ── Batch mode state ──
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchCurrentCompanyName, setBatchCurrentCompanyName] = useState("");
  const [batchDone, setBatchDone] = useState(false);
  const [batchError, setBatchError] = useState("");

  // ── History helpers (with server sync) ──
  function pushHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `h-${++historyIdCounter.current}-${Date.now()}`,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newEntry, ...prev]);
    setActiveHistoryId(newEntry.id);

    // Persist to server
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    }).catch(() => {});
  }

  function restoreHistoryEntry(entry: HistoryEntry) {
    setActiveHistoryId(entry.id);

    if (entry.mode === "transcript") {
      setTranscript(entry.transcript || "");
      setCompanyName(entry.companyName);
      setDealStage(entry.dealStage || "Discovery");
      setDealAmount(entry.dealAmount || "");
      setTranscriptResult(entry.result);
      setTranscriptError("");
      setMode("transcript");
    } else if (entry.mode === "email-thread") {
      setEmailThread(entry.transcript || "");
      setEmailCompanyName(entry.companyName);
      setEmailDealStage(entry.dealStage || "Discovery");
      setEmailDealAmount(entry.dealAmount || "");
      setEmailThreadContext(entry.threadContext || "");
      setEmailResult(entry.result);
      setEmailError("");
      setMode("email-thread");
    } else if (entry.mode === "event-form") {
      if (entry.eventForm) setEventForm(entry.eventForm);
      setEventResult(entry.result);
      setEventError("");
      setMode("event-form");
    } else if (entry.mode === "batch") {
      // Restore batch entry as a single completed transcript item
      setTranscript(entry.transcript || "");
      setCompanyName(entry.companyName);
      setDealStage(entry.dealStage || "Discovery");
      setDealAmount(entry.dealAmount || "");
      setTranscriptResult(entry.result);
      setTranscriptError("");
      setMode("transcript");
    }

    setHistoryOpen(false);
  }

  function removeHistoryEntry(id: string) {
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (activeHistoryId === id) setActiveHistoryId(null);

    // Remove from server
    fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  // ── Shared analyze helper ──
  async function analyzeTranscript(
    transcriptText: string,
    company: string,
    stage: string,
    amount: string,
    source?: string
  ): Promise<AnalysisResult> {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: transcriptText,
        companyName: company,
        dealStage: stage,
        dealAmount: amount || undefined,
        source,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Analysis failed.");
    return data;
  }

  // ── Transcript mode handlers ──
  async function handleTranscriptAnalyze() {
    if (!transcript.trim() || !companyName.trim()) {
      setTranscriptError("Please enter both a transcript and company name.");
      return;
    }
    setTranscriptLoading(true);
    setTranscriptError("");
    try {
      const data = await analyzeTranscript(transcript, companyName, dealStage, dealAmount);
      setTranscriptResult(data);
      pushHistory({
        mode: "transcript",
        companyName,
        leadScore: data.leadScore,
        worthChasing: data.worthChasing,
        dealRisk: data.dealRisk,
        result: data,
        transcript,
        dealStage,
        dealAmount,
      });
    } catch (e) {
      setTranscriptError(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      setTranscriptLoading(false);
    }
  }

  function clearTranscriptMode() {
    setTranscript("");
    setCompanyName("");
    setDealStage("Discovery");
    setDealAmount("");
    setTranscriptResult(null);
    setTranscriptError("");
    setActiveHistoryId(null);
  }

  // ── Email thread mode handlers ──
  async function handleEmailAnalyze() {
    if (!emailThread.trim() || !emailCompanyName.trim()) {
      setEmailError("Please paste an email thread and enter a company name.");
      return;
    }
    setEmailLoading(true);
    setEmailError("");
    try {
      const fullThread = emailThreadContext
        ? `[Thread context: ${emailThreadContext}]\n\n${emailThread}`
        : emailThread;
      const data = await analyzeTranscript(fullThread, emailCompanyName, emailDealStage, emailDealAmount, "email-thread");
      setEmailResult(data);
      pushHistory({
        mode: "email-thread",
        companyName: emailCompanyName,
        leadScore: data.leadScore,
        worthChasing: data.worthChasing,
        dealRisk: data.dealRisk,
        result: data,
        transcript: emailThread,
        dealStage: emailDealStage,
        dealAmount: emailDealAmount,
        threadContext: emailThreadContext,
      });
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  }

  function clearEmailMode() {
    setEmailThread("");
    setEmailCompanyName("");
    setEmailDealStage("Discovery");
    setEmailDealAmount("");
    setEmailThreadContext("");
    setEmailResult(null);
    setEmailError("");
    setActiveHistoryId(null);
  }

  // ── Event form mode handlers ──
  async function handleEventFormAnalyze(formData: EventFormData) {
    const structured = eventFormToTranscript(formData);
    setEventLoading(true);
    setEventError("");
    try {
      const data = await analyzeTranscript(structured, formData.companyName, "Discovery", "", "event-form");
      setEventResult(data);
      pushHistory({
        mode: "event-form",
        companyName: formData.companyName,
        leadScore: data.leadScore,
        worthChasing: data.worthChasing,
        dealRisk: data.dealRisk,
        result: data,
        eventForm: { ...formData },
      });
    } catch (e) {
      setEventError(e instanceof Error ? e.message : "Network error. Please try again.");
    } finally {
      setEventLoading(false);
    }
  }

  function clearEventMode() {
    setEventForm(emptyEventForm);
    setEventResult(null);
    setEventError("");
    setActiveHistoryId(null);
  }

  // ── Batch mode handlers ──
  // Use a ref to avoid stale closure over batchItems
  const batchItemsRef = useRef(batchItems);
  batchItemsRef.current = batchItems;

  const handleBatchProcess = useCallback(async () => {
    setBatchProcessing(true);
    setBatchCurrent(0);
    setBatchCurrentCompanyName("");
    setBatchDone(false);
    setBatchError("");

    // Snapshot items at the start of processing
    const updated = [...batchItemsRef.current];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      setBatchCurrent(i + 1);
      setBatchCurrentCompanyName(item.companyName);

      updated[i] = { ...updated[i], status: "processing" };
      setBatchItems([...updated]);

      try {
        const data = await analyzeTranscript(
          item.transcript,
          item.companyName,
          item.dealStage,
          item.dealAmount
        );
        updated[i] = { ...updated[i], status: "completed", result: data };

        pushHistory({
          mode: "batch",
          companyName: item.companyName,
          leadScore: data.leadScore,
          worthChasing: data.worthChasing,
          dealRisk: data.dealRisk,
          result: data,
          transcript: item.transcript,
          dealStage: item.dealStage,
          dealAmount: item.dealAmount,
        });
      } catch (e) {
        updated[i] = {
          ...updated[i],
          status: "error",
          error: e instanceof Error ? e.message : "Analysis failed",
        };
      }

      setBatchItems([...updated]);
    }

    setBatchProcessing(false);
    setBatchCurrentCompanyName("");
    setBatchDone(true);
  }, []);

  function clearBatchMode() {
    setBatchItems([]);
    setBatchCurrent(0);
    setBatchCurrentCompanyName("");
    setBatchDone(false);
    setBatchError("");
    setActiveHistoryId(null);
  }

  // ── Derive per-mode values ──
  const activeError =
    mode === "transcript"
      ? transcriptError
      : mode === "email-thread"
      ? emailError
      : mode === "event-form"
      ? eventError
      : batchError;
  const activeLoading =
    mode === "transcript"
      ? transcriptLoading
      : mode === "email-thread"
      ? emailLoading
      : mode === "event-form"
      ? eventLoading
      : batchProcessing;

  const setActiveError =
    mode === "transcript"
      ? setTranscriptError
      : mode === "email-thread"
      ? setEmailError
      : mode === "event-form"
      ? setEventError
      : setBatchError;

  const activeRetry =
    mode === "transcript"
      ? handleTranscriptAnalyze
      : mode === "email-thread"
      ? handleEmailAnalyze
      : undefined;

  const transcriptHasData =
    transcript || companyName || dealAmount || transcriptResult || transcriptError;
  const emailHasData =
    emailThread || emailCompanyName || emailDealAmount || emailThreadContext || emailResult || emailError;
  const eventHasData =
    eventForm.companyName || eventForm.painPoint || eventForm.prospectName || eventResult || eventError;
  const batchHasData = batchItems.length > 0 || batchDone || batchError;

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Session History Sidebar */}
      <HistorySidebar
        entries={history}
        open={historyOpen}
        onToggle={() => setHistoryOpen((v) => !v)}
        onSelect={restoreHistoryEntry}
        onRemove={removeHistoryEntry}
        activeEntryId={activeHistoryId}
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Sales Intelligence Copilot</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mode Switcher + Clear Button Row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1">
            <ModeSwitcher activeMode={mode} onChange={setMode} />
          </div>
          {mode === "transcript" && transcriptHasData && !activeLoading && (
            <ClearButton onClick={clearTranscriptMode} label="Clear" />
          )}
          {mode === "email-thread" && emailHasData && !activeLoading && (
            <ClearButton onClick={clearEmailMode} label="Clear" />
          )}
          {mode === "event-form" && eventHasData && !activeLoading && (
            <ClearButton onClick={clearEventMode} label="Clear" />
          )}
          {mode === "batch" && batchHasData && !batchProcessing && (
            <ClearButton onClick={clearBatchMode} label="Clear All" />
          )}
        </div>

        {/* Error Display (per-mode) */}
        {activeError && (
          <ErrorBanner
            message={activeError}
            onDismiss={() => setActiveError("")}
            onRetry={activeRetry}
          />
        )}

        {/* === TRANSCRIPT MODE === */}
        {mode === "transcript" && (
          <div role="tabpanel" aria-label="Paste Transcript">
            <TranscriptInput
              transcript={transcript}
              setTranscript={setTranscript}
              companyName={companyName}
              setCompanyName={setCompanyName}
              dealStage={dealStage}
              setDealStage={setDealStage}
              dealAmount={dealAmount}
              setDealAmount={setDealAmount}
              loading={transcriptLoading}
              onAnalyze={handleTranscriptAnalyze}
            />

            {transcriptResult && <AnalysisResults result={transcriptResult} transcript={transcript} companyName={companyName} dealStage={dealStage} />}

            {transcriptLoading && <LoadingSkeleton />}

            {!transcriptResult && !transcriptLoading && !transcriptError && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-slate-400 font-medium">Paste a transcript to get started</h3>
                <p className="text-slate-500 text-sm mt-1">Your AI-powered sales analysis will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* === EMAIL THREAD MODE === */}
        {mode === "email-thread" && (
          <div role="tabpanel" aria-label="Email Thread">
            <EmailThreadInput
              emailThread={emailThread}
              setEmailThread={setEmailThread}
              companyName={emailCompanyName}
              setCompanyName={setEmailCompanyName}
              dealStage={emailDealStage}
              setDealStage={setEmailDealStage}
              dealAmount={emailDealAmount}
              setDealAmount={setEmailDealAmount}
              threadContext={emailThreadContext}
              setThreadContext={setEmailThreadContext}
              loading={emailLoading}
              onAnalyze={handleEmailAnalyze}
            />

            {emailResult && <AnalysisResults result={emailResult} transcript={emailThread} companyName={emailCompanyName} dealStage={emailDealStage} source="email-thread" />}

            {emailLoading && <LoadingSkeleton />}

            {!emailResult && !emailLoading && !emailError && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-slate-400 font-medium">Paste an email thread to analyze</h3>
                <p className="text-slate-500 text-sm mt-1">AI will evaluate engagement, buying signals, and suggest the next reply</p>
              </div>
            )}
          </div>
        )}

        {/* === EVENT FORM MODE === */}
        {mode === "event-form" && (
          <div role="tabpanel" aria-label="Event Conversation">
            <EventConversationForm
              loading={eventLoading}
              form={eventForm}
              onFormChange={setEventForm}
              onAnalyze={handleEventFormAnalyze}
            />

            {eventResult && <AnalysisResults result={eventResult} transcript={eventFormToTranscript(eventForm)} companyName={eventForm.companyName} dealStage="Discovery" source="event-form" />}

            {eventLoading && <LoadingSkeleton />}

            {!eventResult && !eventLoading && !eventError && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-slate-400 font-medium">Capture event conversation details</h3>
                <p className="text-slate-500 text-sm mt-1">Fill in what you learned and get AI-powered analysis</p>
              </div>
            )}
          </div>
        )}

        {/* === BATCH MODE === */}
        {mode === "batch" && (
          <div role="tabpanel" aria-label="Batch Upload">
            <BatchUpload
              items={batchItems}
              setItems={setBatchItems}
              processing={batchProcessing}
              onStartProcessing={handleBatchProcess}
            />

            {batchProcessing && (
              <BatchProgressBar
                current={batchCurrent}
                total={batchItems.length}
                currentCompanyName={batchCurrentCompanyName}
              />
            )}

            {batchDone && <BatchResultsTable items={batchItems} />}

            {!batchDone && !batchProcessing && batchItems.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M8 11h.01M12 11h.01M16 11h.01" />
                  </svg>
                </div>
                <h3 className="text-slate-400 font-medium">Process multiple conversations at once</h3>
                <p className="text-slate-500 text-sm mt-1">Upload .txt files or paste multiple transcripts separated by ---</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
