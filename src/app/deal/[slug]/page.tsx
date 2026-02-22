"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { WorkspaceData, HistoryEntry } from "@/lib/types";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceTabBar, type WorkspaceTab } from "@/components/workspace/WorkspaceTabBar";
import { InteractionTimeline } from "@/components/workspace/InteractionTimeline";
import { TaskList } from "@/components/workspace/TaskList";
import { NoteEditor } from "@/components/workspace/NoteEditor";
import { DocumentManager } from "@/components/workspace/DocumentManager";

export default function DealRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [interactions, setInteractions] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("timeline");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/workspaces/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          // Workspace doesn't exist yet — create it
          if (res.status === 404) {
            const createRes = await fetch(`/api/workspaces/${slug}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companyName: slug.replace(/-/g, " ") }),
            });
            if (createRes.ok) {
              const data = await createRes.json();
              setWorkspace(data.workspace);
              setInteractions(data.interactions || []);
              return;
            }
          }
          throw new Error("Failed to load workspace");
        }
        const data = await res.json();
        setWorkspace(data.workspace);
        setInteractions(data.interactions || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function handleWorkspaceUpdate(ws: WorkspaceData) {
    setWorkspace(ws);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading deal room...</span>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400 mb-4">{error || "Workspace not found"}</p>
          <Link
            href="/"
            className="text-sm text-indigo-400 hover:text-white transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const openTasks = workspace.tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <WorkspaceHeader
          companyName={workspace.companyName}
          interactions={interactions}
          tasks={workspace.tasks}
        />

        {/* Tabs */}
        <WorkspaceTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          taskCount={openTasks || undefined}
          docCount={workspace.documents.length || undefined}
        />

        {/* Tab content */}
        <div>
          {activeTab === "timeline" && (
            <InteractionTimeline interactions={interactions} />
          )}
          {activeTab === "tasks" && (
            <TaskList
              tasks={workspace.tasks}
              slug={slug}
              onUpdate={handleWorkspaceUpdate}
            />
          )}
          {activeTab === "notes" && (
            <NoteEditor
              notes={workspace.notes}
              slug={slug}
              onUpdate={handleWorkspaceUpdate}
            />
          )}
          {activeTab === "documents" && (
            <DocumentManager
              documents={workspace.documents}
              slug={slug}
              onUpdate={handleWorkspaceUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
