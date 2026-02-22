import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ExtractedTask } from "@/lib/types";

const MAX_QUESTION_LENGTH = 2_000;
const MAX_CONTEXT_LENGTH = 30_000;
const MAX_CONVERSATION_MESSAGES = 20;
const MAX_MESSAGE_CONTENT_LENGTH = 5_000;

const SYSTEM_PROMPT = `You are an AI Sales Assistant with access to the team's customer interaction history. Your role is to help the sales team by answering questions about companies, prospects, deals, summarizing interactions, finding patterns, and extracting action items.

When extracting tasks or action items, format each one on its own line using this exact format:
TASK: description here | OWNER: Sales Rep | DEADLINE: the date or TBD | SOURCE: company name

For OWNER, use the actual rep name from the transcript if available, otherwise use "Sales Rep". For DEADLINE, use specific dates from the data when mentioned, otherwise "TBD".

Rules:
- Be concise, direct, and specific. Get straight to the point.
- NEVER use square brackets like [Your Name], [Your Team], [Date], etc. Always use real values or omit.
- NEVER generate template emails or template content unless explicitly asked.
- When referencing data, use the actual company name and specific details.
- If the history doesn't have enough info, say so clearly.
- Keep responses short — use bullet points, not long paragraphs.
- Do not add separators like --- between sections. Just use headings and bullet points.
- Format monetary values with $ and appropriate notation.`;

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

    const rawAnswer = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    const tasks = extractTasks(rawAnswer);

    // Strip TASK lines and --- separators from the displayed text (tasks render as cards)
    const answer = tasks.length > 0
      ? rawAnswer
          .replace(/^TASK:\s*.+$/gm, "")
          .replace(/^---+$/gm, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      : rawAnswer;

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
