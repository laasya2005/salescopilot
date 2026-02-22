import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { readWorkspace, getDocumentFilePath } from "@/lib/workspace-store";

// GET — download a document
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; docId: string }> }
) {
  try {
    const { slug, docId } = await params;

    const ws = await readWorkspace(slug);
    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const doc = ws.documents.find((d) => d.id === docId);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const filePath = getDocumentFilePath(slug, doc.fileName);
    const buffer = await fs.readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
