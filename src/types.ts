export type GradeSymbol = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F";

export interface Candidate {
  id: string; // unique slug/UUID
  fullName: string;
  email: string;
  phone: string;
  location: string;
  overallGrade: GradeSymbol | string;
  gradeExplanation: string;
  isQualified: boolean;
  keySkills: string[];
  experienceSummary: string;
  greenFlags: string[];
  redFlags: string[];
  phoneInterviewQuestions: string[];
  inPersonInterviewQuestions: string[];
  status: CandidateStatus;
  dateAdded: string; // ISO date string
  notes?: string;
}

export type CandidateStatus =
  | "Screened"
  | "Phone Scheduled"
  | "Phone Completed"
  | "In-Person Scheduled"
  | "In-Person Completed"
  | "Hired"
  | "Not Fit";

export interface InterviewEvent {
  id: string;
  candidateId: string;
  candidateName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
  stage: "Phone" | "In-Person";
  notes?: string;
  completed?: boolean;
}
