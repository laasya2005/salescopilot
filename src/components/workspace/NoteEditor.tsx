"use client";

import { useState } from "react";
import type { WorkspaceData, WorkspaceNote } from "@/lib/types";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function NoteEditor({
  notes,
  slug,
  onUpdate,
}: {
  notes: WorkspaceNote[];
  slug: string;
  onUpdate: (ws: WorkspaceData) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  async function handleAdd() {
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/workspaces/${slug}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim() }),
      });
      if (res.ok) {
        onUpdate(await res.json());
        setNewContent("");
        setShowAdd(false);
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(noteId: string) {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/workspaces/${slug}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, content: editContent.trim() }),
      });
      if (res.ok) {
        onUpdate(await res.json());
        setEditingId(null);
        setEditContent("");
      }
    } catch {
      // Network error
    }
  }

  async function handleDelete(noteId: string) {
    try {
      const res = await fetch(`/api/workspaces/${slug}/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch {
      // Network error
    }
  }

  const sorted = [...notes].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-4">
      {/* Add note */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-4 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Note
        </button>
      ) : (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write a note..."
            rows={4}
            autoFocus
            className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all resize-y"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                setShowAdd(false);
                setNewContent("");
              }}
              className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newContent.trim() || adding}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sorted.length === 0 && !showAdd && (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">No notes yet</h3>
          <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
            Add notes to keep track of key information about this deal.
          </p>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-3">
        {sorted.map((note) =>
          editingId === note.id ? (
            <div
              key={note.id}
              className="bg-slate-900/50 rounded-xl border border-indigo-500/30 p-4 space-y-3"
            >
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                autoFocus
                className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all resize-y"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setEditingId(null)}
                  className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveEdit(note.id)}
                  disabled={!editContent.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              key={note.id}
              className="group bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-all"
            >
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/50">
                <span className="text-[11px] text-slate-500">
                  {relativeTime(note.updatedAt)}
                  {note.updatedAt !== note.createdAt && " (edited)"}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(note.id);
                      setEditContent(note.content);
                    }}
                    className="text-slate-500 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
