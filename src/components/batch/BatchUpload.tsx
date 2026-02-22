"use client";

import { useState, useRef, useCallback } from "react";
import type { BatchItem } from "@/lib/types";

interface BatchUploadProps {
  items: BatchItem[];
  setItems: (items: BatchItem[]) => void;
  processing: boolean;
  onStartProcessing: () => void;
}

export function BatchUpload({ items, setItems, processing, onStartProcessing }: BatchUploadProps) {
  const [pasteText, setPasteText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(1);

  function createBatchItem(transcript: string): BatchItem {
    const id = `batch-${nextIdRef.current++}-${Date.now()}`;
    const preview = transcript.slice(0, 120).replace(/\n/g, " ").trim();
    return {
      id,
      transcript,
      preview: preview + (transcript.length > 120 ? "..." : ""),
      companyName: "",
      dealStage: "Discovery",
      dealAmount: "",
      status: "pending",
    };
  }

  // Bulk "Set All" values
  const [bulkCompany, setBulkCompany] = useState("");
  const [bulkStage, setBulkStage] = useState("Discovery");
  const [bulkAmount, setBulkAmount] = useState("");

  const addItems = useCallback((newItems: BatchItem[]) => {
    setItems([...items, ...newItems].slice(0, 10));
  }, [items, setItems]);

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<BatchItem>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  // File handling — reads all files then adds them at once
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - items.length;
    const toProcess = Array.from(files).slice(0, remaining).filter((f) => f.name.endsWith(".txt"));

    const results: BatchItem[] = [];
    let loaded = 0;

    if (toProcess.length === 0) return;

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text?.trim()) {
          results.push(createBatchItem(text.trim()));
        }
        loaded++;
        if (loaded === toProcess.length) {
          addItems(results);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // Multi-paste split
  const handleSplitAndAdd = () => {
    if (!pasteText.trim()) return;
    const chunks = pasteText.split(/\n---\n/).map((c) => c.trim()).filter(Boolean);
    const newItems = chunks.map(createBatchItem);
    addItems(newItems);
    setPasteText("");
  };

  // Bulk set all
  const handleSetAll = () => {
    setItems(
      items.map((i) => ({
        ...i,
        companyName: bulkCompany || i.companyName,
        dealStage: bulkStage || i.dealStage,
        dealAmount: bulkAmount || i.dealAmount,
      }))
    );
  };

  const inputClass =
    "w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 text-sm";

  const hasItems = items.length > 0;
  const allHaveCompany = items.every((i) => i.companyName.trim());

  return (
    <div className="space-y-6 mb-8">
      {/* Input Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div
          className={`bg-slate-900/50 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-slate-700 hover:border-slate-500"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label="Upload .txt files"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <svg className="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-slate-300 font-medium">Drop .txt files here</p>
          <p className="text-xs text-slate-500 mt-1">or click to browse (max 10 files)</p>
        </div>

        {/* Multi-paste */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Multi-Paste
          </label>
          <textarea
            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 resize-y min-h-[128px] max-h-[400px] text-sm leading-relaxed"
            placeholder={"Paste multiple transcripts separated by --- on a new line\n\nTranscript 1 text...\n---\nTranscript 2 text...\n---\nTranscript 3 text..."}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button
            onClick={handleSplitAndAdd}
            disabled={!pasteText.trim() || items.length >= 10}
            className="mt-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Split & Add
          </button>
        </div>
      </div>

      {/* Queue */}
      {hasItems && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Queue ({items.length}/10)
            </h3>
          </div>

          {/* Bulk Set All Row — Desktop */}
          <div className="hidden md:grid grid-cols-[1fr_120px_80px_32px_32px] gap-2 mb-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Set All Company</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Company name"
                value={bulkCompany}
                onChange={(e) => setBulkCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Stage</label>
              <select
                className={inputClass}
                value={bulkStage}
                onChange={(e) => setBulkStage(e.target.value)}
              >
                <option value="Discovery">Discovery</option>
                <option value="Demo">Demo</option>
                <option value="Negotiation">Negotiation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Amount</label>
              <input
                type="text"
                inputMode="numeric"
                className={inputClass}
                placeholder="$"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
              />
            </div>
            <button
              onClick={handleSetAll}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Apply
            </button>
            <div />
          </div>

          {/* Bulk Set All Row — Mobile */}
          <div className="md:hidden space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Set All Company</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Company name"
                value={bulkCompany}
                onChange={(e) => setBulkCompany(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Stage</label>
                <select
                  className={inputClass}
                  value={bulkStage}
                  onChange={(e) => setBulkStage(e.target.value)}
                >
                  <option value="Discovery">Discovery</option>
                  <option value="Demo">Demo</option>
                  <option value="Negotiation">Negotiation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Amount</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="$"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handleSetAll}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Apply All
            </button>
          </div>

          {/* Queue Items — Desktop */}
          <div className="hidden md:block space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`grid grid-cols-[1fr_120px_80px_32px_32px] gap-2 items-center p-3 rounded-lg border ${
                  item.status === "completed"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : item.status === "error"
                    ? "bg-red-500/5 border-red-500/20"
                    : item.status === "processing"
                    ? "bg-indigo-500/5 border-indigo-500/20"
                    : "bg-slate-950/50 border-slate-800"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 truncate">{item.preview}</p>
                  <input
                    type="text"
                    className="mt-1 w-full bg-transparent border border-slate-700 rounded px-2 py-1 text-white text-xs placeholder-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                    placeholder="Company name *"
                    value={item.companyName}
                    onChange={(e) => updateItem(item.id, { companyName: e.target.value })}
                    disabled={processing}
                  />
                </div>
                <select
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                  value={item.dealStage}
                  onChange={(e) => updateItem(item.id, { dealStage: e.target.value })}
                  disabled={processing}
                >
                  <option value="Discovery">Discovery</option>
                  <option value="Demo">Demo</option>
                  <option value="Negotiation">Negotiation</option>
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs placeholder-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                  placeholder="$"
                  value={item.dealAmount}
                  onChange={(e) => updateItem(item.id, { dealAmount: e.target.value })}
                  disabled={processing}
                />
                {/* Status indicator */}
                <div className="w-6 flex justify-center">
                  {item.status === "completed" && (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {item.status === "processing" && (
                    <svg className="w-4 h-4 text-indigo-400 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {item.status === "error" && (
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={processing}
                  aria-label={`Remove ${item.companyName || "item"}`}
                  className="text-slate-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Queue Items — Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col p-3 rounded-lg border ${
                  item.status === "completed"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : item.status === "error"
                    ? "bg-red-500/5 border-red-500/20"
                    : item.status === "processing"
                    ? "bg-indigo-500/5 border-indigo-500/20"
                    : "bg-slate-950/50 border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs text-slate-400 line-clamp-2 flex-1">{item.preview}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === "completed" && (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {item.status === "processing" && (
                      <svg className="w-4 h-4 text-indigo-400 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {item.status === "error" && (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={processing}
                      aria-label={`Remove ${item.companyName || "item"}`}
                      className="text-slate-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  className="w-full bg-transparent border border-slate-700 rounded px-2 py-1.5 text-white text-xs placeholder-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 mb-2"
                  placeholder="Company name *"
                  value={item.companyName}
                  onChange={(e) => updateItem(item.id, { companyName: e.target.value })}
                  disabled={processing}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                    value={item.dealStage}
                    onChange={(e) => updateItem(item.id, { dealStage: e.target.value })}
                    disabled={processing}
                  >
                    <option value="Discovery">Discovery</option>
                    <option value="Demo">Demo</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white text-xs placeholder-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400"
                    placeholder="$ Amount"
                    value={item.dealAmount}
                    onChange={(e) => updateItem(item.id, { dealAmount: e.target.value })}
                    disabled={processing}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Process button */}
          <div className="mt-4">
            <button
              onClick={onStartProcessing}
              disabled={processing || !hasItems || !allHaveCompany}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {processing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyze All ({items.length} conversations)
                </>
              )}
            </button>
            {!allHaveCompany && hasItems && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Every item needs a company name
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
