import { Phone, MessageSquare, Mail } from "lucide-react";
import type { Candidate } from "../types";
import { lastTouchedLabel } from "../lib/format";

interface TrifectaPanelProps {
  candidate: Candidate;
  onTouch: () => void;
}

export default function TrifectaPanel({ candidate, onTouch }: TrifectaPanelProps) {
  const open = (href: string) => {
    onTouch();
    window.location.href = href;
  };

  const buttons = [
    { label: "Call", icon: Phone, href: candidate.phone ? `tel:${candidate.phone}` : null },
    { label: "Text", icon: MessageSquare, href: candidate.phone ? `sms:${candidate.phone}` : null },
    { label: "Email", icon: Mail, href: candidate.email ? `mailto:${candidate.email}` : null },
  ];

  return (
    <div className="panel p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">Trifecta</h3>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {buttons.map((b) => (
          <button
            key={b.label}
            disabled={!b.href}
            onClick={() => b.href && open(b.href)}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 py-3 text-xs font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <b.icon className="h-4 w-4" />
            {b.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Last touched: <span className="text-slate-300">{lastTouchedLabel(candidate.lastTouched)}</span>
      </p>
    </div>
  );
}
