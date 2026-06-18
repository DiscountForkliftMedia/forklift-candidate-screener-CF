# Forklift Candidate Screener

Analyze resumes for forklift / heavy-equipment B2B sales roles, grade candidates
on green & red flags, and manage interview scheduling.

This app runs entirely on **Cloudflare Workers**:

- **Frontend** — a React + Vite single-page app, served from Cloudflare static assets.
- **Document parsing** — PDF / DOCX / TXT text extraction happens **in the browser**
  (pdf.js + mammoth), so no server-side file handling is needed.
- **API** — a single Cloudflare Worker (`worker/index.ts`) that takes the extracted
  resume text and calls the Google Gemini API, returning a structured scorecard.

Everything is wired together with [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/),
which runs the Worker in the real Cloudflare runtime during local dev (with HMR).

## Prerequisites

- Node.js 18+
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your local secrets file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Then edit `.dev.vars` and set your real `GEMINI_API_KEY`.
3. Start the dev server (Vite + Worker in the Cloudflare runtime):
   ```bash
   npm run dev
   ```
   Open the printed URL (default http://localhost:5173).

## Deploy to Cloudflare

1. Authenticate Wrangler once:
   ```bash
   npx wrangler login
   ```
2. Add your Gemini API key as a production secret:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```
3. Build and deploy:
   ```bash
   npm run deploy
   ```
   This runs `vite build` and then `wrangler deploy`. Wrangler detects the Vite
   build output (`dist/`) and ships both the SPA and the Worker.

### Deploying from Git (optional)

You can also connect this repo in the Cloudflare dashboard
(**Workers & Pages → Create → Connect to Git**) with:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`

Set `GEMINI_API_KEY` as a Worker secret in the dashboard (and optionally
`GEMINI_MODEL` as a variable).

## Configuration

| Variable         | Required | Default            | Notes                                              |
| ---------------- | -------- | ------------------ | -------------------------------------------------- |
| `GEMINI_API_KEY` | Yes      | —                  | Gemini API key. Secret (`wrangler secret put`).    |
| `GEMINI_MODEL`   | No       | `gemini-3.5-flash` | Override the Gemini model used for analysis.       |

## Project structure

```
worker/index.ts          Cloudflare Worker — /api/health and /api/analyze-resume
src/                      React SPA
  utils/extractText.ts    Browser-side PDF/DOCX/TXT text extraction
wrangler.jsonc            Cloudflare Worker + static-assets config
vite.config.ts            Vite config with the Cloudflare plugin
```
