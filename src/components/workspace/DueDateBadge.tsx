"use client";

import type { TaskStatus } from "@/lib/types";

export function DueDateBadge({
  dueDate,
  status,
}: {
  dueDate: string | null;
  status: TaskStatus;
}) {
  if (!dueDate || status === "completed") return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400">
        {overdue}d overdue
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">
        {diffDays === 0 ? "Due today" : `Due in ${diffDays}d`}
      </span>
    );
  }

  return (
    <span className="text-[11px] text-slate-400">
      {due.toLocaleDateString([], { month: "short", day: "numeric" })}
    </span>
  );
}
