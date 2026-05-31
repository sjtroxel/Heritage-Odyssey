# Heritage Odyssey — Claude Code Project Instructions

Family migration and history intelligence platform. A LangGraph multi-agent pipeline (Researcher → Synthesizer → Narrator) searches a Pinecone vector store of historical emigration records and generates emotionally resonant oral-history-style voice narratives delivered via ElevenLabs TTS.

**Live:** https://heritage-odyssey.vercel.app (frontend) · https://heritage-odyssey.up.railway.app (backend)

---

## Monorepo Structure

```
server/      Express 5 + TypeScript — agents, RAG, auth, API
client/      React 19 + Vite + Tailwind v4 — Victorian Registry UI
shared/      Shared TypeScript types (consumed by both workspaces)
scripts/     Data ingestion — Pinecone document indexing
evaluation/  Python venv — Ragas + TruLens evaluation suite
project-specs/
  roadmap/   Phase spec files (PHASE_N_*.md) + ROADMAP.md
  docs/      Architecture, API integrations, narrative rubric, GEMINI.md (archived)
```

---

## Commands

```bash
# Development
npm run dev              # server + client concurrently (hot reload)

# CI gate — run all four before every push
npm run typecheck        # tsc --noEmit across all workspaces
npm run lint             # ESLint across all workspaces
npm run test             # Vitest: 62 tests (47 server + 15 client)
npm run coverage         # Coverage report
npm run build            # Build all workspaces

# Database
cd server && npx drizzle-kit generate   # Generate migration from schema changes
cd server && npx drizzle-kit push       # Apply migration to Neon production DB

# Playwright E2E (opt-in — costs OpenAI + ElevenLabs credits)
cd client && E2E_LIVE=true \
  E2E_BASE_URL=https://heritage-odyssey.vercel.app \
  E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... \
  npm run e2e

# Evaluation (Python)
npm run eval             # Run Ragas + TruLens suite
npm run eval:dashboard   # Open TruLens dashboard
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Backend | Express 5, TypeScript (strict, NodeNext modules) |
| Agent orchestration | LangGraph (`@langchain/langgraph`) — 3-node graph |
| Vector DB | Pinecone — historical emigration docs, topK=5, threshold=0.25 |
| LLM | OpenAI GPT-4o (all three agent nodes) |
| TTS | ElevenLabs (voice ID from `ELEVENLABS_VOICE_ID` env var) |
| STT | OpenAI Whisper via `transcribeAudio()` in `voiceService.ts` |
| Database | Neon PostgreSQL, Drizzle ORM, migrations in `server/drizzle/` |
| Auth | JWT — access token in `localStorage('accessToken')`, refresh via httpOnly cookie |
| Frontend | React 19, Tailwind v4, Framer Motion, Lucide React |
| Testing | Vitest (unit + integration), Playwright (E2E, opt-in only) |
| Deployment | Railway (backend), Vercel (frontend) |
| Evaluation | Python: Ragas + TruLens, `evaluation/venv/`, output in `evaluation/reports/` |

---

## Agent Architecture

Three LangGraph nodes connected in sequence with loop-back logic:

```
Researcher  →  Synthesizer  →  Narrator
     ↑__________________|  (if context insufficient, handoff to client)
```

- **Researcher** (`server/src/agents/`) — Queries Pinecone with the user's query. If retrieval score falls below 0.25, emits a `handoff` event and exits rather than passing thin context forward.
- **Synthesizer** — Takes retrieved context and drafts a historical narrative.
- **Narrator** — Refines the draft for oral delivery; the final output is what goes to ElevenLabs.

Entry point: `server/src/services/narrativeService.ts` → `generateNarrativeStream()`. This is an async generator that yields `agent_step`, `complete`, `handoff`, and `error` SSE event objects.

**Important:** The LangGraph graph itself (`server/src/agents/graph.ts`) should not need frequent edits. Query enrichment (Phase 10+) happens in `narrativeService.ts` before `graph.invoke`, not inside the graph.

---

## Database Schema

```
users               id, email, passwordHash, createdAt
                    (Phase 10: + firstName, lastName, dateOfBirth, birthLocation,
                     currentLocation, heritageRegions[], researchInterests, profileComplete)

