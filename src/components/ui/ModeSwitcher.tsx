"use client";

import { useRef, useCallback } from "react";
import type { InputMode } from "@/lib/types";

const modes: { key: InputMode; label: string; icon: React.ReactNode }[] = [
  {
    key: "transcript",
    label: "Paste Transcript",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "email-thread",
    label: "Email Thread",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "event-form",
    label: "Event Conversation",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "batch",
    label: "Batch Upload",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M8 11h.01M12 11h.01M16 11h.01" />
      </svg>
    ),
  },
];

export function ModeSwitcher({
  activeMode,
  onChange,
}: {
  activeMode: InputMode;
  onChange: (mode: InputMode) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = modes.findIndex((m) => m.key === activeMode);
      let next = idx;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (idx + 1) % modes.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (idx - 1 + modes.length) % modes.length;
      } else {
        return;
      }
      onChange(modes[next].key);
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[next]?.focus();
    },
    [activeMode, onChange]
  );

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Input mode"
      className="flex bg-slate-900/50 rounded-xl border border-slate-800 p-1"
      onKeyDown={handleKeyDown}
    >
      {modes.map((mode) => (
        <button
          key={mode.key}
          role="tab"
          aria-selected={activeMode === mode.key}
          tabIndex={activeMode === mode.key ? 0 : -1}
          onClick={() => onChange(mode.key)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 min-h-[44px] px-4 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            activeMode === mode.key
              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
