// ---------------------------------------------------------------------------
// Shared data model for the Sales Candidate Screener.
// Imported by both the React frontend and the Cloudflare Worker (type-only).
// ---------------------------------------------------------------------------

export const STAGES = [
  "Resume Screen",
  "Phone Screen",
  "In-Person",
  "Sales Director",
  "Final Decision",
] as const;
export type Stage = (typeof STAGES)[number];

export type Status = "Active" | "Hold" | "Declined" | "Offer";

// Candidates scoring at or above this are above the auto-decline line.
export const AUTO_DECLINE_THRESHOLD = 60;

export const LOCATIONS = [
  "Denver",
  "Phoenix",
  "Dallas",
  "Houston",
  "Salt Lake City",
  "Las Vegas",
] as const;

export const SALES_MANAGERS = [
  "Unassigned",
  "Matt R.",
  "Dana K.",
  "Luis M.",
  "Priya S.",
] as const;

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  /** Overall fit score, 0–100. */
  score: number;
  overallGrade: string;
  gradeExplanation: string;
  isQualified: boolean;
  keySkills: string[];
  experienceSummary: string;
  greenFlags: string[];
  redFlags: string[];
  phoneInterviewQuestions: string[];
  inPersonInterviewQuestions: string[];
  stage: Stage;
  status: Status;
  ownerManager: string;
  fileName: string;
  /** File size in bytes. */
  fileSize: number;
  notes: string;
  /** ISO timestamp of last call/text/email touch, or null. */
  lastTouched: string | null;
  dateAdded: string; // ISO
}

export interface InterviewEvent {
  id: string;
  candidateId: string;
  candidateName: string;
  type: "Phone" | "In-Person";
  datetime: string; // ISO
  durationMinutes: number;
  notes: string;
  completed: boolean;
}

export interface CurrentUser {
  email: string;
  name: string;
  role: string; // e.g. "Sales Manager", "Sales Director", "Admin"
  locations: string[];
}

/** Shape returned by POST /api/analyze-resume (pre-persistence). */
export interface AnalysisResult {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  score: number;
  overallGrade: string;
  gradeExplanation: string;
  isQualified: boolean;
  keySkills: string[];
  experienceSummary: string;
  greenFlags: string[];
  redFlags: string[];
  phoneInterviewQuestions: string[];
  inPersonInterviewQuestions: string[];
}

export interface PipelineStats {
  "Resume Screen": number;
  "Phone Screen": number;
  "In-Person": number;
  "Sales Director": number;
  "Final Decision": number;
}
