"use client";

import { useState } from "react";
import type { EventFormData, BudgetStatus, DecisionMaker, Timeline, InterestLevel } from "@/lib/types";
import { countFilledFields, getCompletenessLabel } from "@/lib/event-form-to-transcript";

function PillSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              value === opt
                ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface EventConversationFormProps {
  loading: boolean;
  form: EventFormData;
  onFormChange: (form: EventFormData) => void;
  onAnalyze: (formData: EventFormData) => void;
}

export function EventConversationForm({ loading, form, onFormChange, onAnalyze }: EventConversationFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const update = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
    onFormChange({ ...form, [key]: value });
  };

  const markTouched = (key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const { filled, total } = countFilledFields(form);
  const completenessLabel = getCompletenessLabel(filled);
  const completenessPercent = Math.round((filled / total) * 100);

  const canSubmit = form.companyName.trim() && form.painPoint.trim();

  const companyError = touched.companyName && !form.companyName.trim();
  const painPointError = touched.painPoint && !form.painPoint.trim();

  const inputClass =
    "w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm";

  const errorInputClass =
    "w-full bg-slate-950 border border-red-500/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 hover:border-red-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm";

  return (
    <div className={`bg-slate-900/50 rounded-xl border border-slate-800 p-5 mb-8 ${loading ? "relative" : ""}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-loading-bar" />
          </div>
          <div className="absolute inset-0 bg-slate-950/40 rounded-xl pointer-events-none" />
        </div>
      )}

      {/* Header + Completeness */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-slate-200">Event Conversation Notes</h2>
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filled}/{total} fields — {completenessLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Contact Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Prospect Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Jane Smith"
                value={form.prospectName}
                onChange={(e) => update("prospectName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Title / Role</label>
              <input
                type="text"
                className={inputClass}
                placeholder="VP of Engineering"
                value={form.prospectTitle}
                onChange={(e) => update("prospectTitle", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Name *</label>
              <input
                type="text"
                className={companyError ? errorInputClass : inputClass}
                placeholder="Acme Corp"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                onBlur={() => markTouched("companyName")}
              />
              {companyError && (
                <p className="text-xs text-red-400 mt-1">Company name is required</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Event Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="SaaStr 2026"
                value={form.eventName}
                onChange={(e) => update("eventName", e.target.value)}
              />
            </div>
          </div>

          {/* Pain Point */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Pain Point / Need Described *</label>
            <textarea
              className={`${painPointError ? errorInputClass : inputClass} h-24 resize-y min-h-[96px] max-h-[400px]`}
              placeholder="What problem did they describe? What are they looking for?"
              value={form.painPoint}
              onChange={(e) => update("painPoint", e.target.value)}
              onBlur={() => markTouched("painPoint")}
            />
            {painPointError && (
              <p className="text-xs text-red-400 mt-1">Pain point is required</p>
            )}
          </div>

          {/* Competitors */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Competitors Mentioned</label>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Salesforce, HubSpot"
              value={form.competitorsMentioned}
              onChange={(e) => update("competitorsMentioned", e.target.value)}
            />
          </div>

          {/* Notable Quotes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Notable Quotes</label>
            <textarea
              className={`${inputClass} h-20 resize-y min-h-[80px] max-h-[400px]`}
              placeholder="Any memorable things they said..."
              value={form.notableQuotes}
              onChange={(e) => update("notableQuotes", e.target.value)}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* BANT Pill Selectors */}
          <PillSelector<BudgetStatus>
            label="Budget"
            options={["Yes", "No", "Unsure"]}
            value={form.budget}
            onChange={(v) => update("budget", v)}
          />
          {form.budget && (
            <input
              type="text"
              className={inputClass}
              placeholder="Budget notes (optional)"
              value={form.budgetNotes}
              onChange={(e) => update("budgetNotes", e.target.value)}
            />
          )}

          <PillSelector<DecisionMaker>
            label="Decision Maker"
            options={["Them", "Someone Else", "Unknown"]}
            value={form.decisionMaker}
            onChange={(v) => update("decisionMaker", v)}
          />
          {form.decisionMaker === "Someone Else" && (
            <input
              type="text"
              className={inputClass}
              placeholder="Who is the decision maker?"
              value={form.decisionMakerName}
              onChange={(e) => update("decisionMakerName", e.target.value)}
            />
          )}

          <PillSelector<Timeline>
            label="Timeline"
            options={["Immediate", "This Quarter", "This Year", "Just Exploring"]}
            value={form.timeline}
            onChange={(v) => update("timeline", v)}
          />

          <PillSelector<InterestLevel>
            label="Interest / Energy Level"
            options={["Hot", "Warm", "Cold"]}
            value={form.interestLevel}
            onChange={(v) => update("interestLevel", v)}
          />

          {/* Next Steps */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Next Steps Discussed</label>
            <textarea
              className={`${inputClass} h-20 resize-y min-h-[80px] max-h-[400px]`}
              placeholder="What did you agree to do next?"
              value={form.nextStepsDiscussed}
              onChange={(e) => update("nextStepsDiscussed", e.target.value)}
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Additional Notes</label>
            <textarea
              className={`${inputClass} h-20 resize-y min-h-[80px] max-h-[400px]`}
              placeholder="Anything else worth noting..."
              value={form.additionalNotes}
              onChange={(e) => update("additionalNotes", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={() => onAnalyze(form)}
          disabled={loading || !canSubmit}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing Event Notes...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Analyze Conversation
            </>
          )}
        </button>
        {!canSubmit && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Company name and pain point are required
          </p>
        )}
      </div>
    </div>
  );
}
