export function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export type ScoreBand = "good" | "watch" | "weak";

export function scoreBand(score: number): ScoreBand {
  if (score >= 75) return "good";
  if (score >= 50) return "watch";
  return "weak";
}

export const SCORE_COLORS: Record<ScoreBand, { text: string; hex: string }> = {
  good: { text: "text-teal-300", hex: "#2dd4bf" },
  watch: { text: "text-amber-400", hex: "#f5a524" },
  weak: { text: "text-rose-400", hex: "#fb7185" },
};

export function scoreHex(score: number): string {
  return SCORE_COLORS[scoreBand(score)].hex;
}

export function scoreTextClass(score: number): string {
  return SCORE_COLORS[scoreBand(score)].text;
}

/** "06/16/2026 04:39 PM" */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function lastTouchedLabel(iso: string | null): string {
  if (!iso) return "Not scheduled";
  return formatDateTime(iso);
}

/** Convert an ISO string to the value a <input type="datetime-local"> expects. */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}
