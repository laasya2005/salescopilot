import { NextRequest, NextResponse } from "next/server";
import { getOrCreateWorkspace, readWorkspace, writeWorkspace } from "@/lib/workspace-store";
import crypto from "crypto";
import { readHistory } from "@/lib/history-store";
import { companySlug } from "@/lib/slug";
import type { WorkspaceTask } from "@/lib/types";

// GET — return workspace + interactions from history
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const workspace = await readWorkspace(slug);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const history = await readHistory();
    const interactions = history.filter(
      (e) => companySlug(e.companyName) === slug
    );

    return NextResponse.json({ workspace, interactions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

// POST — create or get workspace, auto-import AI tasks from history
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.companyName) {
      return NextResponse.json({ error: "companyName required" }, { status: 400 });
    }

    const workspace = await getOrCreateWorkspace(slug, body.companyName);

    // Auto-import nextSteps from history as AI tasks (deduped)
    const history = await readHistory();
    const interactions = history.filter(
      (e) => companySlug(e.companyName) === slug
    );

    const existingTexts = new Set(workspace.tasks.map((t) => t.text));
    let added = false;

    for (const entry of interactions) {
      for (const step of entry.result?.nextSteps || []) {
        if (!existingTexts.has(step)) {
          existingTexts.add(step);
          const task: WorkspaceTask = {
            id: `ai-${crypto.randomUUID()}`,
            text: step,
            status: "pending",
            priority: "medium",
            dueDate: null,
            createdAt: entry.timestamp,
            completedAt: null,
            source: "ai",
            sourceEntryId: entry.id,
          };
          workspace.tasks.push(task);
          added = true;
        }
      }
    }

    if (added) {
      await writeWorkspace(slug, workspace);
    }

    return NextResponse.json({ workspace, interactions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
