import type { EventFormData } from "./types";

export function eventFormToTranscript(data: EventFormData): string {
  const sections: string[] = [];

  sections.push("=== EVENT CONVERSATION BRIEFING ===");
  sections.push("");

  // Contact info
  if (data.prospectName || data.prospectTitle) {
    const name = data.prospectName || "Unknown";
    const title = data.prospectTitle ? ` (${data.prospectTitle})` : "";
    sections.push(`PROSPECT: ${name}${title}`);
  }
  sections.push(`COMPANY: ${data.companyName}`);
  if (data.eventName) {
    sections.push(`EVENT: ${data.eventName}`);
  }
  sections.push("");

  // Pain point
  if (data.painPoint) {
    sections.push("PAIN POINT / NEED DESCRIBED:");
    sections.push(data.painPoint);
    sections.push("");
  }

  // BANT qualifiers
  sections.push("QUALIFYING INFORMATION:");

  if (data.budget) {
    let budgetLine = `- Budget Available: ${data.budget}`;
    if (data.budgetNotes) budgetLine += ` — ${data.budgetNotes}`;
    sections.push(budgetLine);
  }

  if (data.decisionMaker) {
    let dmLine = `- Decision Maker: ${data.decisionMaker}`;
    if (data.decisionMaker === "Someone Else" && data.decisionMakerName) {
      dmLine += ` (${data.decisionMakerName})`;
    }
    sections.push(dmLine);
  }

  if (data.timeline) {
    sections.push(`- Timeline: ${data.timeline}`);
  }

  if (data.interestLevel) {
    sections.push(`- Interest/Energy Level: ${data.interestLevel}`);
  }

  sections.push("");

  // Competitors
  if (data.competitorsMentioned) {
    sections.push("COMPETITORS MENTIONED:");
    sections.push(data.competitorsMentioned);
    sections.push("");
  }

  // Next steps
  if (data.nextStepsDiscussed) {
    sections.push("NEXT STEPS DISCUSSED:");
    sections.push(data.nextStepsDiscussed);
    sections.push("");
  }

  // Notable quotes
  if (data.notableQuotes) {
    sections.push("NOTABLE QUOTES:");
    sections.push(data.notableQuotes);
    sections.push("");
  }

  // Additional notes
  if (data.additionalNotes) {
    sections.push("ADDITIONAL NOTES:");
    sections.push(data.additionalNotes);
    sections.push("");
  }

  sections.push("=== END BRIEFING ===");

  return sections.join("\n");
}

export function countFilledFields(data: EventFormData): { filled: number; total: number } {
  const total = 13;
  let filled = 0;

  if (data.prospectName) filled++;
  if (data.prospectTitle) filled++;
  if (data.companyName) filled++;
  if (data.eventName) filled++;
  if (data.painPoint) filled++;
  if (data.budget) filled++;
  if (data.budgetNotes) filled++;
  if (data.decisionMaker) filled++;
  if (data.timeline) filled++;
  if (data.competitorsMentioned) filled++;
  if (data.interestLevel) filled++;
  if (data.nextStepsDiscussed) filled++;
  if (data.notableQuotes) filled++;
  // additionalNotes not counted as a core field

  return { filled: Math.min(filled, total), total };
}

export function getCompletenessLabel(filled: number): string {
  if (filled <= 3) return "Minimal — add more for better analysis";
  if (filled <= 6) return "Fair — keep going";
  if (filled <= 9) return "Good for analysis";
  return "Excellent — comprehensive data";
}
