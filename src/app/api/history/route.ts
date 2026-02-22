import { NextRequest, NextResponse } from "next/server";
import {
  readHistory,
  addHistoryEntry,
  removeHistoryEntry,
  clearAllHistory,
} from "@/lib/history-store";

// GET — return all history entries
export async function GET() {
  const entries = await readHistory();
  return NextResponse.json(entries);
}

// POST — add a new entry
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Basic size guard — reject payloads with excessively large fields
  const raw = JSON.stringify(body);
  if (raw.length > 200_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  if (!body || !body.id) {
    return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
  }
  const entries = await addHistoryEntry(body);
  return NextResponse.json(entries);
}

// DELETE — remove one entry (by id in body) or clear all (body: { clearAll: true })
export async function DELETE(req: NextRequest) {
  const body = await req.json();

  if (body.clearAll) {
    const entries = await clearAllHistory();
    return NextResponse.json(entries);
  }

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const entries = await removeHistoryEntry(body.id);
  return NextResponse.json(entries);
}
