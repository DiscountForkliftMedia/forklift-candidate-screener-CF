import type { PipelineStats, Stage } from "../types";
import { STAGES } from "../types";

const STAGE_COLOR: Record<Stage, string> = {
  "Resume Screen": "#2dd4bf",
  "Phone Screen": "#22d3ee",
  "In-Person": "#a855f7",
  "Sales Director": "#f5a524",
  "Final Decision": "#f5a524",
};

interface StatTilesProps {
  stats: PipelineStats;
  active: Stage | null;
  onSelect: (stage: Stage) => void;
}

export default function StatTiles({ stats, active, onSelect }: StatTilesProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
      {STAGES.map((stage) => {
        const color = STAGE_COLOR[stage];
        const isActive = active === stage;
        return (
          <button
            key={stage}
            onClick={() => onSelect(stage)}
            className="stat-tile px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{
              borderColor: color,
              boxShadow: isActive
                ? `0 0 0 1px ${color}, 0 0 16px ${color}55`
                : `0 0 10px ${color}22`,
            }}
            title={`Filter by ${stage}`}
          >
            <div className="font-display text-2xl font-bold leading-none text-white">
              {stats[stage] ?? 0}
            </div>
            <div
              className="mt-1 text-[10px] font-semibold uppercase tracking-wider leading-tight"
              style={{ color }}
            >
              {stage}
            </div>
          </button>
        );
      })}
    </div>
  );
}
