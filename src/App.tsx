import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  BookmarkCheck, 
  Award 
} from "lucide-react";
import { Candidate, CandidateStatus, InterviewEvent } from "./types";
import { SEED_CANDIDATES, SEED_EVENTS } from "./utils/seedData";
import UploadArea from "./components/UploadArea";
import SchedulerView from "./components/SchedulerView";
import CandidateCardDetails from "./components/CandidateCardDetails";
import PipelineVelocityChart from "./components/PipelineVelocityChart";

export default function App() {
  // 1. Core State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  
  // 2. Filter / Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all"); // all, recommended (isQualified), high-risk
  const [statusFilter, setStatusFilter] = useState("all");

  // 3. User feedback messaging
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 4. Load Initial Data from LocalStorage (or seeds if empty)
  useEffect(() => {
    const cachedCandidates = localStorage.getItem("discountforklift_candidates");
    const cachedEvents = localStorage.getItem("discountforklift_events");

    if (cachedCandidates) {
      try {
        const parsed = JSON.parse(cachedCandidates);
        setCandidates(parsed);
        if (parsed.length > 0) {
          setSelectedCandidateId(parsed[0].id);
        }
      } catch (err) {
        setCandidates(SEED_CANDIDATES);
        setSelectedCandidateId(SEED_CANDIDATES[0].id);
      }
    } else {
      setCandidates(SEED_CANDIDATES);
      setSelectedCandidateId(SEED_CANDIDATES[0].id);
      localStorage.setItem("discountforklift_candidates", JSON.stringify(SEED_CANDIDATES));
    }

    if (cachedEvents) {
      try {
        setEvents(JSON.parse(cachedEvents));
      } catch {
        setEvents(SEED_EVENTS);
      }
    } else {
      setEvents(SEED_EVENTS);
      localStorage.setItem("discountforklift_events", JSON.stringify(SEED_EVENTS));
    }
  }, []);

  // 5. Sync to LocalStorage on updates
  const saveCandidates = (updated: Candidate[]) => {
    setCandidates(updated);
    localStorage.setItem("discountforklift_candidates", JSON.stringify(updated));
  };

  const saveEvents = (updated: InterviewEvent[]) => {
    setEvents(updated);
    localStorage.setItem("discountforklift_events", JSON.stringify(updated));
  };

  // 6. Alert messaging helpers
  const triggerAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 6000);
  };

  // 7. Core Candidate Operations
  const handleAnalysisComplete = (newCandidate: Candidate) => {
    const updated = [newCandidate, ...candidates];
    saveCandidates(updated);
    setSelectedCandidateId(newCandidate.id);
    triggerAlert(`Successfully analyzed ${newCandidate.fullName}! ${newCandidate.isQualified ? "Highly qualified sales grade!" : "Analyzed - Flagged as high risk."}`, "success");
  };

  const handleUpdateStatus = (id: string, stage: CandidateStatus) => {
    const updated = candidates.map((cand) => {
      if (cand.id === id) {
        return { ...cand, status: stage };
      }
      return cand;
    });
    saveCandidates(updated);
    triggerAlert(`Pipeline stage updated to: ${stage}`);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const updated = candidates.map((cand) => {
      if (cand.id === id) {
        return { ...cand, notes };
      }
      return cand;
    });
    saveCandidates(updated);
  };

  const handleDeleteCandidate = (id: string) => {
    const updated = candidates.filter((cand) => cand.id !== id);
    saveCandidates(updated);
    
    // Clean up associated interview events
    const remainingEvents = events.filter((ev) => ev.candidateId !== id);
    saveEvents(remainingEvents);

    if (selectedCandidateId === id) {
      setSelectedCandidateId(updated.length > 0 ? updated[0].id : "");
    }
    triggerAlert("Candidate assessment purged successfully.", "error");
  };

  // 8. Core Scheduler Operations
  const handleAddEvent = (newEvent: InterviewEvent) => {
    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);

    // Auto-advance candidate pipeline status based on scheduled stage
    const updatedCandidates = candidates.map((cand) => {
      if (cand.id === newEvent.candidateId) {
        let newStageStatus: CandidateStatus = cand.status;
        if (newEvent.stage === "Phone") {
          newStageStatus = "Phone Scheduled";
        } else if (newEvent.stage === "In-Person") {
          newStageStatus = "In-Person Scheduled";
        }
        return { ...cand, status: newStageStatus };
      }
      return cand;
    });
    saveCandidates(updatedCandidates);

    triggerAlert(`Scheduled ${newEvent.stage} interview for ${newEvent.candidateName}!`);
  };

  const handleRemoveEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    saveEvents(updated);
    triggerAlert("Interview slot cancelled.", "error");
  };

  const handleToggleCompleteEvent = (id: string) => {
    let candIdToUpdate = "";
    let completedStage: "Phone" | "In-Person" = "Phone";

    const updatedEvents = events.map((ev) => {
      if (ev.id === id) {
        const isNowCompleted = !ev.completed;
        candIdToUpdate = ev.candidateId;
        completedStage = ev.stage;
        return { ...ev, completed: isNowCompleted };
      }
      return ev;
    });
    saveEvents(updatedEvents);

    // Auto advance pipeline status to Completed if marked complete
    if (candIdToUpdate) {
      const updatedCandidates = candidates.map((cand) => {
        if (cand.id === candIdToUpdate) {
          let updatedStatus: CandidateStatus = cand.status;
          if (completedStage === "Phone") {
            updatedStatus = "Phone Completed";
          } else if (completedStage === "In-Person") {
            updatedStatus = "In-Person Completed";
          }
          return { ...cand, status: updatedStatus };
        }
        return cand;
      });
      saveCandidates(updatedCandidates);
    }
    triggerAlert("Interview completion logged.");
  };

  // Quick book helper inside candidate card
  const handleQuickBook = (cand: Candidate, stage: "Phone" | "In-Person") => {
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      dateInput.scrollIntoView({ behavior: "smooth" });
      dateInput.focus();
    }
    triggerAlert(`Ready to book ${stage} interview slot. Please pick a date & time below.`, "success");
  };

  // 9. Pipeline Filters
  const filteredCandidates = candidates.filter((c) => {
    // 1. Search Query Match
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.keySkills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Grade Filter
    let matchesGrade = true;
    if (gradeFilter === "recommended") {
      matchesGrade = c.isQualified === true;
    } else if (gradeFilter === "high-risk") {
      matchesGrade = c.isQualified === false;
    }

    // 3. Status Filter
    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = c.status === statusFilter;
    }

    return matchesSearch && matchesGrade && matchesStatus;
  });

  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId);

  // Summary Metrics calculation
  const totalScreenedCount = candidates.length;
  const recommendedCount = candidates.filter((c) => c.isQualified).length;
  const inProgressCount = candidates.filter((c) => ["Phone Scheduled", "Phone Completed", "In-Person Scheduled", "In-Person Completed"].includes(c.status)).length;
  const hiredCount = candidates.filter((c) => c.status === "Hired").length;

  return (
    <div className="min-h-screen bg-[#0B0C10] pb-12 font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Heavy Machinery Top Header Banner */}
      <header className="bg-[#14161C] border-b border-gray-800 text-white relative overflow-hidden shadow-md">
        {/* Subtle decorative background forklift grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-extrabold tracking-tight text-xl font-display uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                🟡 DISCOUNT FORKLIFT
              </span>
              <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold tracking-wider">
                Heavy Equipment B2B Sales
              </span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-black text-white font-display tracking-tight leading-tight">
              Forklift Sales Candidate Screener
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl font-light">
              Grade high-ticket machinery sales candidates instantly on Cold-Calling grit, B2B metrics, and career longevity. Preload phone screening scripts and on-site demonstrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-mono text-xs">Live Cloudflare Workers Engine Active</span>
          </div>
        </div>
      </header>

      {/* Main Core View Area */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 mt-6">
        
        {/* Dynamic Alert Toasts */}
        {alertMsg && (
          <div className={`p-4 rounded-xl shadow-lg mb-6 border animate-slideIn flex items-center gap-3 ${
            alertMsg.type === "success" 
              ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-200" 
              : "bg-rose-950/40 border-rose-800/50 text-rose-200"
          }`}>
            {alertMsg.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <p className="text-xs md:text-sm font-semibold">{alertMsg.text}</p>
          </div>
        )}

        {/* Sales Recruitment Performance Ribbon */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#14161C] p-4 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Total Screened</p>
              <h4 className="text-xl md:text-2xl font-black text-white font-display mt-0.5">{totalScreenedCount}</h4>
            </div>
            <div className="p-2.5 bg-gray-800 rounded-lg text-gray-300">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#14161C] p-4 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Highly Recommended</p>
              <h4 className="text-xl md:text-2xl font-black text-emerald-400 font-display mt-0.5">{recommendedCount}</h4>
            </div>
            <div className="p-2.5 bg-emerald-950/60 rounded-lg text-emerald-400 border border-emerald-900/50">
              <Award className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#14161C] p-4 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Interviewing</p>
              <h4 className="text-xl md:text-2xl font-black text-blue-400 font-display mt-0.5">{inProgressCount}</h4>
            </div>
            <div className="p-2.5 bg-blue-950/60 rounded-lg text-blue-400 border border-blue-900/50">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-[#14161C] p-4 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Hires Completed</p>
              <h4 className="text-xl md:text-2xl font-black text-amber-500 font-display mt-0.5">{hiredCount}</h4>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20 animate-pulse">
              <BookmarkCheck className="h-5 w-5" />
            </div>
          </div>
        </section>

        {/* Pipeline Velocity Tracker */}
        <PipelineVelocityChart candidates={candidates} />

        {/* Grid Area: Files Vault / Candidate List Sidebar (4 Cols) + Large Candidate Dossier (8 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          {/* L-Sidebar: Candidate listing with Resume Vault */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Drag Drop Area */}
            <UploadArea 
              onAnalysisComplete={handleAnalysisComplete} 
              onError={(msg) => triggerAlert(msg, "error")} 
            />

            {/* 2. Candidate Directory Filter & Search */}
            <div className="bg-[#14161C] rounded-xl border border-gray-800 shadow-sm p-4 md:p-5">
              <h3 className="text-sm font-extrabold text-white font-display flex items-center gap-1.5 uppercase tracking-wide mb-4">
                <Filter className="h-4 w-4 text-gray-500" /> Candidate Pipeline List
              </h3>

              {/* Search bar */}
              <div className="relative mb-3.5">
                <Search className="h-4 w-4 text-gray-500 absolute top-2.5 left-3" />
                <input
                  type="text"
                  placeholder="Search name, skills, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-[#1C1F26] border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-gray-500"
                />
              </div>

              {/* Filtering ribbon */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Qualify Rating</label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="w-full text-xs bg-[#1C1F26] border border-gray-700 text-gray-300 rounded py-1 px-2 focus:outline-none"
                  >
                    <option value="all">All Grades</option>
                    <option value="recommended">✓ Recommended</option>
                    <option value="high-risk">⚠ High Risk Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Status Stage</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full text-xs bg-[#1C1F26] border border-gray-700 text-gray-300 rounded py-1 px-2 focus:outline-none"
                  >
                    <option value="all">All Pipeline</option>
                    <option value="Screened">Screened</option>
                    <option value="Phone Scheduled">Phone Booked</option>
                    <option value="Phone Completed">Phone Complete</option>
                    <option value="In-Person Scheduled">Lot Booked</option>
                    <option value="In-Person Completed">Demo Complete</option>
                    <option value="Hired">Hired</option>
                    <option value="Not Fit">Not Fit</option>
                  </select>
                </div>
              </div>

              {/* Candidates Output list */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredCandidates.length === 0 ? (
                  <div className="p-6 text-center bg-[#1C1F26] rounded-lg border border-dashed border-gray-750">
                    <p className="text-xs text-gray-500">No applicants match criteria.</p>
                  </div>
                ) : (
                  filteredCandidates.map((cand) => {
                    const isSelected = cand.id === selectedCandidateId;
                    const gradeColorClass = cand.isQualified 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20";

                    return (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidateId(cand.id)}
                        className={`p-3 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#1C1F26] text-white border-l-4 border-l-amber-500 border-t-gray-800 border-r-gray-800 border-b-gray-800 shadow-sm"
                            : "bg-[#14161C] hover:bg-[#1E2129] border-gray-800 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold font-display text-[13px] truncate">
                            {cand.fullName}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                            isSelected ? "bg-amber-500 text-black" : gradeColorClass
                          }`}>
                            Grade {cand.overallGrade}
                          </span>
                        </div>

                        <p className={`text-[10px] mt-1.5 truncate ${isSelected ? "text-slate-300" : "text-gray-400"}`}>
                          📌 {cand.location || "Unknown location"}
                        </p>

                        <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-gray-800/40">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            cand.status === "Hired" 
                              ? "bg-emerald-500/25 text-emerald-400" 
                              : cand.status === "Not Fit" 
                              ? "bg-rose-500/25 text-rose-400" 
                              : isSelected ? "bg-amber-500/10 text-amber-500" : "bg-gray-800 text-gray-300"
                          }`}>
                            {cand.status}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {new Date(cand.dateAdded).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

          {/* R-Core Card details: Dossier view */}
          <div className="lg:col-span-8">
            {activeCandidate ? (
              <CandidateCardDetails 
                candidate={activeCandidate}
                onUpdateStatus={handleUpdateStatus}
                onUpdateNotes={handleUpdateNotes}
                onDelete={handleDeleteCandidate}
                onQuickBook={handleQuickBook}
              />
            ) : (
              <div className="bg-[#14161C] rounded-xl border border-gray-800 shadow-sm p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                <BookOpen className="h-12 w-12 text-gray-500 mb-3 animate-bounce" />
                <h3 className="text-base font-bold text-white font-display">No Candidate Dossier Selected</h3>
                <p className="text-xs text-gray-400 mt-2 max-w-sm">
                  Drag and drop a resume on the left or select an existing applicant from the directory pipeline to check scorecards and interview questions.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Panel: Expanded Scheduler Calendar System */}
        <section id="interview-scheduler-section">
          <SchedulerView 
            candidates={candidates}
            events={events}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
            onToggleCompleteEvent={handleToggleCompleteEvent}
          />
        </section>

      </main>

      {/* Small footer branding credit */}
      <footer className="max-w-7xl mx-auto px-4 mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-6 text-[11px] text-gray-500">
        <p>© 2026 Discount Forklift Recruitment Operations. Protected Workspace.</p>
        <p className="font-mono bg-[#14161C] px-2 py-0.5 rounded border border-gray-800">
          Cloudflare Workers + React SPA Edge Bridge v3.5
        </p>
      </footer>

    </div>
  );
}
