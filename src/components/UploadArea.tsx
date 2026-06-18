import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { Candidate } from "../types";
import { extractTextFromFile } from "../utils/extractText";

interface UploadAreaProps {
  onAnalysisComplete: (candidate: Candidate) => void;
  onError: (msg: string) => void;
}

export default function UploadArea({ onAnalysisComplete, onError }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [pastedText, setPastedText] = useState("");
  const [pastedName, setPastedName] = useState("");
  const [showTextPaste, setShowTextPaste] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Reading file bytes...",
    "Extracting text from document structure...",
    "Analyzing candidate work longevity vs job hopping patterns...",
    "Filtering for cold-calling and outbound sales experience...",
    "Scoring machinery interest and direct Sales metrics...",
    "Assembling over-the-phone & in-person interview checklists...",
    "Synthesizing final evaluation scorecard..."
  ];

  const startAnalysisTimer = () => {
    setAnalysisStep(0);
    const interval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1800);
    return interval;
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      onError("File is too large. Max size is 10MB.");
      return;
    }

    // Validate file type
    const validExtensions = [".pdf", ".docx", ".txt"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(extension) && file.type !== "text/plain") {
      onError("Please upload a PDF (.pdf) or Word Document (.docx).");
      return;
    }

    setIsAnalyzing(true);
    const timer = startAnalysisTimer();

    try {
      // Extract plain text from the document in the browser (PDF/DOCX/TXT),
      // then send just the text to the Cloudflare Worker for AI analysis.
      const text = await extractTextFromFile(file);

      if (!text || text.trim().length === 0) {
        throw new Error("The resume seems to be empty or has no readable text content.");
      }

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileName: file.name }),
      });

      clearInterval(timer);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Server analysis failed." }));
        throw new Error(errData.error || errData.details || "Failed to analyze resume.");
      }

      const candidateData = await response.json();
      
      // Inject standard fields required by our frontend state
      const newCandidate: Candidate = {
        ...candidateData,
        id: `cand-${Date.now()}`,
        status: "Screened",
        dateAdded: new Date().toISOString(),
        notes: "Uploaded candidate resume analyzed by system AI."
      };

      onAnalysisComplete(newCandidate);
      setPastedText("");
      setPastedName("");
      setShowTextPaste(false);
    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      onError(err.message || "An unexpected error occurred while analyzing the resume.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Plain-Text Fallback option for testing
  const handleTextSubmit = () => {
    if (!pastedText.trim()) return;
    const name = pastedName.trim() || "Pasted Resume Candidate";
    const blob = new Blob([pastedText], { type: "text/plain" });
    const file = new File([blob], `${name.replace(/\s+/g, "_")}.txt`, { type: "text/plain" });
    handleFile(file);
  };

  return (
    <div className="bg-[#14161C] rounded-xl border border-gray-800 shadow-sm p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white font-display">Resume Screening Vault</h2>
          <p className="text-xs text-gray-400">Drop PDF or Word files to immediately filter qualified applicants</p>
        </div>
        <button
          onClick={() => setShowTextPaste(!showTextPaste)}
          className="text-xs text-amber-500 font-medium hover:underline cursor-pointer"
        >
          {showTextPaste ? "Show Drag & Drop" : "Paste Text Instead"}
        </button>
      </div>

      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-[#1C1F26] rounded-xl border border-dashed border-amber-500/40">
          <div className="relative mb-5">
            <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
            <Layers className="h-5 w-5 text-amber-450 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="font-semibold text-white font-display mb-1 text-center">
            Discount Forklift AI Analysing...
          </h3>
          <p className="text-xs text-amber-400 text-center animate-pulse min-h-[1.5rem] font-mono">
            {steps[analysisStep]}
          </p>
          <div className="w-full max-w-sm bg-[#0B0C10] rounded-full h-1.5 mt-4 overflow-hidden border border-gray-800">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      ) : showTextPaste ? (
        <div className="space-y-4 bg-[#1C1F26] p-4 rounded-xl border border-gray-800">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Candidate Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. John Miller"
              value={pastedName}
              onChange={(e) => setPastedName(e.target.value)}
              className="w-full py-1.5 px-3 border border-gray-700 rounded text-sm bg-[#14161C] text-white focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Paste Resume Content</label>
            <textarea
              rows={6}
              placeholder="Paste raw text, contact details, experiences, and education here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="w-full py-1.5 px-3 border border-gray-700 rounded text-sm bg-[#14161C] text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-gray-600"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowTextPaste(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-[#14161C] rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleTextSubmit}
              disabled={!pastedText.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-black bg-amber-500 hover:bg-amber-400 rounded disabled:opacity-50 cursor-pointer"
            >
              Analyze Text Resume
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-8 px-4 transition-all duration-150 cursor-pointer ${
            isDragging
              ? "border-amber-500 bg-amber-500/10 scale-[0.99]"
              : "border-gray-700 bg-[#0B0C10] hover:border-amber-500/50 hover:bg-[#1C1F26]"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <div className="p-3 bg-[#1C1F26] rounded-full mb-3 text-gray-300 transition-colors">
            <Upload className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-sm font-semibold text-white font-display text-center">
            Drag & drop candidate resume here
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Accepts PDF (.pdf) or Word (.docx) files
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-rose-500/80" /> PDF
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-blue-500/80" /> WORD DOC
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
