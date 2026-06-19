import { useEffect, useState } from "react";
import { Trash2, Sparkles } from "lucide-react";
import type { Candidate, Stage, Status } from "../types";
import { STAGES, AUTO_DECLINE_THRESHOLD } from "../types";
import { formatFileSize } from "../lib/format";
import ScoreRing from "./ScoreRing";

interface CandidateDetailProps {
  candidate: Candidate;
  onPatch: (patch: Partial<Pick<Candidate, "stage" | "status" | "notes">>) => void;
  onDelete: () => void;
}

const ACTIONS: { key: Status; label: string; idle: string; active: string }[] = [
  {
    key: "Active",
    label: "Advance",
    idle: "bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/25",
    active: "bg-emerald-400 border border-emerald-400 text-[#04231a]",
  },
  {
    key: "Hold",
    label: "Hold",
    idle: "bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20",
    active: "bg-amber-500 border border-amber-500 text-[#2a1d02]",
  },
  {
    key: "Declined",
    label: "Decline",
    idle: "bg-fuchsia-500/10 border border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/20",
    active: "bg-fuchsia-500 border border-fuchsia-500 text-[#2a0a26]",
  },
  {
    key: "Offer",
    label: "Offer",
    idle: "bg-teal-500/10 border border-teal-500/40 text-teal-300 hover:bg-teal-500/20",
    active: "bg-teal-400 border border-teal-400 text-[#05201c]",
  },
];

export default function CandidateDetail({ candidate, onPatch, onDelete }: CandidateDetailProps) {
  const [notes, setNotes] = useState(candidate.notes);
  const [tab, setTab] = useState<"phone" | "inperson">("phone");

  useEffect(() => {
    setNotes(candidate.notes);
  }, [candidate.id, candidate.notes]);

  const stageIndex = STAGES.indexOf(candidate.stage);
  const isFinal = candidate.stage === "Final Decision";
  const belowThreshold = candidate.score < AUTO_DECLINE_THRESHOLD;

  const handleAction = (key: Status) => {
    if (key === "Active") {
      // Advance: move to the next stage; stay active.
      const next = STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];
      onPatch({ stage: next, status: "Active" });
    } else if (key === "Offer") {
      if (!isFinal) return; // Offer only valid at Final Decision
      onPatch({ status: "Offer" });
    } else {
      onPatch({ status: key });
    }
  };

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 md:p-6">
        {/* Top badges + score */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-teal-400/15 px-2 py-1 text-[11px] font-bold text-teal-300">
                AI screened
              </span>
              {belowThreshold && (
                <span className="rounded-md bg-fuchsia-500/15 px-2 py-1 text-[11px] font-bold text-fuchsia-300">
                  Auto-decline threshold
                </span>
              )}
              <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-400">
                {formatFileSize(candidate.fileSize)}
              </span>
            </div>

            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">
              {candidate.fullName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
              {candidate.email && (
                <a href={`mailto:${candidate.email}`} className="hover:text-teal-300">
                  {candidate.email}
                </a>
              )}
              {candidate.email && candidate.phone && <span className="text-slate-600">/</span>}
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} className="hover:text-teal-300">
                  {candidate.phone}
                </a>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-300">
                {candidate.location}
              </span>
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-400">
                {candidate.ownerManager}
              </span>
            </div>
          </div>

          <ScoreRing score={candidate.score} />
        </div>

        {/* Stage tabs */}
        <div className="mt-5 grid grid-cols-5 gap-1.5">
          {STAGES.map((stage: Stage) => {
            const selected = stage === candidate.stage;
            return (
              <button
                key={stage}
                onClick={() => onPatch({ stage })}
                className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold leading-tight transition-colors cursor-pointer ${
                  selected
                    ? "border border-white/15 bg-black/50 text-white"
                    : "border border-transparent bg-white/[0.03] text-slate-400 hover:text-white"
                }`}
              >
                {stage}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ACTIONS.map((a) => {
            const isActive = candidate.status === a.key;
            const disabled = a.key === "Offer" && !isFinal;
            return (
              <button
                key={a.key}
                onClick={() => handleAction(a.key)}
                disabled={disabled}
                className={`rounded-lg py-3 text-sm font-bold transition-all ${
                  isActive ? a.active : a.idle
                } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                {a.label}
              </button>
            );
          })}
        </div>

        {/* Flags */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-teal-300">
              Green Flags
            </h3>
            <ul className="mt-3 space-y-2.5">
              {candidate.greenFlags.length === 0 ? (
                <li className="text-xs italic text-slate-500">No strong green flags detected.</li>
              ) : (
                candidate.greenFlags.map((f, i) => (
                  <li key={i} className="text-[13px] leading-relaxed text-slate-300">
                    {f}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-pink-400">
              Red Flags
            </h3>
            <ul className="mt-3 space-y-2.5">
              {candidate.redFlags.length === 0 ? (
                <li className="text-xs italic text-slate-500">No immediate risk signals.</li>
              ) : (
                candidate.redFlags.map((f, i) => (
                  <li key={i} className="text-[13px] leading-relaxed text-slate-300">
                    {f}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Experience summary */}
        {candidate.experienceSummary && (
          <div className="mt-6 rounded-xl border border-white/8 bg-black/20 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Professional Background
            </h4>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
              {candidate.experienceSummary}
            </p>
          </div>
        )}

        {/* Key skills */}
        {candidate.keySkills.length > 0 && (
          <div className="mt-5">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Key Sales Skills
            </h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {candidate.keySkills.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interview questions (AI extras) */}
        <div className="mt-6 overflow-hidden rounded-xl border border-white/8">
          <div className="flex border-b border-white/8 bg-black/20 p-1">
            {(["phone", "inperson"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  tab === t ? "bg-black/50 text-teal-300" : "text-slate-400 hover:text-white"
                }`}
              >
                {t === "phone" ? "Phone Screen Questions" : "In-Person Questions"}
              </button>
            ))}
          </div>
          <div className="space-y-2.5 p-4">
            {(tab === "phone" ? candidate.phoneInterviewQuestions : candidate.inPersonInterviewQuestions)
              .length === 0 ? (
              <p className="text-xs italic text-slate-500">No questions generated.</p>
            ) : (
              (tab === "phone"
                ? candidate.phoneInterviewQuestions
                : candidate.inPersonInterviewQuestions
              ).map((q, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-black/20 p-3">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                  <p className="text-[13px] text-slate-200">{q}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Manager Notes (autosaved)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== candidate.notes && onPatch({ notes })}
            placeholder="Background checks, interview performance, follow-ups..."
            className="field mt-2 w-full rounded-lg px-3 py-2 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/8 bg-black/20 px-5 py-3 text-xs">
        <span className="font-mono text-slate-500">
          Grade {candidate.overallGrade || "—"} · {candidate.gradeExplanation ? "" : ""}
          {candidate.status}
        </span>
        <button
          onClick={() => {
            if (window.confirm(`Remove "${candidate.fullName}" from the screener?`)) onDelete();
          }}
          className="flex items-center gap-1 font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
