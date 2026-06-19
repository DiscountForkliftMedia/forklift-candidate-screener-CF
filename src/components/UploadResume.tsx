import React, { useRef, useState } from "react";
import { Upload, RefreshCw, FileText } from "lucide-react";
import type { Candidate } from "../types";
import { api } from "../api";
import { extractTextFromFile } from "../utils/extractText";

interface UploadResumeProps {
  uploadLocation: string;
  onCreated: (candidate: Candidate) => void;
  onError: (msg: string) => void;
}

const STEPS = [
  "Reading file bytes...",
  "Extracting text from document...",
  "Analyzing work longevity vs job hopping...",
  "Filtering for cold-calling & outbound sales...",
  "Scoring machinery interest & sales metrics...",
  "Assembling interview checklists...",
  "Synthesizing final scorecard...",
];

export default function UploadResume({ uploadLocation, onCreated, onError }: UploadResumeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSteps = () => {
    setStep(0);
    const timer = setInterval(() => {
      setStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1400);
    return timer;
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      onError("File is too large. Max size is 10MB.");
      return;
    }

    setIsAnalyzing(true);
    const timer = runSteps();
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length === 0) {
        throw new Error("The resume has no readable text content.");
      }
      const analysis = await api.analyzeResume(text);
      const created = await api.createCandidate({
        ...analysis,
        fileName: file.name,
        fileSize: file.size,
        location: uploadLocation,
      });
      onCreated(created);
    } catch (err: any) {
      onError(err?.message || "An unexpected error occurred while analyzing the resume.");
    } finally {
      clearInterval(timer);
      setIsAnalyzing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-white">Upload Resume</h2>
          <p className="mt-0.5 text-xs text-slate-400">PDF, DOC, or DOCX</p>
          <p className="mt-2 text-[11px] text-slate-500">
            New uploads: <span className="font-semibold text-teal-300">{uploadLocation}</span>
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isAnalyzing}
          className="rounded-lg bg-teal-400 px-4 py-1.5 text-sm font-bold text-[#05201c] transition-colors hover:bg-teal-300 disabled:opacity-50 cursor-pointer"
        >
          Select
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {isAnalyzing ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-teal-400/40 bg-teal-400/5 py-7 px-4">
          <RefreshCw className="h-7 w-7 animate-spin text-teal-300" />
          <p className="mt-3 min-h-[1.25rem] text-center font-mono text-[11px] text-teal-300 animate-pulse">
            {STEPS[step]}
          </p>
          <div className="mt-3 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-teal-400 transition-all duration-700"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 text-center transition-all ${
            isDragging
              ? "border-teal-400 bg-teal-400/10"
              : "border-white/12 bg-black/20 hover:border-teal-400/50 hover:bg-teal-400/5"
          }`}
        >
          <div className="mb-2 rounded-full bg-black/40 p-2.5">
            <Upload className="h-5 w-5 text-teal-300" />
          </div>
          <p className="text-sm font-semibold text-slate-200">Drop files here</p>
          <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-rose-400/80" /> PDF
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-sky-400/80" /> DOCX
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
