import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  AlertTriangle, 
  Mail, 
  Phone, 
  MapPin, 
  Trash2, 
  Bookmark, 
  UserPlus, 
  Clock, 
  CheckCircle2, 
  XOctagon, 
  FileQuestion,
  HelpCircle,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Candidate, CandidateStatus, GradeSymbol } from "../types";

interface CandidateCardDetailsProps {
  candidate: Candidate;
  onUpdateStatus: (id: string, status: CandidateStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
  onQuickBook: (cand: Candidate, stage: "Phone" | "In-Person") => void;
}

export default function CandidateCardDetails({
  candidate,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
  onQuickBook,
}: CandidateCardDetailsProps) {
  const [notes, setNotes] = useState(candidate.notes || "");
  const [activeTab, setActiveTab] = useState<"phone" | "inperson">("phone");

  // Sync internal state when active candidate changes
  useEffect(() => {
    setNotes(candidate.notes || "");
  }, [candidate.id, candidate.notes]);

  const handleNotesBlur = () => {
    onUpdateNotes(candidate.id, notes);
  };

  const getGradeColors = (grade: string | GradeSymbol) => {
    const symbol = String(grade).toUpperCase();
    if (symbol.startsWith("A")) {
      return { 
        bg: "bg-emerald-950/20 text-emerald-350 border-emerald-900/40", 
        badge: "bg-emerald-500 text-black", 
        badgeLight: "bg-emerald-500/20 text-emerald-400" 
      };
    } else if (symbol.startsWith("B")) {
      return { 
        bg: "bg-teal-950/20 text-teal-350 border-teal-900/40", 
        badge: "bg-teal-500 text-black", 
        badgeLight: "bg-teal-500/20 text-teal-400" 
      };
    } else if (symbol.startsWith("C")) {
      return { 
        bg: "bg-amber-500/10 text-amber-350 border-amber-500/20", 
        badge: "bg-amber-500 text-black", 
        badgeLight: "bg-amber-500/20 text-amber-500" 
      };
    } else {
      return { 
        bg: "bg-rose-950/20 text-rose-350 border-rose-900/40", 
        badge: "bg-rose-500 text-black", 
        badgeLight: "bg-rose-500/20 text-rose-400" 
      };
    }
  };

  const colors = getGradeColors(candidate.overallGrade);

  return (
    <div className="bg-[#14161C] rounded-xl border border-gray-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Banner */}
      <div className="p-4 md:p-6 border-b border-gray-800 bg-[#1C1F26] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-display text-white tracking-tight">{candidate.fullName}</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${colors.badgeLight}`}>
              Grade {candidate.overallGrade}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 mt-1.5 md:items-center">
            {candidate.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {candidate.location}
              </span>
            )}
            {candidate.email && (
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 hover:text-amber-500 transition-colors">
                <Mail className="h-3 w-3" /> {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a href={`tel:${candidate.phone}`} className="flex items-center gap-1 hover:text-amber-500 transition-colors">
                <Phone className="h-3 w-3" /> {candidate.phone}
              </a>
            )}
          </div>
        </div>

        {/* Pipeline Stage Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400 shrink-0">Pipeline Stage:</label>
          <select
            value={candidate.status}
            onChange={(e) => onUpdateStatus(candidate.id, e.target.value as CandidateStatus)}
            className="text-xs font-semibold bg-[#14161C] border border-gray-700 text-gray-250 py-1.5 px-3 focus:ring-1 focus:ring-amber-500 focus:outline-none rounded text-white cursor-pointer"
          >
            <option value="Screened">🟢 Resume Screened</option>
            <option value="Phone Scheduled">📞 Phone Scheduled</option>
            <option value="Phone Completed">☎️ Phone Screen Completed</option>
            <option value="In-Person Scheduled">🤝 In-Person Lot Scheduled</option>
            <option value="In-Person Completed">🏆 Lot Demo Completed</option>
            <option value="Hired">🎉 Offer Sent / Hired</option>
            <option value="Not Fit">🛑 Not Fit</option>
          </select>
        </div>
      </div>

      {/* Main Stats Scrollable Card */}
      <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6">
        
        {/* Fit Score & Resume Longevity Explanation */}
        <div className={`p-4 rounded-xl border ${colors.bg} flex flex-col md:flex-row gap-4 items-start`}>
          <div className={`text-3xl font-extrabold flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center border font-display ${colors.badge}`}>
            {candidate.overallGrade}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-white">AI Sales Screening Explanation</h3>
              {candidate.isQualified ? (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold uppercase py-0.5 px-1.5 rounded flex items-center gap-0.5 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Recommended
                </span>
              ) : (
                <span className="text-[10px] bg-rose-500/15 text-rose-450 font-bold uppercase py-0.5 px-1.5 rounded flex items-center gap-0.5 border border-rose-500/20">
                  <XOctagon className="h-3 w-3" /> High Risk Profile
                </span>
              )}
            </div>
            <p className="text-xs mt-1.5 leading-relaxed text-gray-300">{candidate.gradeExplanation}</p>
          </div>
        </div>

        {/* Green Flags vs Red Flags Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Green Flags (Proactive, Metrics, Longevity) */}
          <div className="bg-emerald-950/10 border border-emerald-900/40 rounded-xl p-4">
            <h3 className="text-xs font-extrabold text-emerald-400 font-display flex items-center gap-1.5 uppercase tracking-wide mb-3">
              <CheckCircle className="h-4 w-4 text-emerald-450" /> Green Flags
            </h3>
            {candidate.greenFlags.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No strong sales green flags detected in resume.</p>
            ) : (
              <ul className="space-y-2">
                {candidate.greenFlags.map((flag, idx) => (
                  <li key={idx} className="text-xs text-emerald-100/85 flex items-start gap-2">
                    <span className="text-emerald-450 font-semibold mt-0.5">✓</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Red Flags / Risks */}
          <div className="bg-rose-950/10 border border-rose-900/40 rounded-xl p-4">
            <h3 className="text-xs font-extrabold text-rose-400 font-display flex items-center gap-1.5 uppercase tracking-wide mb-3">
              <AlertTriangle className="h-4 w-4 text-rose-450" /> Red Flags / Risks
            </h3>
            {candidate.redFlags.length === 0 ? (
              <p className="text-xs text-emerald-400 italic">No immediate high-risk signals parsed from resume.</p>
            ) : (
              <ul className="space-y-2">
                {candidate.redFlags.map((flag, idx) => (
                  <li key={idx} className="text-xs text-rose-105-100 flex items-start gap-2 text-rose-100/85">
                    <span className="text-rose-500 font-bold mt-0.5">⚠</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Extract Work Summary */}
        {candidate.experienceSummary && (
          <div className="bg-[#1C1F26] p-4 rounded-xl border border-gray-800">
            <h3 className="text-xs font-extrabold text-gray-400 font-display flex items-center gap-1.5 uppercase tracking-wide mb-2">
              <Briefcase className="h-4 w-4 text-amber-500" /> Professional Background Parsed
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">{candidate.experienceSummary}</p>
          </div>
        )}

        {/* Candidate Key Skills Met */}
        {candidate.keySkills && candidate.keySkills.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Primary Sales Skills Identified</h4>
            <div className="flex flex-wrap gap-1.5">
              {candidate.keySkills.map((skill, idx) => (
                <span key={idx} className="bg-[#1C1F26] text-gray-300 text-[10px] font-semibold font-mono py-1 px-2.5 rounded-full border border-gray-800">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Structured Interview Stage Questions & Playbook */}
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#14161C] shadow-sm">
          {/* Stage Tab Headers */}
          <div className="bg-[#1C1F26] p-1 flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab("phone")}
              className={`flex-1 py-2 px-3 text-xs font-bold font-display rounded-md text-center transition-all cursor-pointer ${
                activeTab === "phone"
                  ? "bg-[#14161C] shadow-sm text-amber-500 border-b-2 border-b-amber-500"
                  : "text-gray-400 hover:bg-[#1C1F26] hover:text-white"
              }`}
            >
              Stage 1: Over-The-Phone Screening
            </button>
            <button
              onClick={() => setActiveTab("inperson")}
              className={`flex-1 py-2 px-3 text-xs font-bold font-display rounded-md text-center transition-all cursor-pointer ${
                activeTab === "inperson"
                  ? "bg-[#14161C] shadow-sm text-amber-500 border-b-2 border-b-amber-500"
                  : "text-gray-400 hover:bg-[#1C1F26] hover:text-white"
              }`}
            >
              Stage 2: In-Person Lot Interview & Demo
            </button>
          </div>

          <div className="p-4 bg-[#14161C]">
            {activeTab === "phone" ? (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Phone Guard Questions
                  </h4>
                  <button 
                    onClick={() => onQuickBook(candidate, "Phone")}
                    className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded font-bold hover:bg-blue-500/20 transition-all cursor-pointer"
                  >
                    🗓 Book Phone Screening
                  </button>
                </div>
                {candidate.phoneInterviewQuestions.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No specific phone screen questions generated.</p>
                ) : (
                  <div className="space-y-3">
                    {candidate.phoneInterviewQuestions.map((q, idx) => (
                      <div key={idx} className="bg-[#1C1F26] border border-gray-800 p-3 rounded-lg flex items-start gap-2.5">
                        <div className="bg-blue-500/25 text-blue-400 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/10">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs text-gray-200 font-medium font-semibold">{q}</p>
                          <span className="text-[10px] text-gray-500 font-mono mt-1 block">💡 Probing for: work stamina, job-hopping longevity & outbound attitude</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Heavy Equipment Demonstration & Roleplay Focus
                  </h4>
                  <button 
                    onClick={() => onQuickBook(candidate, "In-Person")}
                    className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                  >
                    🗓 Book On-Lot Demonstration
                  </button>
                </div>
                {candidate.inPersonInterviewQuestions.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No specific in-person closing roleplay questions generated.</p>
                ) : (
                  <div className="space-y-3">
                    {candidate.inPersonInterviewQuestions.map((q, idx) => (
                      <div key={idx} className="bg-[#1C1F26] border border-gray-800 p-3 rounded-lg flex items-start gap-2.5">
                        <div className="bg-emerald-500/25 text-emerald-400 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/10">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs text-gray-200 font-medium font-semibold">{q}</p>
                          <span className="text-[10px] text-gray-500 font-mono mt-1 block">💡 Probing for: closing ability, B2B negotiation, price-resistance handling</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Manager Custom Notes Drawer */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Sales Manager Administrative Notes (Autosaved)
          </label>
          <textarea
            rows={3}
            placeholder="Write notes about background checks, interview performance, or follow-ups..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            className="w-full text-xs py-2 px-3 border border-gray-800 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none focus:bg-[#1E2129] font-sans bg-[#1C1F26] text-white placeholder-gray-650"
          />
        </div>

      </div>

      {/* Footer controls: Remove Candidate */}
      <div className="bg-[#1C1F26] p-4 border-t border-gray-850 flex justify-between items-center text-xs">
        <span className="text-gray-500 font-mono">Added: {new Date(candidate.dateAdded).toLocaleDateString()}</span>
        <button
          onClick={() => {
            if (window.confirm(`Are you sure you want to remove candidate "${candidate.fullName}" from the screening table?`)) {
              onDelete(candidate.id);
            }
          }}
          className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete Assessment
        </button>
      </div>
    </div>
  );
}
