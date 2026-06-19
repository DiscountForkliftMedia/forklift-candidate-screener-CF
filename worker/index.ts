/**
 * Cloudflare Worker — Discount Forklift Sales Candidate Screener API.
 *
 * Runs on the Cloudflare Workers runtime (workerd). Responsibilities:
 *   - GET  /api/health                  liveness probe
 *   - GET  /api/me                      current user (cosmetic; Entra/MSAL-ready seam)
 *   - GET  /api/stats                   pipeline counts by stage
 *   - POST /api/analyze-resume          { text } -> OpenAI structured analysis (incl. 0-100 score)
 *   - GET  /api/candidates[?location=]  list candidates (D1)
 *   - POST /api/candidates              create from an analysis result
 *   - GET/PATCH/DELETE /api/candidates/:id
 *   - POST /api/candidates/:id/touch    record a Call/Text/Email touch
 *   - GET/POST /api/events[?candidateId=]
 *   - PATCH/DELETE /api/events/:id
 *
 * Document text extraction happens in the browser (src/utils/extractText.ts).
 * Everything non-API is served by the static-assets layer (the built SPA).
 */

import type { Candidate, CurrentUser, InterviewEvent } from "../src/types";
import type { Env } from "./types";
import { initDb } from "./schema";
import { analyzeResumeText } from "./openai";
import {
  deleteCandidate,
  deleteEvent,
  getCandidate,
  getStats,
  insertCandidate,
  insertEvent,
  listCandidates,
  listEvents,
  touchCandidate,
  updateCandidate,
  updateEvent,
} from "./db";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Current authenticated user. Cosmetic for now — returns a fixed Sales Manager.
 * TODO (Entra/MSAL): validate the incoming token here (e.g. the
 * `Cf-Access-Jwt-Assertion` header from Cloudflare Access, or an
 * `Authorization: Bearer` MSAL token) and derive email/role/locations from it.
 */
function getCurrentUser(_request: Request): CurrentUser {
  return {
    email: "matt@discountforklift.us",
    name: "Matt R.",
    role: "Sales Manager",
    locations: ["Denver"],
  };
}

async function handleApi(request: Request, env: Env, pathname: string): Promise<Response> {
  const method = request.method;
  const segments = pathname.split("/").filter(Boolean); // e.g. ["api","candidates","abc"]
  const url = new URL(request.url);

  // /api/health
  if (segments.length === 2 && segments[1] === "health") {
    return json({ status: "ok", time: new Date().toISOString() });
  }

  // /api/me
  if (segments.length === 2 && segments[1] === "me" && method === "GET") {
    return json(getCurrentUser(request));
  }

  // Everything below touches D1.
  await initDb(env);

  // /api/stats
  if (segments.length === 2 && segments[1] === "stats" && method === "GET") {
    return json(await getStats(env));
  }

  // /api/analyze-resume
  if (segments.length === 2 && segments[1] === "analyze-resume") {
    if (method !== "POST") return json({ error: "Method not allowed. Use POST." }, 405);
    const body = await readJson<{ text?: string }>(request);
    if (!body || typeof body.text !== "string") {
      return json({ error: "Invalid request body. Expected JSON with a 'text' field." }, 400);
    }
    const outcome = await analyzeResumeText(body.text, env);
    if (outcome.ok && outcome.analysis) {
      return json(outcome.analysis);
    }
    return json({ error: outcome.error, details: outcome.details }, outcome.status ?? 502);
  }

  // /api/candidates and /api/candidates/:id[/touch]
  if (segments[1] === "candidates") {
    // Collection
    if (segments.length === 2) {
      if (method === "GET") {
        const loc = url.searchParams.get("location");
        const locations = loc && loc !== "all" ? [loc] : undefined;
        return json(await listCandidates(env, locations));
      }
      if (method === "POST") {
        return createCandidate(request, env);
      }
      return json({ error: "Method not allowed." }, 405);
    }

    const id = decodeURIComponent(segments[2]);

    // /api/candidates/:id/touch
    if (segments.length === 4 && segments[3] === "touch" && method === "POST") {
      const updated = await touchCandidate(env, id, new Date().toISOString());
      if (!updated) return json({ error: "Candidate not found." }, 404);
      return json(updated);
    }

    // /api/candidates/:id
    if (segments.length === 3) {
      if (method === "GET") {
        const c = await getCandidate(env, id);
        return c ? json(c) : json({ error: "Candidate not found." }, 404);
      }
      if (method === "PATCH") {
        const patch = await readJson<Record<string, unknown>>(request);
        if (!patch) return json({ error: "Invalid request body." }, 400);
        const updated = await updateCandidate(env, id, patch);
        return updated ? json(updated) : json({ error: "Candidate not found." }, 404);
      }
      if (method === "DELETE") {
        await deleteCandidate(env, id);
        return json({ ok: true });
      }
      return json({ error: "Method not allowed." }, 405);
    }
  }

  // /api/events and /api/events/:id
  if (segments[1] === "events") {
    if (segments.length === 2) {
      if (method === "GET") {
        const candidateId = url.searchParams.get("candidateId") || undefined;
        return json(await listEvents(env, candidateId));
      }
      if (method === "POST") {
        return createEvent(request, env);
      }
      return json({ error: "Method not allowed." }, 405);
    }
    const id = decodeURIComponent(segments[2]);
    if (segments.length === 3) {
      if (method === "PATCH") {
        const patch = await readJson<{ completed?: boolean; notes?: string; datetime?: string }>(request);
        if (!patch) return json({ error: "Invalid request body." }, 400);
        const updated = await updateEvent(env, id, patch);
        return updated ? json(updated) : json({ error: "Event not found." }, 404);
      }
      if (method === "DELETE") {
        await deleteEvent(env, id);
        return json({ ok: true });
      }
      return json({ error: "Method not allowed." }, 405);
    }
  }

  return json({ error: "Not found." }, 404);
}

