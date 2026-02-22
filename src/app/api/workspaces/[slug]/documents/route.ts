import { NextRequest, NextResponse } from "next/server";
import {
  addDocumentMeta,
  removeDocumentMeta,
  saveDocumentFile,
  deleteDocumentFile,
  readWorkspace,
} from "@/lib/workspace-store";
import type { WorkspaceDocument } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "txt", "xlsx", "csv", "pptx", "png", "jpg", "jpeg"]);

// POST — upload a file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const ws = await readWorkspace(slug);
    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10 MB limit" },
        { status: 413 }
      );
    }

    const rawExt = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fileName = `${id}.${rawExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await saveDocumentFile(slug, fileName, buffer);

    const doc: WorkspaceDocument = {
      id,
      fileName,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedAt: Date.now(),
    };

    const updated = await addDocumentMeta(slug, doc);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

// DELETE — remove a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.docId) {
      return NextResponse.json({ error: "docId required" }, { status: 400 });
    }

    const ws = await readWorkspace(slug);
    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const doc = ws.documents.find((d) => d.id === body.docId);
    if (doc) {
      await deleteDocumentFile(slug, doc.fileName);
    }

    const updated = await removeDocumentMeta(slug, body.docId);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
