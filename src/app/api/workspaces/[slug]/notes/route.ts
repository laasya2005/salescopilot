import { NextRequest, NextResponse } from "next/server";
import { addNote, updateNote, removeNote } from "@/lib/workspace-store";
import type { WorkspaceNote } from "@/lib/types";

// POST — create a note
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const now = Date.now();
    const note: WorkspaceNote = {
      id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`,
      content: body.content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const ws = await addNote(slug, note);
    return NextResponse.json(ws);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

// PUT — edit a note
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.noteId) {
      return NextResponse.json({ error: "noteId required" }, { status: 400 });
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const ws = await updateNote(slug, body.noteId, body.content.trim());
    return NextResponse.json(ws);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

// DELETE — remove a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.noteId) {
      return NextResponse.json({ error: "noteId required" }, { status: 400 });
    }

    const ws = await removeNote(slug, body.noteId);
    return NextResponse.json(ws);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