async function createCandidate(request: Request, env: Env): Promise<Response> {
  const body = await readJson<Partial<Candidate> & { score?: number }>(request);
  if (!body || !body.fullName) {
    return json({ error: "Invalid candidate payload (missing fullName)." }, 400);
  }

  const now = new Date().toISOString();
  const candidate: Candidate = {
    id: crypto.randomUUID(),
    fullName: body.fullName,
    email: body.email ?? "",
    phone: body.phone ?? "",
    // location is the branch/office, defaulting to the upload location.
    location: body.location || "Denver",
    score: Math.max(0, Math.min(100, Math.round(Number(body.score ?? 0)))),
    overallGrade: body.overallGrade ?? "",
    gradeExplanation: body.gradeExplanation ?? "",
    isQualified: Boolean(body.isQualified),
    keySkills: Array.isArray(body.keySkills) ? body.keySkills : [],
    experienceSummary: body.experienceSummary ?? "",
    greenFlags: Array.isArray(body.greenFlags) ? body.greenFlags : [],
    redFlags: Array.isArray(body.redFlags) ? body.redFlags : [],
    phoneInterviewQuestions: Array.isArray(body.phoneInterviewQuestions) ? body.phoneInterviewQuestions : [],
    inPersonInterviewQuestions: Array.isArray(body.inPersonInterviewQuestions)
      ? body.inPersonInterviewQuestions
      : [],
    stage: "Resume Screen",
    status: "Active",
    ownerManager: body.ownerManager || "Unassigned",
    fileName: body.fileName ?? "",
    fileSize: Number(body.fileSize ?? 0),
    notes: body.notes ?? "",
    lastTouched: null,
    dateAdded: now,
  };

  await insertCandidate(env, candidate);
  return json(candidate, 201);
}

async function createEvent(request: Request, env: Env): Promise<Response> {
  const body = await readJson<Partial<InterviewEvent>>(request);
  if (!body || !body.candidateId || !body.datetime) {
    return json({ error: "Invalid event payload (candidateId and datetime required)." }, 400);
  }
  const event: InterviewEvent = {
    id: crypto.randomUUID(),
    candidateId: body.candidateId,
    candidateName: body.candidateName ?? "",
    type: body.type === "In-Person" ? "In-Person" : "Phone",
    datetime: body.datetime,
    durationMinutes: Number(body.durationMinutes ?? 30),
    notes: body.notes ?? "",
    completed: Boolean(body.completed),
  };
  await insertEvent(env, event);
  return json(event, 201);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url.pathname);
      } catch (err: any) {
        console.error("Worker API error:", err);
        return json({ error: "Internal server error.", details: err?.message || String(err) }, 500);
      }
    }

    // Everything else: serve the built SPA / static assets.
    return env.ASSETS.fetch(request);
  },
};
