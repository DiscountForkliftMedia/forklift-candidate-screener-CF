import type { Candidate } from "../types";
import { LOCATIONS, SALES_MANAGERS } from "../types";

interface OwnerPanelProps {
  candidate: Candidate;
  onPatch: (patch: Partial<Pick<Candidate, "location" | "ownerManager">>) => void;
}

export default function OwnerPanel({ candidate, onPatch }: OwnerPanelProps) {
  return (
    <div className="panel p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">Owner</h3>

      <label className="mt-4 block text-[11px] font-semibold text-slate-400">Location</label>
      <select
        value={candidate.location}
        onChange={(e) => onPatch({ location: e.target.value })}
        className="field mt-1 w-full rounded-lg px-3 py-2 text-sm"
      >
        {(LOCATIONS as readonly string[]).includes(candidate.location) ? null : (
          <option value={candidate.location}>{candidate.location}</option>
        )}
        {LOCATIONS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-[11px] font-semibold text-slate-400">Sales manager</label>
      <select
        value={candidate.ownerManager}
        onChange={(e) => onPatch({ ownerManager: e.target.value })}
        className="field mt-1 w-full rounded-lg px-3 py-2 text-sm"
      >
        {(SALES_MANAGERS as readonly string[]).includes(candidate.ownerManager) ? null : (
          <option value={candidate.ownerManager}>{candidate.ownerManager}</option>
        )}
        {SALES_MANAGERS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
