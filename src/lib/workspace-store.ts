import fs from "fs/promises";
import path from "path";
import type {
  WorkspaceData,
  WorkspaceTask,
  WorkspaceNote,
  WorkspaceDocument,
} from "./types";

const IS_VERCEL = !!process.env.VERCEL;
const WORKSPACES_DIR = IS_VERCEL
  ? "/tmp/data/workspaces"
  : path.join(process.cwd(), "data", "workspaces");

const SAFE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TASKS = 500;
const MAX_NOTES = 200;
const MAX_DOCUMENTS = 100;

function assertSafeSlug(slug: string): void {
  if (!SAFE_SLUG_RE.test(slug) || slug.length > 200) {
    throw new Error("Invalid slug");
  }
}

function workspaceFile(slug: string) {
  assertSafeSlug(slug);
  return path.join(WORKSPACES_DIR, `${slug}.json`);
}

function filesDir(slug: string) {
  assertSafeSlug(slug);
  return path.join(WORKSPACES_DIR, slug);
}

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/* ── Read / Write ── */

export async function readWorkspace(
  slug: string
): Promise<WorkspaceData | null> {
  await ensureDir(WORKSPACES_DIR);
  try {
    const raw = await fs.readFile(workspaceFile(slug), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeWorkspace(
  slug: string,
  data: WorkspaceData
): Promise<void> {
  await ensureDir(WORKSPACES_DIR);
  data.updatedAt = Date.now();
  await fs.writeFile(workspaceFile(slug), JSON.stringify(data, null, 2), "utf-8");
}

export async function getOrCreateWorkspace(
  slug: string,
  companyName: string
): Promise<WorkspaceData> {
  const existing = await readWorkspace(slug);
  if (existing) return existing;

  const now = Date.now();
  const workspace: WorkspaceData = {
    slug,
    companyName,
    createdAt: now,
    updatedAt: now,
    tasks: [],
    notes: [],
    documents: [],
  };
  await writeWorkspace(slug, workspace);
  return workspace;
}

/* ── Tasks ── */

export async function addTask(
  slug: string,
  task: WorkspaceTask
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  if (ws.tasks.length >= MAX_TASKS) throw new Error("Task limit reached");
  ws.tasks.unshift(task);
  await writeWorkspace(slug, ws);
  return ws;
}

export async function updateTask(
  slug: string,
  taskId: string,
  updates: Partial<Pick<WorkspaceTask, "text" | "status" | "dueDate" | "priority">>
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  const task = ws.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");
  if (updates.text !== undefined) task.text = updates.text;
  if (updates.status !== undefined) {
    task.status = updates.status;
    task.completedAt = updates.status === "completed" ? Date.now() : null;
  }
  if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
  if (updates.priority !== undefined) task.priority = updates.priority;
  await writeWorkspace(slug, ws);
  return ws;
}

export async function removeTask(
  slug: string,
  taskId: string
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  ws.tasks = ws.tasks.filter((t) => t.id !== taskId);
  await writeWorkspace(slug, ws);
  return ws;
}

/* ── Notes ── */

export async function addNote(
  slug: string,
  note: WorkspaceNote
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  if (ws.notes.length >= MAX_NOTES) throw new Error("Note limit reached");
  ws.notes.unshift(note);
  await writeWorkspace(slug, ws);
  return ws;
}

export async function updateNote(
  slug: string,
  noteId: string,
  content: string
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  const note = ws.notes.find((n) => n.id === noteId);
  if (!note) throw new Error("Note not found");
  note.content = content;
  note.updatedAt = Date.now();
  await writeWorkspace(slug, ws);
  return ws;
}

export async function removeNote(
  slug: string,
  noteId: string
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  ws.notes = ws.notes.filter((n) => n.id !== noteId);
  await writeWorkspace(slug, ws);
  return ws;
}

/* ── Documents (metadata) ── */

export async function addDocumentMeta(
  slug: string,
  doc: WorkspaceDocument
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  if (ws.documents.length >= MAX_DOCUMENTS) throw new Error("Document limit reached");
  ws.documents.unshift(doc);
  await writeWorkspace(slug, ws);
  return ws;
}

export async function removeDocumentMeta(
  slug: string,
  docId: string
): Promise<WorkspaceData> {
  const ws = await readWorkspace(slug);
  if (!ws) throw new Error("Workspace not found");
  ws.documents = ws.documents.filter((d) => d.id !== docId);
  await writeWorkspace(slug, ws);
  return ws;
}

/* ── Documents (files) ── */

export async function saveDocumentFile(
  slug: string,
  fileName: string,
  buffer: Buffer
): Promise<void> {
  const dir = filesDir(slug);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, fileName), buffer);
}

export function getDocumentFilePath(slug: string, fileName: string): string {
  return path.join(filesDir(slug), fileName);
}

export async function deleteDocumentFile(
  slug: string,
  fileName: string
): Promise<void> {
  try {
    await fs.unlink(path.join(filesDir(slug), fileName));
  } catch {
    // File already gone — ignore
  }
}
