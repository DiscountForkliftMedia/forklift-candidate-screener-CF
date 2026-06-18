import React, { useState } from "react";
import { Calendar, Clock, Contact, MoreHorizontal, CheckCircle, Trash2, ShieldAlert, BadgeInfo } from "lucide-react";
import { Candidate, InterviewEvent } from "../types";

interface SchedulerViewProps {
  candidates: Candidate[];
  events: InterviewEvent[];
  onAddEvent: (event: InterviewEvent) => void;
  onRemoveEvent: (id: string) => void;
  onToggleCompleteEvent: (id: string) => void;
}

export default function SchedulerView({
  candidates,
  events,
  onAddEvent,
  onRemoveEvent,
  onToggleCompleteEvent,
}: SchedulerViewProps) {
  // Booking Form State
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [stage, setStage] = useState<"Phone" | "In-Person">("Phone");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedCandidateId) {
      setErrorMsg("Please select an applicant to schedule.");
      return;
    }
    if (!date) {
      setErrorMsg("Please pick an interview date.");
      return;
    }
    if (!time) {
      setErrorMsg("Please choose a starting time.");
      return;
    }

    const candidate = candidates.find((c) => c.id === selectedCandidateId);
    if (!candidate) {
      setErrorMsg("Selected candidate not found.");
      return;
    }

    const newEvent: InterviewEvent = {
      id: `ev-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      date,
      startTime: time,
      durationMinutes: Number(duration),
      stage,
      notes: notes.trim(),
      completed: false,
    };

    onAddEvent(newEvent);

    // Reset Form
    setSelectedCandidateId("");
    setDate("");
    setTime("");
    setNotes("");
    setDuration(stage === "Phone" ? 30 : 60);
  };

  // Sort events chronologically: nearest dates first
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.startTime}`).getTime();
    const timeB = new Date(`${b.date}T${b.startTime}`).getTime();
    return timeA - timeB;
  });

  return (
    <div className="bg-[#14161C] rounded-xl border border-gray-800 shadow-sm p-5 md:p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white font-display">Interview & Demo Scheduler</h2>
          <p className="text-xs text-gray-400">Book phone screenings or hands-on in-person sales demo sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking Form (Left / Col 5) */}
        <div className="lg:col-span-5 bg-[#1C1F26] p-4 rounded-xl border border-gray-800">
          <h3 className="text-sm font-semibold text-white font-display mb-3">Book New Interview Slot</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Candidate Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Select Candidate</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => {
                  setSelectedCandidateId(e.target.value);
                  const cand = candidates.find(c => c.id === e.target.value);
                  if (cand?.isQualified === false) {
                    setErrorMsg("Note: Candidate has a high-risk score on initial screening.");
                  } else {
                    setErrorMsg("");
                  }
                }}
                className="w-full text-xs py-2 px-3 bg-[#14161C] text-white border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.overallGrade ? `Grade ${c.overallGrade}` : "Unscreened"})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Interview Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStage("Phone");
                    setDuration(30);
                  }}
                  className={`py-1.5 px-3 rounded text-xs font-medium border text-center transition-colors cursor-pointer ${
                    stage === "Phone"
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-gray-700 bg-[#14161C] text-gray-400 hover:text-white hover:border-gray-600"
                  }`}
                >
                  📞 Phone Screening
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStage("In-Person");
                    setDuration(60);
                  }}
                  className={`py-1.5 px-3 rounded text-xs font-medium border text-center transition-colors cursor-pointer ${
                    stage === "In-Person"
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-gray-700 bg-[#14161C] text-gray-400 hover:text-white hover:border-gray-600"
                  }`}
                >
                  🤝 In-Person Lot Demo
                </button>
              </div>
            </div>

            {/* Date and Time Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-[#14161C] text-white border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-[#14161C] text-white border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Duration Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Duration: <span className="font-mono text-amber-400">{duration} minutes</span>
              </label>
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Administrative Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Custom Notes / Questions Focus</label>
              <textarea
                rows={2}
                placeholder="e.g. Probe job gaps or ask about heavy rental experience."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs py-1.5 px-3 bg-[#14161C] text-white placeholder-gray-650 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 text-xs rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-1.5">
                <BadgeInfo className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-colors shadow-sm cursor-pointer"
            >
              Confirm & Book Slot
            </button>
          </form>
        </div>

        {/* Chronological Calendar List (Right / Col 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white font-display mb-3">
              Upcoming Interview Flow ({events.length})
            </h3>
            {sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#1C1F26] rounded-xl border border-dashed border-gray-800">
                <Clock className="h-8 w-8 text-gray-600 mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-gray-300 font-display">No interviews booked yet</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-xs text-center">
                  Use the left form to book phone screens or on-site lot demonstrations for your candidates.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {sortedEvents.map((event) => {
                  const candidate = candidates.find((c) => c.id === event.candidateId);
                  const isRedFlagged = candidate && candidate.overallGrade && ["C", "C-", "D", "F"].includes(candidate.overallGrade.toString());

                  return (
                    <div
                      key={event.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg border text-xs leading-relaxed transition-all ${
                        event.completed
                          ? "bg-[#1C1F26] border-gray-800 opacity-50"
                          : isRedFlagged
                          ? "bg-rose-500/10 border-rose-500/20"
                          : "bg-[#1C1F26] border-gray-800 hover:border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg text-sm ${
                          event.completed 
                            ? "bg-[#14161C] text-gray-500" 
                            : event.stage === "Phone" 
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" 
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        }`}>
                          {event.stage === "Phone" ? "📞" : "🤝"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-sm font-display">
                              {event.candidateName}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-semibold uppercase tracking-wider ${
                              event.stage === "Phone"
                                ? "bg-blue-500/15 text-blue-450 text-blue-400"
                                : "bg-emerald-500/15 text-emerald-450 text-emerald-400"
                            }`}>
                              {event.stage === "Phone" ? "Phone Screen" : "In-Person Demo"}
                            </span>
                            {isRedFlagged && (
                              <span className="bg-rose-500/15 text-rose-400 px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-tight flex items-center gap-0.5">
                                <ShieldAlert className="h-2.5 w-2.5" /> High Risk
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-gray-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-600" />
                              {event.date}
                            </span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock className="h-3 w-3 text-gray-600" />
                              {event.startTime} ({event.durationMinutes} min)
                            </span>
                          </div>

                          {event.notes && (
                            <p className="text-gray-300 bg-[#14161C] border border-gray-800 p-1.5 rounded mt-2 text-[11px] italic font-sans">
                              "{event.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-3 md:mt-0 pt-2.5 md:pt-0 border-t md:border-0 border-gray-800">
                        <button
                          onClick={() => onToggleCompleteEvent(event.id)}
                          title={event.completed ? "Mark as Incomplete" : "Mark Interview as Complete"}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            event.completed
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-[#1c1f26] text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRemoveEvent(event.id)}
                          title="Cancel Interview"
                          className="p-1.5 rounded bg-[#1c1f26] text-gray-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[11px] leading-snug text-amber-400 flex items-start gap-2">
            <BadgeInfo className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Recruiter Practice tip:</strong> Conduct 15-minute phone screenings first to clear out job candidates with poor work longevity. Invite candidate lot demonstrations for final hires.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
