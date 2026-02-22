"use client";

import { useState, useRef, useEffect } from "react";
import type { HistoryEntry, ChatMessage, ChatSuggestedQuestion, ExtractedTask } from "@/lib/types";
import { filterRelevantHistory } from "@/lib/chat-context-filter";

const SUGGESTED_QUESTIONS: ChatSuggestedQuestion[] = [
  { label: "Pipeline Summary", question: "Give me a summary of our current pipeline — scores, risk levels, and which deals need attention." },
  { label: "High-Risk Deals", question: "Which deals are at high risk right now and why?" },
  { label: "Recent Activity", question: "What customer interactions happened most recently?" },
  { label: "Top Opportunities", question: "What are our strongest opportunities based on lead scores and buying signals?" },
  { label: "Extract Action Items", question: "Extract all action items and follow-ups from our recent interactions." },
  { label: "Common Objections", question: "What are the most common objections we're hearing across deals?" },
];

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Simple markdown to JSX — handles bold, headers, bullet/numbered lists, separators */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1 my-1.5 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  }

  function inlineFormat(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let last = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      parts.push(<strong key={`b-${match.index}`} className="font-semibold text-white">{match[1]}</strong>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- separator
    if (/^\s*---+\s*$/.test(line)) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="border-slate-700 my-2" />);
      continue;
    }

    // ### Header
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      flushList();
      elements.push(<p key={`h3-${i}`} className="text-xs font-semibold text-indigo-400 mt-2 mb-0.5">{inlineFormat(h3Match[1])}</p>);
      continue;
    }

    // ## Header
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      flushList();
      elements.push(<p key={`h2-${i}`} className="text-sm font-semibold text-white mt-2 mb-0.5">{inlineFormat(h2Match[1])}</p>);
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^\s*[-•*]\s+(.+)/);
    if (bulletMatch) {
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-1.5">
          <span className="text-indigo-400 mt-1 shrink-0">&#8226;</span>
          <span>{inlineFormat(bulletMatch[1])}</span>
        </li>
      );
      continue;
    }

    // Numbered list
    const numberedMatch = line.match(/^\s*(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-1.5">
          <span className="text-indigo-400 font-medium shrink-0">{numberedMatch[1]}.</span>
          <span>{inlineFormat(numberedMatch[2])}</span>
        </li>
      );
      continue;
    }

    // Regular text or blank
    flushList();
    if (line.trim() === "") {
      if (elements.length > 0) elements.push(<div key={`sp-${i}`} className="h-1.5" />);
    } else {
      elements.push(<p key={`p-${i}`} className="my-0.5">{inlineFormat(line)}</p>);
    }
  }
  flushList();

  return <>{elements}</>;
}

function TaskCard({ task }: { task: ExtractedTask }) {
  // Clean bracket placeholders if any slip through
  const cleanOwner = task.owner.replace(/^\[.*\]$/, "Sales Rep");

  return (
    <div className="mt-1.5 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
      <p className="text-xs text-white font-medium mb-1">{task.task}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
        <span>{cleanOwner}</span>
        {task.deadline !== "TBD" && <span className="text-amber-400">{task.deadline}</span>}
        <span className="text-indigo-400">{task.source}</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

export function ChatPanel({
  open,
  onToggle,
  history,
}: {
  open: boolean;
  onToggle: () => void;
  history: HistoryEntry[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: question.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const context = filterRelevantHistory(question, history);

      const conversationHistory = [...messages, userMessage].slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          context,
          conversationHistory: conversationHistory.slice(0, -1),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: "assistant",
        content: data.answer,
        timestamp: Date.now(),
        tasks: data.tasks,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const showSuggestions = messages.length === 0;

  return (
    <>
      {/* Floating Action Button — bottom right */}
      <button
        onClick={onToggle}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className={`fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-lg shadow-accent-400/25 flex items-center justify-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          open
            ? "bg-slate-800 border border-slate-600 rotate-0 scale-90"
            : "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 hover:shadow-accent-400/40 hover:scale-105"
        }`}
      >
        {open ? (
          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window — bottom right, above the FAB */}
      <div
        role="complementary"
        aria-label="AI Sales Assistant"
        className={`fixed bottom-24 right-6 z-20 w-[calc(100vw-3rem)] sm:w-[400px] h-[520px] max-h-[calc(100vh-8rem)] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-slate-200">AI Sales Assistant</h2>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(""); }}
                aria-label="Clear chat"
                title="Clear chat"
                className="text-slate-500 hover:text-white transition-colors rounded p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onToggle}
              aria-label="Close panel"
              className="text-slate-500 hover:text-white transition-colors rounded p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Welcome state */}
          {showSuggestions && (
            <div className="text-center py-6">
              <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-300 mb-1">AI Sales Assistant</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-[260px] mx-auto">
                Ask about customers, search interactions, extract action items, or get pipeline insights.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {SUGGESTED_QUESTIONS.map((sq) => (
                  <button
                    key={sq.label}
                    onClick={() => sendMessage(sq.question)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-slate-800/70 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    {sq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-800/70 text-slate-200 border border-slate-700 rounded-bl-sm"
                }`}
              >
                <div className="break-words text-sm leading-relaxed">
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
                {msg.tasks && msg.tasks.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.tasks.map((task, i) => (
                      <TaskCard key={i} task={task} />
                    ))}
                  </div>
                )}
                <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-indigo-300/60" : "text-slate-500"}`}>
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/70 border border-slate-700 rounded-xl rounded-bl-sm px-3 py-2">
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex justify-center">
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-slate-800 px-4 py-3 bg-slate-950">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your customers..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
