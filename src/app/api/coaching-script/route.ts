import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { CoachingScript } from "@/lib/types";

function validateCoachingScript(data: unknown): data is CoachingScript {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.script !== "string" || obj.script.length < 100) return false;
  if (!obj.sections || typeof obj.sections !== "object") return false;

  const sections = obj.sections as Record<string, unknown>;
  if (typeof sections.greeting !== "string") return false;
  if (!Array.isArray(sections.strengths)) return false;
  if (!Array.isArray(sections.improvements)) return false;
  if (!Array.isArray(sections.missedQuestions)) return false;
  if (!Array.isArray(sections.nextCallQuestions)) return false;
  if (typeof sections.closing !== "string") return false;

  return true;
}

const MAX_TRANSCRIPT_LENGTH = 50_000;
const MAX_COMPANY_NAME_LENGTH = 200;

function sanitizeAnalysisResult(raw: unknown): {
  leadScore: number;
  worthChasing: boolean;
  dealRisk: string;
  closeForecast: number;
  coachingSummary: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.leadScore !== "number") return null;
  if (typeof obj.worthChasing !== "boolean") return null;
  if (typeof obj.dealRisk !== "string") return null;
  if (typeof obj.closeForecast !== "number") return null;
  if (typeof obj.coachingSummary !== "string") return null;
  return {
    leadScore: Math.min(100, Math.max(0, obj.leadScore)),
    worthChasing: obj.worthChasing,
    dealRisk: String(obj.dealRisk).slice(0, 20),
    closeForecast: Math.min(100, Math.max(0, obj.closeForecast)),
    coachingSummary: String(obj.coachingSummary).slice(0, 1000),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, companyName, dealStage, source, analysisResult } =
      await req.json();

    if (!transcript || !companyName) {
      return NextResponse.json(
        { error: "Transcript and company name are required." },
        { status: 400 }
      );
    }

    // Input length limits (match analyze route)
    if (typeof transcript !== "string" || transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        { error: `Transcript exceeds maximum length of ${MAX_TRANSCRIPT_LENGTH} characters.` },
        { status: 413 }
      );
    }
    if (typeof companyName !== "string" || companyName.length > MAX_COMPANY_NAME_LENGTH) {
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

    const sourceLabel =
      source === "email-thread"
        ? "email exchange"
        : source === "event-form"
        ? "event conversation"
        : "sales call";

    const sanitized = sanitizeAnalysisResult(analysisResult);
    const analysisContext = sanitized
      ? `\n\nANALYSIS RESULTS (for context):
- Lead Score: ${sanitized.leadScore}/100
- Worth Chasing: ${sanitized.worthChasing ? "Yes" : "No"}
- Deal Risk: ${sanitized.dealRisk}
- Close Forecast: ${sanitized.closeForecast}%
- Coaching Summary: ${sanitized.coachingSummary}`
      : "";

    const prompt = `You are a veteran B2B sales manager with 20+ years of experience. You just reviewed a rep's ${sourceLabel} with ${companyName}${dealStage ? ` (${dealStage} stage)` : ""}. Give them a coaching debrief.

${sourceLabel === "email exchange" ? "EMAIL THREAD" : sourceLabel === "event conversation" ? "EVENT NOTES" : "TRANSCRIPT"}:
"""
${transcript}
"""${analysisContext}

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "script": "<300-500 word conversational coaching monologue meant to be spoken aloud. No bullet points. Use a warm, direct tone like you're talking to the rep over coffee. Start with something like 'Hey, nice work on that ${sourceLabel} with ${companyName}...' Address strengths, areas to improve, and especially the questions they should be asking. End with encouragement.>",
  "sections": {
    "greeting": "<1-2 sentence warm opener>",
    "strengths": ["<specific thing done well with evidence from the conversation>", "<another strength>"],
    "improvements": ["<specific area to work on, tied to what actually happened>", "<another improvement>"],
    "missedQuestions": [
      { "question": "<question they SHOULD have asked>", "why": "<why this question matters for this specific deal>" }
    ],
    "nextCallQuestions": [
      { "question": "<forward-looking question for the next touchpoint>", "why": "<why this will advance the deal>" }
    ],
    "closing": "<1-2 sentence encouraging closer>"
  }
}

Guidelines:
- strengths: 2-3 specific things done well, with evidence from the conversation
- improvements: 2-3 areas to work on, tied to what actually happened
- missedQuestions: 3-5 questions they SHOULD have asked, each with WHY — this is the most important section. Focus on uncovering budget, authority, need, timeline, competitive landscape, or decision process.
- nextCallQuestions: 3-5 forward-looking questions for the next touchpoint
- script: 300-500 words, conversational monologue (no bullet points — this will be spoken aloud as audio coaching)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a veteran B2B sales coach. Always respond with valid JSON only, no markdown or code fences.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    const cleaned = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    if (!validateCoachingScript(parsed)) {
      return NextResponse.json(
        { error: "AI response is missing required fields. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Coaching script error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate coaching script";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
