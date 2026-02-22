import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const MAX_TRANSCRIPT_LENGTH = 50_000; // ~50k chars

function validateAnalysisResult(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;

  // Required fields with expected types
  if (typeof obj.leadScore !== "number" || obj.leadScore < 0 || obj.leadScore > 100) return false;
  if (typeof obj.leadScoreReasoning !== "string") return false;
  if (typeof obj.worthChasing !== "boolean") return false;
  if (typeof obj.worthChasingReasoning !== "string") return false;
  if (!["Low", "Medium", "High"].includes(obj.dealRisk as string)) return false;
  if (typeof obj.dealRiskReasoning !== "string") return false;
  if (typeof obj.closeForecast !== "number" || obj.closeForecast < 0 || obj.closeForecast > 100) return false;
  if (typeof obj.closeForecastReasoning !== "string") return false;
  if (!Array.isArray(obj.buyingSignals)) return false;
  if (!Array.isArray(obj.objections)) return false;
  if (!Array.isArray(obj.nextSteps)) return false;
  if (typeof obj.followUpEmail !== "string") return false;
  if (typeof obj.coachingSummary !== "string") return false;
  if (obj.suggestedQuestions !== undefined && !Array.isArray(obj.suggestedQuestions)) return false;

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, companyName, dealStage, dealAmount, source } = await req.json();

    if (!transcript || !companyName || !dealStage) {
      return NextResponse.json(
        { error: "Transcript, company name, and deal stage are required." },
        { status: 400 }
      );
    }

    // Input length limits
    if (typeof transcript !== "string" || transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        { error: `Transcript exceeds maximum length of ${MAX_TRANSCRIPT_LENGTH} characters.` },
        { status: 413 }
      );
    }
    if (typeof companyName !== "string" || companyName.length > 200) {
      return NextResponse.json(
        { error: "Company name is too long." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const isEventForm = source === "event-form";
    const isEmailThread = source === "email-thread";

    let preamble: string;
    let evidenceGuideline: string;
    let inputLabel: string;
    let interactionWord: string;

    if (isEmailThread) {
      preamble = `You are an expert B2B sales analyst. You are analyzing an email thread between a sales rep and a prospect — NOT a live meeting transcript. Adapt your analysis for asynchronous email communication:
- Pay attention to response times, email length, tone shifts, and engagement level across replies.
- Look for buying signals in the prospect's language: asking about pricing, requesting demos, looping in colleagues, responding quickly, asking detailed questions.
- Look for objections or risk signals: slow replies, short/dismissive responses, mentioning competitors, pushing back on timelines, going silent.
- The follow-up email should be a natural next reply in the thread, matching the tone and context.
- Coaching should focus on the rep's email communication: subject lines, personalization, clarity, CTAs, follow-up timing.`;
      evidenceGuideline = `- buyingSignals: Look for prospect asking about pricing/features, quick replies, looping in decision makers, requesting next steps, expressing urgency or pain.
- objections: Look for delayed responses, short dismissive replies, mentioning competitors, budget pushback, "we'll get back to you" language, ghosting signs.
- For "evidence" fields: quote the relevant line from the email thread.`;
      inputLabel = "EMAIL THREAD:";
      interactionWord = "email exchange";
    } else if (isEventForm) {
      preamble = `You are an expert B2B sales analyst. You are analyzing structured notes from a brief event/conference conversation — NOT a full meeting transcript. The rep captured qualifying information (BANT-style) from a quick conversation. Adapt your analysis accordingly:
- Evidence fields should reference the notes provided rather than exact quotes (since there is no verbatim transcript).
- Scores may have wider uncertainty given limited data — note this in your reasoning.
- Focus on the qualifying signals available: budget, authority, need, and timeline indicators.
- Still provide actionable next steps and a follow-up email appropriate for a post-event outreach.`;
      evidenceGuideline = `- buyingSignals: Look for budget confirmation, decision-maker access, timeline urgency, expressed pain points, interest level.
- objections: Look for budget concerns, unclear authority, long timelines, competitor preferences, low interest.
- For "evidence" fields: summarize the relevant note or data point (do NOT fabricate quotes).`;
      inputLabel = "EVENT NOTES:";
      interactionWord = "conversation";
    } else {
      preamble = `You are an expert B2B sales analyst. Analyze the following sales meeting transcript and provide a comprehensive assessment.`;
      evidenceGuideline = `- buyingSignals: Look for urgency, budget discussions, timeline mentions, stakeholder involvement, positive sentiment.
- objections: Look for pricing concerns, competitor comparisons, timeline delays, lack of authority.`;
      inputLabel = "TRANSCRIPT:";
      interactionWord = "call";
    }

    const evidenceInstruction = isEventForm
      ? "summary of the relevant note"
      : "exact quote or line from the " + (isEmailThread ? "email thread" : "transcript");

    const prompt = `${preamble}

Company: ${companyName}
Deal Stage: ${dealStage}
${dealAmount ? `Deal Amount: $${dealAmount}` : "Deal Amount: Not specified"}

${inputLabel}
"""
${transcript}
"""

Respond ONLY with valid JSON in the following exact format (no markdown, no code fences):
{
  "leadScore": <number 0-100>,
  "leadScoreReasoning": "<1-2 sentence explanation>",
  "worthChasing": <true or false>,
  "worthChasingReasoning": "<1-2 sentence explanation>",
  "dealRisk": "<Low | Medium | High>",
  "dealRiskReasoning": "<1-2 sentence explanation>",
  "closeForecast": <number 0-100>,
  "closeForecastReasoning": "<1-2 sentence explanation>",
  "buyingSignals": [
    {
      "signal": "<description of the buying signal>",
      "evidence": "<${evidenceInstruction}>"
    }
  ],
  "objections": [
    {
      "objection": "<description of the objection>",
      "evidence": "<${evidenceInstruction}>"
    }
  ],
  "nextSteps": [
    "<actionable next step>"
  ],
  "followUpEmail": "<a professional follow-up email draft>",
  "coachingSummary": "<a 3-5 sentence coaching summary for the sales rep, highlighting what they did well and what they could improve>",
  "suggestedQuestions": [
    { "question": "<specific question the rep should ask>", "reason": "<why this matters>" }
  ]
}

Guidelines:
- leadScore: 0 = dead lead, 100 = guaranteed close. Consider engagement level, budget authority, timeline, and fit.
- dealRisk: Based on objections, competitor mentions, vague commitments, missing decision makers.
- closeForecast: Probability of closing this deal based on all available signals.
${evidenceGuideline}
- nextSteps: 3-5 specific, actionable steps with clear owners where possible.
- followUpEmail: Professional, references specific discussion points, includes clear CTA.
- coachingSummary: Constructive feedback on the sales rep's performance in this ${interactionWord}.
- suggestedQuestions: 3-5 discovery questions the rep should have asked or should ask next. Focus on uncovering budget, authority, need, timeline, or competitive landscape. Each "reason" explains why that question matters for THIS specific deal.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a sales intelligence AI. Always respond with valid JSON only, no markdown or code fences.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Parse the JSON from the response, stripping any markdown fences
    const cleaned = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let analysis: unknown;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Validate the response has the expected shape
    if (!validateAnalysisResult(analysis)) {
      return NextResponse.json(
        { error: "AI response is missing required fields. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze transcript";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
