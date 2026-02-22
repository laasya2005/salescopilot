"use client";

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
      <label className="block text-xs text-slate-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              value === opt
                ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
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
  const update = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
    onFormChange({ ...form, [key]: value });
  };

  const { filled, total } = countFilledFields(form);
  const completenessLabel = getCompletenessLabel(filled);
  const completenessPercent = Math.round((filled / total) * 100);

  const canSubmit = form.companyName.trim() && form.painPoint.trim();

  const inputClass =
    "w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 mb-8">
      {/* Header + Completeness */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-slate-200">Event Conversation Notes</h2>
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
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
              <label className="block text-xs text-slate-400 mb-1">Prospect Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Jane Smith"
                value={form.prospectName}
                onChange={(e) => update("prospectName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Title / Role</label>
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
              <label className="block text-xs text-slate-400 mb-1">Company Name *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Acme Corp"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Event Name</label>
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
            <label className="block text-xs text-slate-400 mb-1">Pain Point / Need Described *</label>
            <textarea
              className={`${inputClass} h-24 resize-none`}
              placeholder="What problem did they describe? What are they looking for?"
              value={form.painPoint}
              onChange={(e) => update("painPoint", e.target.value)}
            />
          </div>

          {/* Competitors */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Competitors Mentioned</label>
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
            <label className="block text-xs text-slate-400 mb-1">Notable Quotes</label>
            <textarea
              className={`${inputClass} h-20 resize-none`}
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
            <label className="block text-xs text-slate-400 mb-1">Next Steps Discussed</label>
            <textarea
              className={`${inputClass} h-20 resize-none`}
              placeholder="What did you agree to do next?"
              value={form.nextStepsDiscussed}
              onChange={(e) => update("nextStepsDiscussed", e.target.value)}
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Additional Notes</label>
            <textarea
              className={`${inputClass} h-20 resize-none`}
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
          className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
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
