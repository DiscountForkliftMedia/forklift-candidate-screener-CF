# Sales Candidate Screener

Analyze resumes for forklift / heavy-equipment B2B sales roles, score candidates
0–100 on green & red flags, move them through a 5-stage pipeline, and manage owner
assignment, outreach, and interview scheduling.

This app runs entirely on **Cloudflare**:

- **Frontend** — a React + Vite single-page app, served from Cloudflare static assets.
- **Document parsing** — PDF / DOCX / TXT text extraction happens **in the browser**
  (pdf.js + mammoth), so no server-side file handling is needed. (Legacy binary
  `.doc` is not supported — re-save as `.docx` or PDF.)
- **API** — a single Cloudflare Worker (`worker/index.ts`) that calls the OpenAI API
  for scoring and persists candidates/events in a **Cloudflare D1** database.

Everything is wired together with [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/),
which runs the Worker + D1 in the real Cloudflare runtime during local dev (with HMR).

## Prerequisites

- Node.js 22+ (required by the Cloudflare Vite plugin / Wrangler 4)
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your local secrets file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Then edit `.dev.vars` and set your real `OPENAI_API_KEY`.
3. Start the dev server (Vite + Worker + local D1):
   ```bash
   npm run dev
   ```
   The database schema and a few demo candidates are created automatically on
   first request. Open the printed URL (default http://localhost:5173).

## Deploy to Cloudflare

1. Authenticate Wrangler once:
   ```bash
   npx wrangler login
   ```
2. Create the D1 database and paste the returned `database_id` into `wrangler.jsonc`
   (replace `local-dev-placeholder` under `d1_databases`):
   ```bash
   npx wrangler d1 create forklift-screener-db
   ```
3. Add your OpenAI API key as a production secret:
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   ```
4. Build and deploy:
   ```bash
   npm run deploy
   ```
   This runs `vite build` and then `wrangler deploy`. Wrangler ships the SPA and
   the Worker; the D1 tables (and demo seed) are created on the first request.

### Deploying from Git (optional)

Connect this repo in the Cloudflare dashboard
(**Workers & Pages → Create → Connect to Git**) with build command `npm run build`
and deploy command `npx wrangler deploy`. Set `OPENAI_API_KEY` as a Worker secret
(and optionally `OPENAI_MODEL` as a variable), and bind the D1 database.

## Authentication

Sign-in is currently **cosmetic** — `GET /api/me` returns a fixed Sales Manager.
The seam for **Microsoft Entra ID / MSAL SSO** is in place:

- `src/auth.tsx` — replace `loadUser`/`signOut` with MSAL calls.
- `worker/index.ts` `getCurrentUser()` — validate the incoming token (e.g. the
  `Cf-Access-Jwt-Assertion` header or an `Authorization: Bearer` MSAL token) and
  derive the user's email/role/locations from it.

## Configuration

| Variable         | Required | Default       | Notes                                                                          |
| ---------------- | -------- | ------------- | ------------------------------------------------------------------------------ |
| `OPENAI_API_KEY` | Yes      | —             | OpenAI API key. Set as a Worker secret / env var.                              |
| `OPENAI_MODEL`   | No       | `gpt-4o-mini` | Any model supporting Structured Outputs (e.g. `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`). |

## Project structure

```
worker/
  index.ts          Worker router — me, stats, analyze-resume, candidates, events
  openai.ts         OpenAI Structured Outputs call (0–100 scoring)
  db.ts             D1 query helpers
  schema.ts         Idempotent schema + demo seed
  types.ts          Env + minimal D1 types
src/
  App.tsx           3-column screener layout
  api.ts            Frontend API client
  auth.tsx          Cosmetic auth context (Entra/MSAL-ready)
  components/        StatTiles, UploadResume, ApplicantsList, CandidateDetail,
                     ScoreRing, OwnerPanel, TrifectaPanel, SchedulingPanel
  utils/extractText.ts   Browser-side PDF/DOCX/TXT text extraction
wrangler.jsonc      Worker + static assets + D1 binding
vite.config.ts      Vite config with the Cloudflare plugin
```
