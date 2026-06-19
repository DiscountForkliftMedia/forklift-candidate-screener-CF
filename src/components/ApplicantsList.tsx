import { RefreshCw } from "lucide-react";
import type { Candidate } from "../types";
import { LOCATIONS } from "../types";
import { scoreTextClass } from "../lib/format";

interface ApplicantsListProps {
  candidates: Candidate[];
  selectedId: string;
  onSelect: (id: string) => void;
  locationFilter: string;
  onLocationFilter: (v: string) => void;
  sort: string;
  onSort: (v: string) => void;
  onRefresh: () => void;
  onShowAll: () => void;
  loading: boolean;
}

export default function ApplicantsList({
  candidates,
  selectedId,
  onSelect,
  locationFilter,
  onLocationFilter,
  sort,
  onSort,
  onRefresh,
  onShowAll,
  loading,
}: ApplicantsListProps) {
  return (
    <div className="panel p-5">
      <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">Applicants</h3>

      <div className="mt-3 space-y-2">
        <select
          value={locationFilter}
          onChange={(e) => onLocationFilter(e.target.value)}
          className="field w-full rounded-lg px-3 py-2 text-xs"
        >
          <option value="mine">My locations</option>
          <option value="all">All locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="field w-full rounded-lg px-3 py-2 text-xs"
        >
          <option value="score-desc">Score high-low</option>
          <option value="score-asc">Score low-high</option>
          <option value="recent">Most recent</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/20 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={onShowAll}
            className="rounded-lg border border-white/10 bg-black/20 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:text-white cursor-pointer"
          >
            All
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {candidates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-center">
            <p className="text-xs text-slate-500">No applicants match your filters.</p>
          </div>
        ) : (
          candidates.map((c) => {
            const selected = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`block w-full rounded-lg border p-3 text-left transition-all cursor-pointer ${
                  selected
                    ? "border-l-2 border-l-teal-400 border-y-white/10 border-r-white/10 bg-white/[0.04]"
                    : "border-white/8 bg-black/20 hover:border-white/15 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-sm font-bold text-white">{c.fullName}</span>
                  <span className={`font-display text-lg font-bold ${scoreTextClass(c.score)}`}>
                    {c.score}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10px] text-slate-500">
                    {c.fileName || "—"}
                  </span>
                  <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    {c.stage}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
