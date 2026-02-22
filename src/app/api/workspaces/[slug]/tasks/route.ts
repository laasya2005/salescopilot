import { NextRequest, NextResponse } from "next/server";
import { addTask, updateTask, removeTask } from "@/lib/workspace-store";
import type { WorkspaceTask, TaskPriority } from "@/lib/types";

const VALID_PRIORITIES = new Set<TaskPriority>(["low", "medium", "high"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validPriority(v: unknown): TaskPriority {
  return VALID_PRIORITIES.has(v as TaskPriority) ? (v as TaskPriority) : "medium";
}

function validDate(v: unknown): string | null {
  if (typeof v !== "string" || !DATE_RE.test(v)) return null;
  const d = new Date(v + "T00:00:00");
  return isNaN(d.getTime()) ? null : v;
}

// POST — create a new task
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const task: WorkspaceTask = {
      id: `task-${crypto.randomUUID()}`,
      text: body.text.trim(),
      status: "pending",
      priority: validPriority(body.priority),
      dueDate: validDate(body.dueDate),
      createdAt: Date.now(),
      completedAt: null,
      source: "manual",
    };

    const ws = await addTask(slug, task);
    return NextResponse.json(ws);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

// PUT — update a task
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    const ws = await updateTask(slug, body.taskId, body.updates || {});
    return NextResponse.json(ws);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

// DELETE — remove a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    const ws = await removeTask(slug, body.taskId);
    return NextResponse.json(ws);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
