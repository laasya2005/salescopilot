"use client";

import { useState } from "react";
import type { WorkspaceData, WorkspaceTask, TaskPriority } from "@/lib/types";
import { DueDateBadge } from "./DueDateBadge";

function sortTasks(tasks: WorkspaceTask[]): WorkspaceTask[] {
  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");

  pending.sort((a, b) => {
    // Overdue first
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const aOverdue = a.dueDate ? new Date(a.dueDate + "T00:00:00") < now : false;
    const bOverdue = b.dueDate ? new Date(b.dueDate + "T00:00:00") < now : false;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then by due date ascending
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    return b.createdAt - a.createdAt;
  });

  completed.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  return [...pending, ...completed];
}

const priorityDots: Record<TaskPriority, string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

export function TaskList({
  tasks,
  slug,
  onUpdate,
}: {
  tasks: WorkspaceTask[];
  slug: string;
  onUpdate: (ws: WorkspaceData) => void;
}) {
  const [newText, setNewText] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newText.trim(),
          dueDate: newDate || null,
          priority: newPriority,
        }),
      });
      if (res.ok) {
        const ws = await res.json();
        onUpdate(ws);
        setNewText("");
        setNewDate("");
        setNewPriority("medium");
      }
    } finally {
      setAdding(false);
    }
  }

  async function toggleStatus(task: WorkspaceTask) {
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          updates: {
            status: task.status === "pending" ? "completed" : "pending",
          },
        }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch {
      // Network error — silently ignore, state unchanged
    }
  }

  async function deleteTask(taskId: string) {
    try {
      const res = await fetch(`/api/workspaces/${slug}/tasks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch {
      // Network error
    }
  }

  const sorted = sortTasks(tasks);

  return (
    <div className="space-y-4">
      {/* Add task form */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder="Add a new task..."
            className="flex-1 bg-slate-950/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-slate-950/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all [color-scheme:dark]"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              className="bg-slate-950/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
            >
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!newText.trim() || adding}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">No tasks yet</h3>
          <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
            Add tasks manually above or analyze interactions to auto-import AI-suggested next steps.
          </p>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {sorted.map((task) => (
          <div
            key={task.id}
            className={`group relative flex items-start gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5 transition-all duration-150 hover:border-slate-700 ${
              task.status === "completed" ? "opacity-60" : ""
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleStatus(task)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                task.status === "completed"
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                  : "border-slate-600 hover:border-indigo-400"
              }`}
            >
              {task.status === "completed" && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  task.status === "completed"
                    ? "text-slate-500 line-through"
                    : "text-white"
                }`}
              >
                {task.text}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {/* Priority dot */}
                <span className={`w-2 h-2 rounded-full ${priorityDots[task.priority]}`} title={task.priority} />

                {/* Due date badge */}
                <DueDateBadge dueDate={task.dueDate} status={task.status} />

                {/* Source badge */}
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    task.source === "ai"
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  {task.source === "ai" ? "AI" : "Manual"}
                </span>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={() => deleteTask(task.id)}
              className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-red-500/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
