import type { HistoryEntry } from "@/lib/types";

const MAX_ENTRIES = 10;
const MAX_ENTRIES_ALL = 25;
const EXCERPT_LENGTH = 300;

const MODE_KEYWORDS: Record<string, string[]> = {
  "email-thread": ["email", "emails", "thread", "threads", "inbox", "sent", "reply", "replied"],
  "event-form": ["event", "events", "conference", "booth", "meetup", "trade show"],
  transcript: ["call", "calls", "meeting", "meetings", "transcript", "transcripts"],
  batch: ["batch", "bulk", "multiple"],
};

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

function scoreEntry(query: string, entry: HistoryEntry): number {
  const queryLower = query.toLowerCase();
  const queryTokens = tokenize(query);
  let score = 0;

  // Company name exact match (strongest signal)
  if (entry.companyName && queryLower.includes(entry.companyName.toLowerCase())) {
    score += 100;
  }

  // Company name keyword overlap
  const companyTokens = tokenize(entry.companyName || "");
  for (const token of queryTokens) {
    if (token.length < 3) continue;
    if (companyTokens.some((ct) => ct.includes(token) || token.includes(ct))) {
      score += 20;
    }
  }

  // Transcript keyword overlap
  const transcriptLower = (entry.transcript || "").toLowerCase();
  for (const token of queryTokens) {
    if (token.length < 3) continue;
    if (transcriptLower.includes(token)) {
      score += 5;
    }
  }

  // Result fields keyword overlap
  const resultText = [
    entry.result?.leadScoreReasoning,
    entry.result?.worthChasingReasoning,
    entry.result?.dealRiskReasoning,
    entry.result?.closeForecastReasoning,
    entry.result?.coachingSummary,
    entry.result?.followUpEmail,
    ...(entry.result?.nextSteps || []),
    ...(entry.result?.buyingSignals?.map((b) => `${b.signal} ${b.evidence}`) || []),
    ...(entry.result?.objections?.map((o) => `${o.objection} ${o.evidence}`) || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const token of queryTokens) {
    if (token.length < 3) continue;
    if (resultText.includes(token)) {
      score += 3;
    }
  }

  // Financial keywords boost
  const financialKeywords = ["budget", "arr", "mrr", "revenue", "pipeline", "roi", "pricing", "competitor", "discount", "contract", "spend", "payback"];
  for (const kw of financialKeywords) {
    if (queryLower.includes(kw)) {
      score += 15;
      break;
    }
  }

  // Mode preference boost
  for (const [mode, keywords] of Object.entries(MODE_KEYWORDS)) {
    if (keywords.some((k) => queryLower.includes(k)) && entry.mode === mode) {
      score += 15;
    }
  }

  // Recency boost (newer = higher)
  const ageHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
  if (ageHours < 1) score += 10;
  else if (ageHours < 24) score += 7;
  else if (ageHours < 168) score += 4;
  else score += 2;

  return score;
}

function formatEntrySummary(entry: HistoryEntry): string {
  const date = new Date(entry.timestamp).toLocaleDateString();
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const excerpt = entry.transcript
    ? entry.transcript.slice(0, EXCERPT_LENGTH).replace(/\n/g, " ").trim() +
      (entry.transcript.length > EXCERPT_LENGTH ? "..." : "")
    : "(no transcript)";

  const lines = [
    `[${entry.companyName}] (${entry.mode}) — ${date} ${time}`,
    `Lead Score: ${entry.leadScore} | Worth Chasing: ${entry.worthChasing ? "Yes" : "No"} | Deal Risk: ${entry.dealRisk}`,
  ];

  if (entry.dealStage) lines.push(`Deal Stage: ${entry.dealStage}`);
  if (entry.dealAmount) lines.push(`Deal Amount: $${entry.dealAmount}`);

  // Financial data
  const fa = entry.result?.financialAnalysis;
  if (fa) {
    const parts: string[] = [];
    if (fa.dealEconomics.weightedPipelineValue != null) parts.push(`Pipeline: $${fa.dealEconomics.weightedPipelineValue.toLocaleString()}`);
    if (fa.dealEconomics.extractedAnnualSpend != null) parts.push(`ARR: $${fa.dealEconomics.extractedAnnualSpend.toLocaleString()}`);
    if (fa.budgetHealth.status) parts.push(`Budget: ${fa.budgetHealth.status}`);
    if (fa.revenueRisk.overallScore != null) parts.push(`Revenue Risk: ${fa.revenueRisk.overallScore}/100`);
    if (fa.competitivePricing.competitorsDetected.length > 0) {
      parts.push(`Competitors: ${fa.competitivePricing.competitorsDetected.map((c) => c.competitor).join(", ")}`);
    }
    if (parts.length > 0) lines.push(`Financial: ${parts.join(" | ")}`);
  }

  if (entry.result?.nextSteps?.length) {
    lines.push(`Next Steps: ${entry.result.nextSteps.slice(0, 3).join("; ")}`);
  }
  if (entry.result?.buyingSignals?.length) {
    lines.push(`Buying Signals: ${entry.result.buyingSignals.slice(0, 2).map((b) => b.signal).join("; ")}`);
  }
  if (entry.result?.objections?.length) {
    lines.push(`Objections: ${entry.result.objections.slice(0, 2).map((o) => o.objection).join("; ")}`);
  }

  lines.push(`Excerpt: ${excerpt}`);

  return lines.join("\n");
}

export function filterRelevantHistory(query: string, history: HistoryEntry[]): string {
  if (history.length === 0) {
    return "No customer interaction history available yet.";
  }

  const queryLower = query.toLowerCase();
  const wantsAll =
    queryLower.includes("all ") ||
    queryLower.includes("every ") ||
    queryLower.includes("pipeline") ||
    queryLower.includes("summary") ||
    queryLower.includes("overview") ||
    queryLower.includes("dashboard");

  const limit = wantsAll ? MAX_ENTRIES_ALL : MAX_ENTRIES;

  // Score all entries
  const scored = history.map((entry) => ({
    entry,
    score: scoreEntry(query, entry),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top entries; fallback to 5 most recent if none scored > 0
  let selected = scored.filter((s) => s.score > 0).slice(0, limit);
  if (selected.length === 0) {
    selected = scored.slice(0, 5);
  }

  const summaries = selected.map((s) => formatEntrySummary(s.entry));
  return `=== Sales History (${selected.length} of ${history.length} entries) ===\n\n${summaries.join("\n\n---\n\n")}`;
}
