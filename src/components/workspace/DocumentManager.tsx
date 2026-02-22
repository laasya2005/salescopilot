"use client";

import { useRef, useState } from "react";
import type { WorkspaceData, WorkspaceDocument } from "@/lib/types";

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.xlsx,.csv,.pptx,.png,.jpg,.jpeg";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return (
      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

export function DocumentManager({
  documents,
  slug,
  onUpdate,
}: {
  documents: WorkspaceDocument[];
  slug: string;
  onUpdate: (ws: WorkspaceData) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds 10 MB limit");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/workspaces/${slug}/documents`, {
        method: "POST",
        body: form,
      });
      if (res.ok) onUpdate(await res.json());
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  async function handleDelete(docId: string) {
    try {
      const res = await fetch(`/api/workspaces/${slug}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
      if (res.ok) onUpdate(await res.json());
    } catch {
      // Network error
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-slate-700 hover:border-slate-500 bg-slate-900/30"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-slate-400 mb-1">
              Click or drag files here to upload
            </p>
            <p className="text-[11px] text-slate-600">
              PDF, DOCX, TXT, XLSX, CSV, PPTX, PNG, JPG — max 10 MB
            </p>
          </>
        )}
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <div className="text-center py-8">
          <h3 className="text-sm font-medium text-slate-400 mb-1">No documents yet</h3>
          <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
            Upload proposals, contracts, or reference materials for this deal.
          </p>
        </div>
      )}

      {/* Document list */}
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center shrink-0">
              {fileIcon(doc.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {doc.originalName}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatBytes(doc.sizeBytes)} · {relativeTime(doc.uploadedAt)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={`/api/workspaces/${slug}/documents/${doc.id}`}
                download={doc.originalName}
                className="text-slate-500 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 transition-all"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
