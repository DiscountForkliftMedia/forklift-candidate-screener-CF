import { scoreHex, scoreTextClass } from "../lib/format";

interface ScoreRingProps {
  score: number;
  size?: number;
  stroke?: number;
}

export default function ScoreRing({ score, size = 92, stroke = 8 }: ScoreRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const color = scoreHex(clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#16211f"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease", filter: `drop-shadow(0 0 5px ${color}66)` }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-display font-bold ${scoreTextClass(
          clamped,
        )}`}
        style={{ fontSize: size * 0.3 }}
      >
        {clamped}
      </span>
    </div>
  );
}
