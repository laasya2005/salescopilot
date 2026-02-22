import fs from "fs/promises";
import path from "path";
import type { HistoryEntry } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const MAX_HISTORY_ENTRIES = 100;

async function ensureFile() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(HISTORY_FILE);
  } catch {
    await fs.writeFile(HISTORY_FILE, "[]", "utf-8");
  }
}

export async function readHistory(): Promise<HistoryEntry[]> {
  await ensureFile();
  const raw = await fs.readFile(HISTORY_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeHistory(entries: HistoryEntry[]) {
  await ensureFile();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry[]> {
  const entries = await readHistory();
  entries.unshift(entry);
  // Cap history to prevent unbounded growth
  const capped = entries.slice(0, MAX_HISTORY_ENTRIES);
  await writeHistory(capped);
  return capped;
}

export async function removeHistoryEntry(id: string): Promise<HistoryEntry[]> {
  let entries = await readHistory();
  entries = entries.filter((e) => e.id !== id);
  await writeHistory(entries);
  return entries;
}

export async function clearAllHistory(): Promise<HistoryEntry[]> {
  await writeHistory([]);
  return [];
}
