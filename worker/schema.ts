import type { Candidate } from "../src/types";
import type { Env } from "./types";

// Idempotent schema. Stored JSON arrays live in TEXT columns.
// D1 runs one statement per prepare()/run(), so each statement is its own entry.
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    score INTEGER NOT NULL DEFAULT 0,
    overall_grade TEXT NOT NULL DEFAULT '',
    grade_explanation TEXT NOT NULL DEFAULT '',
    is_qualified INTEGER NOT NULL DEFAULT 0,
    key_skills TEXT NOT NULL DEFAULT '[]',
    experience_summary TEXT NOT NULL DEFAULT '',
    green_flags TEXT NOT NULL DEFAULT '[]',
    red_flags TEXT NOT NULL DEFAULT '[]',
    phone_questions TEXT NOT NULL DEFAULT '[]',
    inperson_questions TEXT NOT NULL DEFAULT '[]',
    stage TEXT NOT NULL DEFAULT 'Resume Screen',
    status TEXT NOT NULL DEFAULT 'Active',
    owner_manager TEXT NOT NULL DEFAULT 'Unassigned',
    file_name TEXT NOT NULL DEFAULT '',
    file_size INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    last_touched TEXT,
    date_added TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    candidate_name TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'Phone',
    datetime TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    notes TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_candidate ON events(candidate_id)`,
];

// Demo candidates so a fresh database looks populated (matches the screenshot).
// Safe to delete from the UI — they are only seeded when the table is empty.
const SEED_CANDIDATES: Candidate[] = [
  {
    id: "seed-pete-roberto",
    fullName: "Pete Roberto",
    email: "peteroberto@gmail.com",
    phone: "720-299-8337",
    location: "Denver",
    score: 51,
    overallGrade: "C+",
    gradeExplanation:
      "Solid internal sales-support background but lacks demonstrated outbound closing ownership and hard revenue metrics. Worth a phone screen to verify quota responsibility.",
    isQualified: false,
    keySkills: ["Inbound/Outbound Calls", "Partner Support", "Retirement Plan Sales", "Relationship Management"],
    experienceSummary:
      "Long tenure at Empower in an internal sales support capacity handling inbound/outbound calls with brokers and partners, simplifying complex retirement-plan issues for customers.",
    greenFlags: [
      "Denver-based candidate.",
      "Empower role included inbound/outbound calls with brokers and partners in an internal sales support capacity.",
      "Long tenure at Empower suggests stability and ability to operate inside a structured company system.",
      "Experience simplifying complex retirement-plan issues for customers during sensitive situations shows composure.",
    ],
    redFlags: [
      "No resume evidence of quota, revenue, gross profit, units sold, close rate, or high-ticket closing ownership.",
      "No explicit commission-based sales motivation or earnings-upside language.",
      "Internal Sales Director description appears more sales support/relationship management than direct closing; must verify actual closing responsibility.",
    ],
    phoneInterviewQuestions: [
      "Your background reads as internal sales support — walk me through a deal you personally owned start to finish and closed.",
      "What was your largest single sale, and how was your pay tied to it?",
      "How comfortable are you making 60+ cold outbound calls a day to industrial buyers?",
    ],
    inPersonInterviewQuestions: [
      "Roleplay: a warehouse ops manager says 'your forklift is $4k more than the other guy.' Close me.",
      "Describe a time you turned a flat 'no' into a signed deal.",
      "What gets you out of bed when commission is the only thing on the table?",
    ],
    stage: "Resume Screen",
    status: "Active",
    ownerManager: "Unassigned",
    fileName: "pete_roberto_resume.pdf",
    fileSize: 17408,
    notes: "",
    lastTouched: null,
    dateAdded: "2026-06-15T16:05:00.000Z",
  },
  {
    id: "seed-scott-davis",
    fullName: "Scott Davis",
    email: "scott.davis.sales@gmail.com",
    phone: "303-555-0142",
    location: "Denver",
    score: 87,
    overallGrade: "A-",
    gradeExplanation:
      "Strong outbound B2B closer with heavy-equipment exposure and concrete quota attainment. Clear fit for high-ticket forklift sales.",
    isQualified: true,
    keySkills: ["B2B Outbound Sales", "Heavy Equipment", "Quota Attainment", "Cold Calling", "Negotiation", "Territory Growth"],
    experienceSummary:
      "Five years selling construction and material-handling equipment across the Front Range. Consistently 110%+ to quota with a self-sourced pipeline.",
    greenFlags: [
      "5 years continuous tenure in heavy-equipment B2B sales.",
      "Documented 110%+ quota attainment three years running.",
      "Self-sourced pipeline via cold outreach and lot visits.",
      "Comfortable with high-ticket negotiation and financing conversations.",
    ],
    redFlags: ["Most recent role was regional; verify appetite for higher call volume."],
    phoneInterviewQuestions: [
      "Talk me through how you built your pipeline from scratch in your last territory.",
      "What's the largest deal you've closed and what made it hard?",
    ],
    inPersonInterviewQuestions: [
      "Roleplay a price-objection close on a $38k reach truck.",
      "How do you keep momentum on a 90-day enterprise fleet deal?",
    ],
    stage: "Final Decision",
    status: "Offer",
    ownerManager: "Matt R.",
    fileName: "resume_2654.pdf",
    fileSize: 24576,
    notes: "Top of the Denver list. Move fast.",
    lastTouched: "2026-06-16T18:30:00.000Z",
    dateAdded: "2026-06-12T14:20:00.000Z",
  },
  {
    id: "seed-maria-gonzales",
    fullName: "Maria Gonzales",
    email: "maria.g@outlook.com",
    phone: "720-555-7781",
    location: "Denver",
    score: 73,
    overallGrade: "B",
    gradeExplanation:
      "Strong grit and metrics from auto sales; transferable to heavy equipment with ramp-up. Worth advancing.",
    isQualified: true,
    keySkills: ["Auto Sales", "Cold Prospecting", "Closing", "CRM Discipline"],
    experienceSummary:
      "Top-3 salesperson at a high-volume auto dealership for 2+ years, heavy on outbound follow-up and finance closing.",
    greenFlags: [
      "Top-3 producer at a high-volume dealership.",
      "Relentless follow-up cadence documented in CRM.",
      "Commission-driven and competitive.",
    ],
    redFlags: ["No industrial/material-handling exposure yet."],
    phoneInterviewQuestions: [
      "Why move from auto into heavy equipment sales?",
      "Describe your daily outbound routine at the dealership.",
    ],
    inPersonInterviewQuestions: [
      "Roleplay: cold-call a warehouse manager who's never heard of us.",
      "How do you handle a 3-week silent buyer?",
    ],
    stage: "Phone Screen",
    status: "Active",
    ownerManager: "Dana K.",
    fileName: "maria_gonzales.docx",
    fileSize: 19456,
    notes: "",
    lastTouched: null,
    dateAdded: "2026-06-14T11:00:00.000Z",
  },
  {
    id: "seed-james-okafor",
    fullName: "James Okafor",
    email: "j.okafor@gmail.com",
    phone: "303-555-2390",
    location: "Denver",
    score: 64,
    overallGrade: "B-",
    gradeExplanation:
      "Decent B2B logistics background with some outbound; needs to prove closing ownership.",
    isQualified: true,
    keySkills: ["Logistics Sales", "Account Management", "Outbound Calls"],
    experienceSummary:
      "Three years in freight/logistics inside sales with a mix of account management and new-logo outreach.",
    greenFlags: ["Industrial-adjacent (logistics) experience.", "Comfortable on the phone all day."],
    redFlags: ["Heavier on account management than net-new closing.", "Thin on hard revenue numbers."],
    phoneInterviewQuestions: [
      "What share of your number came from net-new vs existing accounts?",
      "Walk me through your best self-sourced win.",
    ],
    inPersonInterviewQuestions: [
      "Roleplay a discovery call with a skeptical fleet buyer.",
      "How do you prioritize a 50-account territory?",
    ],
    stage: "Resume Screen",
    status: "Active",
    ownerManager: "Unassigned",
    fileName: "okafor_resume.pdf",
    fileSize: 21504,
    notes: "",
    lastTouched: null,
    dateAdded: "2026-06-15T09:45:00.000Z",
  },
  {
    id: "seed-ashley-tran",
    fullName: "Ashley Tran",
    email: "ashley.tran@gmail.com",
    phone: "720-555-6620",
    location: "Denver",
    score: 42,
    overallGrade: "D",
    gradeExplanation:
      "Primarily reactive retail customer service with short stints; below the auto-decline line.",
    isQualified: false,
    keySkills: ["Retail Customer Service", "POS", "Scheduling"],
    experienceSummary: "Several short retail and front-desk roles over the past two years.",
    greenFlags: ["Friendly, strong verbal communication."],
    redFlags: [
      "Job hopping: 4 roles in under 24 months.",
      "No outbound or B2B sales experience.",
      "No metrics of any kind.",
    ],
    phoneInterviewQuestions: [
      "You've held several short roles recently — what happened?",
      "How do you feel about 50 rejections a day?",
    ],
    inPersonInterviewQuestions: ["Roleplay handling a blunt 'not interested' on a cold call."],
    stage: "Resume Screen",
    status: "Hold",
    ownerManager: "Unassigned",
    fileName: "ashley_tran.docx",
    fileSize: 15360,
    notes: "",
    lastTouched: null,
    dateAdded: "2026-06-16T08:10:00.000Z",
  },
];

let initialized = false;

/** Create tables (idempotent) and seed demo rows once if the table is empty. */
export async function initDb(env: Env): Promise<void> {
  if (initialized) return;
  for (const stmt of SCHEMA_STATEMENTS) {
    await env.DB.prepare(stmt).run();
  }

  const countRow = await env.DB.prepare("SELECT COUNT(*) AS n FROM candidates").first<{ n: number }>();
  if (!countRow || Number(countRow.n) === 0) {
    for (const c of SEED_CANDIDATES) {
      await insertSeed(env, c);
    }
  }
  initialized = true;
}

async function insertSeed(env: Env, c: Candidate): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO candidates (
      id, full_name, email, phone, location, score, overall_grade, grade_explanation,
      is_qualified, key_skills, experience_summary, green_flags, red_flags,
      phone_questions, inperson_questions, stage, status, owner_manager,
      file_name, file_size, notes, last_touched, date_added
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      c.id,
      c.fullName,
      c.email,
      c.phone,
      c.location,
      c.score,
      c.overallGrade,
      c.gradeExplanation,
      c.isQualified ? 1 : 0,
      JSON.stringify(c.keySkills),
      c.experienceSummary,
      JSON.stringify(c.greenFlags),
      JSON.stringify(c.redFlags),
      JSON.stringify(c.phoneInterviewQuestions),
      JSON.stringify(c.inPersonInterviewQuestions),
      c.stage,
      c.status,
      c.ownerManager,
      c.fileName,
      c.fileSize,
      c.notes,
      c.lastTouched,
      c.dateAdded,
    )
    .run();
}