ancestor_profiles   id, userId, name, birthRegion, era, createdAt
                    (Phase 10: + lastName, birthYear, deathYear, originCountry,
                     destination, relationship, notes)

saved_narratives    id, userId, ancestorProfileId (nullable), query, contentText, createdAt

model_usage         id, userId, modelName, promptTokens, completionTokens, totalTokens,
                    endpoint, createdAt   ← not yet wired to any endpoint
```

Migrations: `server/drizzle/`. Always run `drizzle-kit generate` first, inspect the SQL, then `drizzle-kit push` to apply to Neon.

---

## Auth Flow

Access token stored in `localStorage('accessToken')`. Refresh token is an httpOnly cookie handled server-side. `authFetch()` in `client/src/lib/api.ts` auto-refreshes on 401 by calling `POST /api/auth/refresh` and retrying the original request. All protected API routes use the `authenticate` middleware which reads `Authorization: Bearer <token>` and sets `req.user = { id }`.

---

## UI Design System — Victorian Registry Aesthetic

All UI work must respect this design language. Deviating from it creates jarring inconsistency.

**Tailwind custom colors:**
- `paper` (#f4ece1) — background, light surfaces
- `ink` — body text on paper
- `cast-iron` (#2d4a3e) — primary dark surface (header, interaction layer)
- `cast-iron-dark` (#1e3329) — deeper dark variant
- `brass` (#9a7b2f) — accent color: borders, icons, hover states, CTAs
- `stone` (#5c5651) — muted secondary text

**Fonts:**
- `font-spectral` (Spectral, serif, italic) — narrative body text, status messages
- `font-libre` (Libre Baskerville, serif) — headings, labels, uppercase tracking

**Patterns:**
- Labels are `text-[10px] font-mono uppercase tracking-widest` for the "registry stamp" feel
- Borders use `border-brass/20` to `border-brass/40` (never solid brass on everything)
- Buttons: `rounded-sm` not `rounded-lg`, thin borders over filled backgrounds
- Modals: dark backdrop `bg-black/70 backdrop-blur-sm`, `bg-paper` card with `border-brass/30`
- Status/loading: Spectral italic + Loader2 spin icon, text like "Consulting the Registry..."
- Empty states: Spectral italic, first-person Registry voice ("No records have been committed to the Registry.")

---

## Known Traps — Read These

**Railway / nixpacks devDeps:** The nixpacks builder honors only `buildCommand` and `startCommand` from `railway.toml` — **`installCommand` is ignored** (it always runs a plain `npm ci`, and the `prepare`/husky script still runs). Because Railway sets `NODE_ENV=production`, that `npm ci` omits `devDependencies`, so build-time tools (`tsc`, the `@types/*` packages) go missing and the build dies with `sh: 1: tsc: not found`, exit 127. **Fix: the `NPM_CONFIG_INCLUDE=dev` service variable** (set in the Railway dashboard) forces the full devDep set back into the build. Durable in-repo alternative: embed it in the build, e.g. `buildCommand = "npm ci --include=dev --ignore-scripts && npm run build --workspace=shared && npm run build --workspace=server"`. Note this defect is latent — Railway's Docker layer cache can preserve an old install layer that still has devDeps, so deploys pass until a cache miss exposes the real behavior. Do **not** rely on the dead `installCommand` line, and avoid `NPM_CONFIG_PRODUCTION=false` (deprecated in npm 9).

**Multiple .env files:** `server/.env` holds all real API keys. There is no root `.env`. Python evaluation scripts must load env with `load_dotenv('server/.env', override=True)` — if you use a relative path without override, they silently pick up nothing and fail with cryptic key errors.

**Playwright vs Vitest:** Playwright tests live in `client/e2e/` and are excluded from Vitest via `exclude: ['e2e/**']` in `vite.config.ts`. Running `npm run test` never touches E2E tests. Use `npm run e2e` inside `client/` for Playwright, and only with `E2E_LIVE=true` when you intend to spend API credits.

**Audio element not in DOM:** `useNarrativePipeline` creates audio via `new Audio()` — it is an in-memory object, not attached to the DOM. You cannot query it with a CSS selector. For UI state assertions about audio playback, check for the "The Record Speaks..." text that renders when `isPlaying && !isRunning`.

**Rate limiting:** All AI endpoints (`/api/narrative/generate`, `/api/narrative/tts`, `/api/voice/transcribe`) are rate-limited at 10 requests per 10 minutes per IP in production. Unit tests mock this limiter as a pass-through — don't remove that mock pattern or the test suite will fail intermittently.

**`default.sqlite`:** TruLens auto-creates this at the working directory when `evaluation/main.py` runs. It is gitignored. If it appears tracked, run `git rm --cached default.sqlite`.

---

## Deployment

| Service | Config | Notes |
| :--- | :--- | :--- |
| Railway (backend) | `railway.toml` | `--ignore-scripts` on install — see Known Traps |
| Vercel (frontend) | `vercel.json` | SPA rewrite to `/index.html` |
| Neon (database) | `server/.env → DATABASE_URL` | Remove `channel_binding=require` from URL if auth errors occur |

---

## Phase Status (as of 2026-05-29)

> **PROJECT COMPLETE.** The planned roadmap (Phases 1 through 12A) shipped in full. Heritage Odyssey is feature-complete. Remaining work is minor UI and polish only (for example, additional ElevenLabs voice options and small interface tweaks), handled ad hoc rather than as new planned phases.

| Phase | Name | Status |
| :--- | :--- | :--- |
| 1–8 | Foundation through Deployment | **COMPLETE** |
| 9 | Feature Completion & Portfolio Polish | **COMPLETE** — Saved Records, My Records, Playwright E2E, observability UI, responsive audit, load test, `AUDIT.md` all done. |
| 10 | Ancestor Profile System + Extended User Profile | **COMPLETE** — Full ancestor profile CRUD + extended user profile. 71 server + 15 client tests. |
| 11A | Genealogy Import (Depth) | **COMPLETE** — GEDCOM import, 12-field schema, per-user Pinecone namespaces, dual-source RAG, Google OAuth, demo mode. All 13 steps done, smoke test passed 2026-05-29. |
| 12A | Eval Service (Python FastAPI, Depth) | **COMPLETE** — `evaluation-service/` microservice, `eval_scores` table, 6 scorers, promptfoo CI regression suite, LangSmith production tracing, `python-eval` CI job. Shipped 2026-05-29. |

---

## Key File Locations

| What | Path |
| :--- | :--- |
| Roadmap + all phase specs | `project-specs/roadmap/` |
| Architecture + API integration docs | `project-specs/docs/` |
| Archived Gemini CLI context (Phases 1–8) | `project-specs/docs/GEMINI.md` |
| LangGraph agent graph | `server/src/agents/graph.ts` |
| LangGraph agent state type | `server/src/agents/state.ts` |
| Narrative service (pipeline entry point) | `server/src/services/narrativeService.ts` |
| Vector store / Pinecone search | `server/src/services/vectorStore.ts` |
| Auth controller (signup/login/logout/refresh) | `server/src/controllers/authController.ts` |
| Records API (save/list/delete narratives) | `server/src/routes/recordsRoutes.ts` |
| DB schema | `server/src/db/schema.ts` |
| Env validation (Zod) | `server/src/config/env.ts` |
| Main interaction UI | `client/src/components/InteractionLayer.tsx` |
| My Records panel | `client/src/components/MyRecordsPanel.tsx` |
| Narrative pipeline hook | `client/src/hooks/useNarrativePipeline.ts` |
| Auth hook (token storage) | `client/src/hooks/useAuth.ts` |
| API fetch wrapper (auto-refresh) | `client/src/lib/api.ts` |
| Playwright config | `client/playwright.config.ts` |
| E2E tests | `client/e2e/` |
| Evaluation entry point | `evaluation/main.py` |

---

## Git Conventions

- **Never run `git commit` or `git push`** — provide the commands, user runs them.
- **No `Co-Authored-By: Claude`** in commit messages.
- Read-only git diagnostics (`git status`, `git log`, `git diff`) are fine to run directly.
