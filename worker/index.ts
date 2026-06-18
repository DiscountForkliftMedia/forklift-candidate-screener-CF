/**
 * Cloudflare Worker — Forklift Candidate Screener API
 *
 * This replaces the old Node/Express server (server.ts). It runs on the
 * Cloudflare Workers runtime (workerd), which is NOT Node.js, so it has zero
 * Node-only dependencies: no express, multer, pdf-parse or the @google/genai
 * SDK. Document text extraction now happens in the browser (see
 * src/utils/extractText.ts) and this Worker only:
 *
 *   1. GET  /api/health         — liveness probe
 *   2. POST /api/analyze-resume — takes { text } JSON, calls the Gemini REST
 *                                 API, returns the structured analysis JSON.
 *
 * Everything else is served by Cloudflare's static-assets layer (the built
 * Vite SPA), with the SPA fallback configured in wrangler.jsonc.
 */

export interface Env {
  /** Static assets binding (the built Vite SPA in ./dist/client). */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  /** Gemini API key. Set via `wrangler secret put GEMINI_API_KEY` (prod) or .dev.vars (local). */
  GEMINI_API_KEY: string;
  /** Optional model override. Defaults to gemini-3.5-flash. */
  GEMINI_MODEL?: string;
}

const MAX_RESUME_CHARS = 200_000;

// Mirrors the original prompt from server.ts verbatim so grading behaviour is unchanged.
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

        Provide your grading objectively:
        - Grade A+/A/A-: Clear high-performing B2B sales professional with heavy/medium equipment or direct relevant outbound experience, solid metrics. Great fit.
        - Grade B+/B/B-: Strong potential, maybe lack industrial specific experience but show high grit, sales numbers, and direct B2B sales skills. Worth interviewing.
        - Grade C+/C/C-: Marginally qualified, heavy customer service background, or lacking outbound/sales experience but possesses transferable skills.
        - Grade D/F: Unqualified. No sales focus, job hopper with extremely short stints, or complete mismatch in career path.

        Come up with detailed, targeted, ultra-specific feedback, GREEN FLAGS, RED FLAGS, and interview questions divided into:
        1. Over-the-Phone Interview Stage: Probing general background, investigating red flags like job hopped intervals, cold-calling willingness, and testing initial tone. (3-4 questions)
        2. In-Person Interview Stage: Probing physical presentation potential, heavy equipment negotiation, closing style, and a forklift-sales-mock-scenario/roleplay. (3-4 questions)`;

// Gemini REST responseSchema (OpenAPI subset). Identical fields/required to the
// original @google/genai schema — Type.STRING etc. map to these uppercase strings.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    fullName: {
      type: "STRING",
      description:
        "Full name of the candidate, e.g., 'John Doe'. Fallback to 'Unknown Applicant' if not found.",
    },
    email: { type: "STRING", description: "Email address. Return empty string if not found." },
    phone: { type: "STRING", description: "Phone number. Return empty string if not found." },
    location: {
      type: "STRING",
      description: "City and state, or location details. Return empty string if not found.",
    },
    overallGrade: {
      type: "STRING",
      description: "The assigned letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D, or F).",
    },
    gradeExplanation: {
      type: "STRING",
      description: "Brief rationale explaining why they got this overall grade.",
    },
    isQualified: {
      type: "BOOLEAN",
      description: "True if the candidate is Grade B- or above, False if marginally or unqualified.",
    },
    keySkills: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of 4-6 most prominent skills extracted from the resume.",
    },
    experienceSummary: {
      type: "STRING",
      description:
        "A summary of their professional work history, highlighting sales positions or industrial roles.",
    },
    greenFlags: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "List of green flags identifying why they are a strong candidate for forklift sales.",
    },
    redFlags: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "List of red flags or concerns (e.g. job hopping, no B2B metric evidence, reactive customer service, etc.).",
    },
    phoneInterviewQuestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "3-4 custom targeted over-the-phone screening questions tailored to this candidate's history and potential weaknesses/background.",
    },
    inPersonInterviewQuestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "3-4 advanced situational/behavioral B2B sales interview questions for the in-person meeting.",
    },
  },
  required: [
    "fullName",
    "email",
    "phone",
    "location",
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function analyzeResume(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  // 1. Read the extracted resume text (extraction happens client-side now).
  let text = "";
  try {
    const body = (await request.json()) as { text?: string };
    text = typeof body?.text === "string" ? body.text : "";
  } catch {
    return json({ error: "Invalid request body. Expected JSON with a 'text' field." }, 400);
  }

  if (!text || text.trim().length === 0) {
    return json(
      { error: "The uploaded resume seems to be empty or has no readable text content." },
      422,
    );
  }

  // Guard against oversized payloads blowing past model/context limits.
  if (text.length > MAX_RESUME_CHARS) {
    text = text.slice(0, MAX_RESUME_CHARS);
  }

  // 2. Verify the Gemini API key is configured.
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return json(
      {
        error: "Gemini API is not configured.",
        details:
          "Set GEMINI_API_KEY via `wrangler secret put GEMINI_API_KEY` (production) or in .dev.vars (local dev).",
      },
      501,
    );
  }

  const model = env.GEMINI_MODEL || "gemini-3.5-flash";

  // 3. Call the Gemini REST API directly (no SDK — keeps the Worker dependency-free).
  let geminiRes: Response;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [
            { role: "user", parts: [{ text: `Here is the candidate's resume content:\n\n${text}` }] },
          ],
          generationConfig: {
            temperature: 0.2, // low temp for accurate extraction
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );
  } catch (networkErr: any) {
    return json(
      {
        error: "Could not reach the Gemini API.",
        details: networkErr?.message || String(networkErr),
      },
      502,
    );
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    console.error("Gemini API error:", geminiRes.status, errText);
    return json(
      {
        error: "AI analysis failed.",
        details: `Gemini API returned ${geminiRes.status}. ${errText.slice(0, 500)}`,
      },
      502,
    );
  }

  // 4. Extract and parse the model's JSON response.
  let data: any;
  try {
    data = await geminiRes.json();
  } catch {
    return json({ error: "Received an unreadable response from the Gemini model." }, 502);
  }

  const candidate = data?.candidates?.[0];
  const responseText: string | undefined = candidate?.content?.parts
    ?.map((p: any) => p?.text || "")
    .join("")
    .trim();

  if (!responseText) {
    // Surface safety blocks / empty completions clearly.
    const finishReason = candidate?.finishReason || data?.promptFeedback?.blockReason;
    return json(
      {
        error: "Received empty response from Gemini model.",
        details: finishReason ? `Finish reason: ${finishReason}` : undefined,
      },
      502,
    );
  }

  try {
    return json(JSON.parse(responseText));
  } catch (parseErr: any) {
    console.error("Failed to parse Gemini JSON:", parseErr, responseText.slice(0, 500));
    return json(
      { error: "The AI returned malformed analysis data.", details: parseErr?.message },
      502,
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ status: "ok", time: new Date().toISOString() });
    }

    if (url.pathname === "/api/analyze-resume") {
      try {
        return await analyzeResume(request, env);
      } catch (err: any) {
        console.error("Resume Analysis Worker Error:", err);
        return json(
          {
            error: "An error occurred during resume processing or AI analysis.",
            details: err?.message || String(err),
          },
          500,
        );
      }
    }

    // Any unknown /api/* route → 404 JSON (don't fall through to the SPA shell).
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, 404);
    }

    // Everything else: serve the built SPA / static assets.
    return env.ASSETS.fetch(request);
  },
};
