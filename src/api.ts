import type {
  AnalysisResult,
  Candidate,
  CurrentUser,
  InterviewEvent,
  PipelineStats,
  Stage,
  Status,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data.error || data.details || "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  // Some endpoints (DELETE) return { ok: true }; callers that don't care ignore it.
  return (await res.json()) as T;
}

export const api = {
  me: () => request<CurrentUser>("/api/me"),

  stats: () => request<PipelineStats>("/api/stats"),

  listCandidates: (location?: string) =>
    request<Candidate[]>(
      `/api/candidates${location && location !== "all" ? `?location=${encodeURIComponent(location)}` : ""}`,
    ),

  analyzeResume: (text: string) =>
    request<AnalysisResult>("/api/analyze-resume", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  createCandidate: (payload: Partial<Candidate>) =>
    request<Candidate>("/api/candidates", { method: "POST", body: JSON.stringify(payload) }),

  updateCandidate: (
    id: string,
    patch: Partial<Pick<Candidate, "stage" | "status" | "ownerManager" | "location" | "notes" | "score">>,
  ) =>
    request<Candidate>(`/api/candidates/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteCandidate: (id: string) =>
    request<{ ok: boolean }>(`/api/candidates/${encodeURIComponent(id)}`, { method: "DELETE" }),

  touchCandidate: (id: string) =>
    request<Candidate>(`/api/candidates/${encodeURIComponent(id)}/touch`, { method: "POST" }),

  listEvents: (candidateId?: string) =>
    request<InterviewEvent[]>(
      `/api/events${candidateId ? `?candidateId=${encodeURIComponent(candidateId)}` : ""}`,
    ),

  createEvent: (payload: Partial<InterviewEvent>) =>
    request<InterviewEvent>("/api/events", { method: "POST", body: JSON.stringify(payload) }),

  updateEvent: (id: string, patch: { completed?: boolean; notes?: string; datetime?: string }) =>
    request<InterviewEvent>(`/api/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteEvent: (id: string) =>
    request<{ ok: boolean }>(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// Re-export stage/status types for component convenience.
export type { Stage, Status };
