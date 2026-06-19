import type { AnalysisResult } from "../src/types";
import type { Env } from "./types";

const MAX_RESUME_CHARS = 200_000;

const SYSTEM_INSTRUCTION =
  `You are an expert sales recruiter and senior hiring consultant specialized in high-ticket industrial equipment, heavy machinery, forklift, and B2B material handling equipment sales.
        Your job is to thoroughly analyze the provided candidate resume for a high-intensity Sales Representative/Sales Manager role at "Discount Forklift" and grade the applicant based on rigorous real-world metrics.

        Discount Forklift is looking for high-grit, results-oriented, driven sales professionals who can cold call, prospect, handle complex B2B material handling queries, build long-term relationships, follow up relentlessly, and close high-ticket machinery deals.

        Evaluate the applicant strictly on the following values:
        - Outbound Prospecting / Cold Calling: Have they done proactive sales, door-to-door, field B2B sales, or cold outreach? (Huge green flag)
        - Industrial/Automotive/Machinery Savvy: Do they have experience in heavy equipment rentals, car dealerships, building materials, construction, material handling, or logistics? (Green flag)
        - Performance Metrics & Numbers: Do they list concrete percentages, sales targets, quotas met, growth rates, etc.? (Massive green flag)
        - Grit & Work Ethic: Do they have stamina, competitiveness, or history of commission-driven success?
        - Job Longevity: Do they stay with employers for at least 1.5 - 2+ years? Or are they job-hoppers changing positions every few months without explanation? (Job hopping is a prominent red flag).
        - Administrative vs Proactive Sales: Are they merely doing customer service, reactive retail cash-register duty, or administrative support? (Red flag if they claim it is proactive B2B sales).

        Scoring: assign a numeric "score" from 0 to 100 representing overall fit, and a matching letter grade.
        - 90-100 => A+/A: clear high-performing B2B closer with heavy/medium equipment or direct outbound experience and solid metrics.
        - 75-89 => A-/B+/B: strong potential and direct B2B sales skills; worth interviewing.
        - 60-74 => B-/C+: marginally qualified or heavy customer-service background with transferable skills.
        - Below 60 => C/C-/D/F: unqualified, job hopper with very short stints, or complete mismatch.
        Use the full 0-100 range and be discerning. "isQualified" is true only when the score is 60 or above.

        Come up with detailed, targeted, ultra-specific feedback, GREEN FLAGS, RED FLAGS, and interview questions divided into:
        1. Over-the-Phone Interview Stage: Probing general background, investigating red flags like job hopped intervals, cold-calling willingness, and testing initial tone. (3-4 questions)
        2. In-Person Interview Stage: Probing physical presentation potential, heavy equipment negotiation, closing style, and a forklift-sales-mock-scenario/roleplay. (3-4 questions)`;

// JSON Schema for OpenAI Structured Outputs (strict mode): every property must
// be listed in `required` and objects need `additionalProperties: false`.
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    fullName: {
      type: "string",
      description: "Full name of the candidate. Fallback to 'Unknown Applicant' if not found.",
    },
    email: { type: "string", description: "Email address. Empty string if not found." },
    phone: { type: "string", description: "Phone number. Empty string if not found." },
    location: { type: "string", description: "City and state. Empty string if not found." },
    score: {
      type: "integer",
      description: "Overall fit score from 0 to 100. Use the full range and be discerning.",
    },
    overallGrade: {
      type: "string",
      description: "Letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D, or F) consistent with the score.",
    },
    gradeExplanation: { type: "string", description: "Brief rationale for the score/grade." },
    isQualified: { type: "boolean", description: "True only if score is 60 or above." },
    keySkills: {
      type: "array",
      items: { type: "string" },
      description: "4-6 most prominent skills extracted from the resume.",
    },
    experienceSummary: {
      type: "string",
      description: "Summary of professional history, highlighting sales or industrial roles.",
    },
    greenFlags: {
      type: "array",
      items: { type: "string" },
      description: "Green flags showing why they are a strong forklift sales candidate.",
    },
    redFlags: {
      type: "array",
      items: { type: "string" },
      description: "Red flags or concerns (job hopping, no B2B metrics, reactive customer service, etc.).",
    },
    phoneInterviewQuestions: {
      type: "array",
      items: { type: "string" },
      description: "3-4 targeted over-the-phone screening questions tailored to this candidate.",
    },
    inPersonInterviewQuestions: {
      type: "array",
      items: { type: "string" },
      description: "3-4 advanced situational/behavioral B2B sales questions for the in-person meeting.",
    },
  },
  required: [
    "fullName",
    "email",
    "phone",
    "location",
    "score",
    "overallGrade",
    "gradeExplanation",
    "isQualified",
    "keySkills",
    "experienceSummary",
    "greenFlags",
    "redFlags",
    "phoneInterviewQuestions",
    "inPersonInterviewQuestions",
  ],
};

// Flat shape (not a discriminated union) so it works without strictNullChecks,
// which this project's tsconfig leaves off.
export interface AnalyzeOutcome {
  ok: boolean;
  analysis?: AnalysisResult;
  status?: number;
  error?: string;
  details?: string;
}

export async function analyzeResumeText(text: string, env: Env): Promise<AnalyzeOutcome> {
  if (!text || text.trim().length === 0) {
    return {
      ok: false,
      status: 422,
      error: "The uploaded resume seems to be empty or has no readable text content.",
    };
  }

  const trimmed = text.length > MAX_RESUME_CHARS ? text.slice(0, MAX_RESUME_CHARS) : text;

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 501,
      error: "OpenAI API is not configured.",
      details:
        "Set OPENAI_API_KEY as a Cloudflare env var / secret (production) or in .dev.vars (local dev).",
    };
  }

  const model = env.OPENAI_MODEL || "gpt-4o-mini";

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: `Here is the candidate's resume content:\n\n${trimmed}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "candidate_analysis", strict: true, schema: RESPONSE_SCHEMA },
        },
      }),
    });
  } catch (networkErr: any) {
    return { ok: false, status: 502, error: "Could not reach the OpenAI API.", details: networkErr?.message };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenAI API error:", res.status, errText);
    return {
      ok: false,
      status: 502,
      error: "AI analysis failed.",
      details: `OpenAI API returned ${res.status}. ${errText.slice(0, 500)}`,
    };
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return { ok: false, status: 502, error: "Received an unreadable response from the OpenAI model." };
  }

  const choice = data?.choices?.[0];
  const message = choice?.message;
  if (message?.refusal) {
    return { ok: false, status: 502, error: "The AI declined to analyze this content.", details: message.refusal };
  }

  const responseText: string | undefined =
    typeof message?.content === "string" ? message.content.trim() : undefined;
  if (!responseText) {
    return {
      ok: false,
      status: 502,
      error: "Received empty response from the OpenAI model.",
      details: choice?.finish_reason ? `Finish reason: ${choice.finish_reason}` : undefined,
    };
  }

  try {
    const analysis = JSON.parse(responseText) as AnalysisResult;
    // Clamp score defensively.
    analysis.score = Math.max(0, Math.min(100, Math.round(Number(analysis.score) || 0)));
    return { ok: true, analysis };
  } catch (parseErr: any) {
    console.error("Failed to parse OpenAI JSON:", parseErr, responseText.slice(0, 500));
    return { ok: false, status: 502, error: "The AI returned malformed analysis data.", details: parseErr?.message };
  }
}
