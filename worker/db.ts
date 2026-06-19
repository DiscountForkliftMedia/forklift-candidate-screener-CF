import type { Candidate, InterviewEvent, PipelineStats, Stage, Status } from "../src/types";
import { STAGES } from "../src/types";
import type { D1PreparedStatement, Env } from "./types";

// ---- row <-> object mapping -------------------------------------------------

function parseArray(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function rowToCandidate(row: Record<string, any>): Candidate {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    location: String(row.location ?? ""),
    score: Number(row.score ?? 0),
    overallGrade: String(row.overall_grade ?? ""),
    gradeExplanation: String(row.grade_explanation ?? ""),
    isQualified: Number(row.is_qualified ?? 0) === 1,
    keySkills: parseArray(row.key_skills),
    experienceSummary: String(row.experience_summary ?? ""),
    greenFlags: parseArray(row.green_flags),
    redFlags: parseArray(row.red_flags),
    phoneInterviewQuestions: parseArray(row.phone_questions),
    inPersonInterviewQuestions: parseArray(row.inperson_questions),
    stage: String(row.stage ?? "Resume Screen") as Stage,
    status: String(row.status ?? "Active") as Status,
    ownerManager: String(row.owner_manager ?? "Unassigned"),
    fileName: String(row.file_name ?? ""),
    fileSize: Number(row.file_size ?? 0),
    notes: String(row.notes ?? ""),
    lastTouched: row.last_touched ? String(row.last_touched) : null,
    dateAdded: String(row.date_added ?? ""),
  };
}

function rowToEvent(row: Record<string, any>): InterviewEvent {
  return {
    id: String(row.id),
    candidateId: String(row.candidate_id),
    candidateName: String(row.candidate_name ?? ""),
    type: (String(row.type) === "In-Person" ? "In-Person" : "Phone") as InterviewEvent["type"],
    datetime: String(row.datetime),
    durationMinutes: Number(row.duration_minutes ?? 30),
    notes: String(row.notes ?? ""),
    completed: Number(row.completed ?? 0) === 1,
  };
}

// ---- candidates -------------------------------------------------------------

export async function listCandidates(env: Env, locations?: string[]): Promise<Candidate[]> {
  let stmt: D1PreparedStatement;
  if (locations && locations.length > 0) {
    const placeholders = locations.map(() => "?").join(",");
    stmt = env.DB.prepare(
      `SELECT * FROM candidates WHERE location IN (${placeholders}) ORDER BY date_added DESC`,
    ).bind(...locations);
  } else {
    stmt = env.DB.prepare("SELECT * FROM candidates ORDER BY date_added DESC");
  }
  const { results } = await stmt.all<Record<string, any>>();
  return results.map(rowToCandidate);
}

export async function getCandidate(env: Env, id: string): Promise<Candidate | null> {
  const row = await env.DB.prepare("SELECT * FROM candidates WHERE id = ?").bind(id).first<Record<string, any>>();
  return row ? rowToCandidate(row) : null;
}

export async function insertCandidate(env: Env, c: Candidate): Promise<void> {
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

// Whitelist of patchable fields → column names.
const PATCHABLE: Record<string, string> = {
  stage: "stage",
  status: "status",
  ownerManager: "owner_manager",
  location: "location",
  notes: "notes",
  score: "score",
};

export async function updateCandidate(
  env: Env,
  id: string,
  patch: Record<string, unknown>,
): Promise<Candidate | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of Object.entries(PATCHABLE)) {
    if (key in patch && patch[key] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(patch[key]);
    }
  }
  if (sets.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE candidates SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
  }
  return getCandidate(env, id);
}

export async function touchCandidate(env: Env, id: string, iso: string): Promise<Candidate | null> {
  await env.DB.prepare("UPDATE candidates SET last_touched = ? WHERE id = ?").bind(iso, id).run();
  return getCandidate(env, id);
}

export async function deleteCandidate(env: Env, id: string): Promise<void> {
  await env.DB.prepare("DELETE FROM candidates WHERE id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM events WHERE candidate_id = ?").bind(id).run();
}

export async function getStats(env: Env): Promise<PipelineStats> {
  const stats = Object.fromEntries(STAGES.map((s) => [s, 0])) as unknown as PipelineStats;
  const { results } = await env.DB.prepare(
    "SELECT stage, COUNT(*) AS n FROM candidates GROUP BY stage",
  ).all<{ stage: string; n: number }>();
  for (const row of results) {
    if (row.stage in stats) {
      stats[row.stage as keyof PipelineStats] = Number(row.n);
    }
  }
  return stats;
}

// ---- events -----------------------------------------------------------------

export async function listEvents(env: Env, candidateId?: string): Promise<InterviewEvent[]> {
  let stmt: D1PreparedStatement;
  if (candidateId) {
    stmt = env.DB.prepare("SELECT * FROM events WHERE candidate_id = ? ORDER BY datetime ASC").bind(candidateId);
  } else {
    stmt = env.DB.prepare("SELECT * FROM events ORDER BY datetime ASC");
  }
  const { results } = await stmt.all<Record<string, any>>();
  return results.map(rowToEvent);
}

export async function insertEvent(env: Env, e: InterviewEvent): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO events (id, candidate_id, candidate_name, type, datetime, duration_minutes, notes, completed)
     VALUES (?,?,?,?,?,?,?,?)`,
  )
    .bind(e.id, e.candidateId, e.candidateName, e.type, e.datetime, e.durationMinutes, e.notes, e.completed ? 1 : 0)
    .run();
}

export async function updateEvent(
  env: Env,
  id: string,
  patch: { completed?: boolean; notes?: string; datetime?: string },
): Promise<InterviewEvent | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.completed !== undefined) {
    sets.push("completed = ?");
    values.push(patch.completed ? 1 : 0);
  }
  if (patch.notes !== undefined) {
    sets.push("notes = ?");
    values.push(patch.notes);
  }
  if (patch.datetime !== undefined) {
    sets.push("datetime = ?");
    values.push(patch.datetime);
  }
  if (sets.length > 0) {
    values.push(id);
    await env.DB.prepare(`UPDATE events SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  }
  const row = await env.DB.prepare("SELECT * FROM events WHERE id = ?").bind(id).first<Record<string, any>>();
  return row ? rowToEvent(row) : null;
}

export async function deleteEvent(env: Env, id: string): Promise<void> {
  await env.DB.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
}
