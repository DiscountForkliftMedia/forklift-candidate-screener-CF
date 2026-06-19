import { useState } from "react";
import { CalendarPlus, Send, BellRing, Check, X } from "lucide-react";
import type { Candidate, InterviewEvent } from "../types";
import { formatDateTime, toDatetimeLocal } from "../lib/format";

interface SchedulingPanelProps {
  candidate: Candidate;
  events: InterviewEvent[];
  onSchedule: (payload: Partial<InterviewEvent>) => Promise<void> | void;
  onToggleEvent: (id: string, completed: boolean) => void;
  onDeleteEvent: (id: string) => void;
  onToast: (msg: string, type?: "success" | "error") => void;
}

function defaultSlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
}

function downloadIcs(candidate: Candidate, type: string, isoStart: string, durationMin: number) {
  const start = new Date(isoStart);
  const end = new Date(start.getTime() + durationMin * 60000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `${candidate.id}-${start.getTime()}@discountforklift`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Discount Forklift//Candidate Screener//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${type} interview — ${candidate.fullName}`,
    `DESCRIPTION:Discount Forklift sales candidate ${type} interview with ${candidate.fullName} (${candidate.email}).`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `interview-${candidate.fullName.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SchedulingPanel({
  candidate,
  events,
  onSchedule,
  onToggleEvent,
  onDeleteEvent,
  onToast,
}: SchedulingPanelProps) {
  const [type, setType] = useState<"Phone" | "In-Person">("Phone");
  const [slot, setSlot] = useState<string>(defaultSlot());

  const schedule = async (reminder = false) => {
    if (!slot) {
      onToast("Pick a date and time first.", "error");
      return;
    }
    const iso = new Date(slot).toISOString();
    await onSchedule({
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      type,
      datetime: iso,
      durationMinutes: type === "Phone" ? 30 : 60,
      notes: reminder ? "⏰ Reminder" : "",
    });
    onToast(
      reminder
        ? `Reminder set for ${formatDateTime(iso)}.`
        : `${type} interview scheduled for ${formatDateTime(iso)}.`,
    );
  };

  const invite = () => {
    if (!slot) {
      onToast("Pick a date and time first.", "error");
      return;
    }
    downloadIcs(candidate, type, new Date(slot).toISOString(), type === "Phone" ? 30 : 60);
    onToast("Calendar invite (.ics) downloaded.");
  };

  return (
    <div className="panel p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">Scheduling</h3>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["Phone", "In-Person"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-lg border py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              type === t
                ? "border-teal-400/50 bg-teal-400/10 text-teal-300"
                : "border-white/10 bg-black/20 text-slate-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <label className="mt-3 block text-[11px] font-semibold text-slate-400">{type}</label>
      <input
        type="datetime-local"
        value={slot}
        onChange={(e) => setSlot(e.target.value)}
        className="field mt-1 w-full rounded-lg px-3 py-2 text-sm"
      />

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          onClick={() => schedule(false)}
          className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-black/20 py-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:text-teal-300 cursor-pointer"
        >
          <CalendarPlus className="h-4 w-4" /> Calendar
        </button>
        <button
          onClick={invite}
          className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-black/20 py-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:text-teal-300 cursor-pointer"
        >
          <Send className="h-4 w-4" /> Invite
        </button>
        <button
          onClick={() => schedule(true)}
          className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-black/20 py-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:text-teal-300 cursor-pointer"
        >
          <BellRing className="h-4 w-4" /> Remind
        </button>
      </div>

      {events.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-white/8 pt-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 p-2.5 ${
                ev.completed ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {ev.notes?.startsWith("⏰") ? "Reminder" : ev.type} · {formatDateTime(ev.datetime)}
                </p>
                <p className="text-[10px] text-slate-500">{ev.durationMinutes} min</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onToggleEvent(ev.id, !ev.completed)}
                  title={ev.completed ? "Mark incomplete" : "Mark complete"}
                  className="rounded p-1 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteEvent(ev.id)}
                  title="Cancel"
                  className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
