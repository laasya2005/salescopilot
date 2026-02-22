import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ExtractedTask } from "@/lib/types";

const MAX_QUESTION_LENGTH = 2_000;
const MAX_CONTEXT_LENGTH = 30_000;
const MAX_CONVERSATION_MESSAGES = 20;
const MAX_MESSAGE_CONTENT_LENGTH = 5_000;

const SYSTEM_PROMPT = `You are an AI Sales Assistant with access to the team's customer interaction history. Your role is to help the sales team by:

1. **Remember** — Answer questions about companies, prospects, and deals from the provided history data.
2. **Recall** — Summarize past conversations, emails, and events for any account.
3. **Search** — Find customers matching specific criteria (product interest, deal stage, objections, buying signals).
4. **Show history** — Present complete interaction timelines for accounts.
5. **Extract commitments** — Identify and format action items, follow-ups, and commitments from interactions.
6. **Aggregate** — Summarize pipeline health, common objections, win/loss trends, and other patterns across all data.

When extracting tasks or action items, format each one on its own line using this exact format:
TASK: [description] | OWNER: [who is responsible] | DEADLINE: [when, or "TBD"] | SOURCE: [company name]

Guidelines:
- Be concise and actionable in your responses.
- When referencing data, cite the company name and interaction date.
- If the history data doesn't contain enough information to answer, say so clearly rather than guessing.
- When asked about pipeline or summaries, organize information clearly with company names, scores, and risk levels.
- Format monetary values with $ and appropriate notation.
- Use markdown formatting for readability (bold, lists, etc.).`;

function extractTasks(text: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const regex = /TASK:\s*(.+?)\s*\|\s*OWNER:\s*(.+?)\s*\|\s*DEADLINE:\s*(.+?)\s*\|\s*SOURCE:\s*(.+?)$/gm;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tasks.push({
      task: match[1].trim(),
      owner: match[2].trim(),
      deadline: match[3].trim(),
      source: match[4].trim(),
    });
  }
  return tasks;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context, conversationHistory } = body;

    // Validate question
    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Validate context
    const safeContext = typeof context === "string" ? context.slice(0, MAX_CONTEXT_LENGTH) : "";

    // Validate and cap conversation history
    const safeHistory: { role: "user" | "assistant"; content: string }[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-MAX_CONVERSATION_MESSAGES)) {
        if (
          msg &&
          typeof msg.role === "string" &&
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string"
        ) {
          safeHistory.push({
            role: msg.role,
            content: msg.content.slice(0, MAX_MESSAGE_CONTENT_LENGTH),
          });
        }
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Build messages array
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add context as first user context message if available
    if (safeContext) {
      messages.push({
        role: "user",
        content: `Here is the relevant customer interaction history for context:\n\n${safeContext}`,
      });
      messages.push({
        role: "assistant",
        content: "I've reviewed the customer interaction history. How can I help you?",
      });
    }

    // Add conversation history
    for (const msg of safeHistory) {
      messages.push(msg);
    }

    // Add current question
    messages.push({ role: "user", content: question });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
    });

    const answer = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    const tasks = extractTasks(answer);

    return NextResponse.json({
      answer,
      ...(tasks.length > 0 ? { tasks } : {}),
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process chat request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
