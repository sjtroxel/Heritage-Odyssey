# Heritage Odyssey Roadmap

| Phase | Name | Status | Key Goal |
| :--- | :--- | :--- | :--- |
| 1 | **Foundation** | COMPLETE | Set up the monorepo structure and development environment. |
| 2 | **Database & Auth** | COMPLETE | Implement Neon PostgreSQL schema with Drizzle ORM and JWT-based authentication. |
| 3 | **Data & RAG** | COMPLETE | Implement document ingestion and vector storage via Pinecone. |
| 4 | **Agent Swarm** | COMPLETE | Build the LangGraph orchestration for historical narrative generation. |
| 5 | **Voice & UI** | COMPLETE | Integrate ElevenLabs/Whisper and develop the frontend interface. |
| 6 | **Evaluation** | COMPLETE | Implement Ragas/TruLens for validation of historical accuracy. |
| 7 | **UI Overhaul & Pre-Deployment Polish** | COMPLETE | Fix functional bugs, redesign UI to historical theme, verify end-to-end locally before deployment. |
| 8 | **Deployment & Launch** | COMPLETE | Finalize production deployment and verify platform stability. |
| 9 | **Feature Completion & Portfolio Polish** | COMPLETE | Implement Saved Records, close test/polish carry-overs from Phase 8, add `AUDIT.md` pre-ship cleanup. |
| 10 | **Ancestor Profile System & Extended User Profile** | COMPLETE | Extended user profile (name, DOB, location, heritage regions, research interests); expanded ancestor profile schema; personalized narrative generation. |
| — | **🔀 Strategic Fork** | PATH CHOSEN: 11A | Chose Path A (Depth). Phase 11A complete 2026-05-29. Phase 12 decision (12A vs 12B) pending. |
| 11A | **Genealogy Import (Depth)** | COMPLETE | Full GEDCOM import + 12-field schema + multi-event parsing + per-user namespaces + dual-source RAG + Google OAuth/demo. Smoke test passed 2026-05-29. |
| 11B | **Genealogy Import (Velocity)** | PATH OPTION | GEDCOM import (core fields) + 6-field schema + per-user namespaces + dual-source RAG + Google OAuth/demo. ~4-5 weeks. |
| 12A | **Python FastAPI Eval Service (Depth)** | PATH OPTION | Full FastAPI microservice, second Railway deployment, eval_scores table, 6-dimension HTTP API. ~3-4 weeks. |
| 12B | **Eval Infrastructure (Velocity)** | PATH OPTION | Promptfoo CI + LangSmith env vars + extended `evaluation/` Python with LLM-as-judge. ~1.5-2 weeks. |
| 13 | **Migration Map** | SPECCED | Interactive migration map driven by real geographic data from imported GEDCOM records. Independent of path choice. Specced for design signal; build timing TBD. |

---

## Detailed Phase Breakdown

### Phase 1: Foundation [COMPLETE]
*   **Deliverables:**
    1. Monorepo workspace configuration (`server`, `client`, `shared`).
    2. Express 5 boilerplate with `app.ts`/`server.ts` split.
    3. Vite + React 19 frontend boilerplate.
    4. Linting/type-checking (ESLint, Prettier, TypeScript `strict: true`) suite.
    5. Unit testing framework (Vitest) configuration with mocks.
    6. Environment variable validation schema (e.g., using Zod).
*   **Risks:** Ensuring `NodeNext` resolution is strictly followed across workspaces to avoid module errors.
*   **Done:** All local development environments are initialized, passing lint/type checks, and running base unit tests.

### Phase 2: Database & Auth [COMPLETE]
*   **Deliverables:**
    1. Neon PostgreSQL provisioning and connection pooling.
    2. Drizzle ORM schema (`users`, `ancestor_profiles`, `saved_narratives` tables).
    3. `drizzle-kit` migrations.
    4. JWT signup/login/logout/refresh endpoints.
    5. Auth middleware (`server/src/middleware/auth.ts`).
    6. Shared types for `User` and `AuthResponse`.
*   **Risks:** JWT security best practices; Drizzle and `postgres.js` compatibility with `NodeNext` module resolution.
*   **Done:** Schema implemented with Drizzle. Migrations generated and ready. Signup, login, logout, and refresh endpoints functional with JWT rotation. Auth middleware implemented and tested. Integration tests in `server/tests/auth.test.ts` provide coverage for all auth flows.

### Phase 3: Data & RAG [COMPLETE]
*   **Deliverables:**
    1. Pinecone project and index creation.
    2. Historical document ingestion script.
    3. Document parsing/chunking logic.
    4. Embedding generation service (Model: TBD).
    5. Vector store search/retrieval service.
    6. Data integrity/schema mapping logic.
*   **Risks:** Ensuring accurate retrieval of historical context; managing embedding token costs.
*   **Done:** A populated Pinecone index that supports semantic search of historical documents with verified retrieval latency.

### Phase 4: Agent Swarm [COMPLETE]
*   **Deliverables:**
    1. LangGraph environment setup.
    2. Primary "Narrator" agent definition.
    3. "Researcher" agent with historical data access.
    4. "Synthesizer" agent for emotional storytelling.
    5. State management schema for LangGraph.
    6. Tool definitions for historical query handling.
    7. Prompt templates for historical and emotional accuracy.
*   **Risks:** Preventing "hallucinations" in historical narratives; agent loop optimization.
*   **Done:** Multi-agent orchestration layer implemented using LangGraph. Researcher, Synthesizer, and Narrator nodes are connected with loop-back logic for fact-checking. Insufficient retrieval handoff implemented. Service integration and tests in `server/tests/agents/graph.test.ts` verify the full flow.

### Phase 5: Voice & UI [COMPLETE]
*   **Deliverables:**
    1. OpenAI Whisper STT integration.
    2. ElevenLabs TTS integration.
    3. Frontend audio streaming component.
    4. Mobile-responsive React 19 UI (Tailwind v4).
    5. Query input mechanism (voice/text).
    6. Narrative output visualization.
*   **Risks:** Latency in audio generation/streaming; cross-platform audio compatibility.
*   **Done:** STT and TTS services implemented. Backend provides a streaming endpoint for audio narratives. Frontend includes a mobile-first UI with audio recording and playback integration. Integration tests in `server/tests/routes/voiceRoutes.test.ts` verify the end-to-end backend voice flow.

### Phase 6: Evaluation [COMPLETE]
*   **Deliverables:**
    1. Ragas/TruLens evaluation framework setup. [DONE]
    2. Test dataset creation (Historical query/answer pairs). [DONE]
    3. "Accuracy" evaluation module. [DONE]
    4. "Retrieval" quality scoring module. [DONE]
    5. Automated evaluation report generator. [DONE]
*   **Risks:** Defining "ground truth" for subjective oral-history-style narratives.
*   **Done:** Python evaluation environment initialized with `ragas` and `trulens-eval`. Golden dataset (`golden_set.json`) populated. Backend trace capture (`evalService`) implemented. Ragas scoring script (`evaluation/main.py`) successfully executed against captured traces, generating automated reports in `evaluation/reports/summary.json`.

### Phase 7: UI Overhaul & Pre-Deployment Polish [COMPLETE]
*   **Deliverables:**
    1. Visual redesign of the frontend to match a "historical archive" aesthetic. [DONE]
    2. Implementation of a global error handling system for the voice/narrative pipeline. [DONE]
    3. Refinement of the `AudioVisualizer` component for smoother animations. [DONE]
    4. Integration of Framer Motion scroll animations for marketing feel. [DONE]
    5. Integration of historical photo/video assets for grounded aesthetics. [DONE]
    6. Manual bug bash covering edge cases in agent handoffs. [DONE]
    7. Local E2E verification of the full user flow. [DONE]
*   **Risks:** UI redesign introducing regressions in existing mobile-responsive layouts.
*   **Done:** UI transformed to "Victorian Record Office" aesthetic with Framer Motion animations and historical media. Bug fixes for Vite proxy, CSS conflicts, and Auth UI completed. Retrieval threshold tuned to 0.5 with active score logging. All tests passing (51/51).

### Phase 8: Deployment & Launch [COMPLETE]
*   **Deliverables:**
    1. Production security hardening — Helmet headers, CORS restricted to Vercel origin, Zod input validation on all endpoints. [DONE]
    2. Railway configuration for Express backend (`railway.toml`). [DONE]
    3. Vercel configuration for React + Vite frontend. [DONE]
    4. Production environment variable management (Railway + Vercel dashboards). [DONE]
    5. AI-specific rate limits (10 req / 10 min) for all narrative/voice endpoints. [DONE]
    6. SSE agent observability — LangGraph node progress (researcher → synthesizer → narrator) streamed to client in real time via Server-Sent Events. [DONE]
    7. Dedicated TTS endpoint (`POST /api/narrative/tts`) decoupled from LangGraph pipeline; re-narrate path uses stored text directly. [DONE]
    8. Rate-limit countdown UI, `× New Query` reset, paragraph-split narrative rendering, retrieval threshold tuned to 0.25. [DONE]
    9. Narrative modal overlay with Victorian "Historical Record" aesthetic and Pause/Resume controls, replacing the inline panel. [DONE]
    10. Collapsible agent observability log — per-node meta (contextCount, draftLength, scriptLength) in terminal-style panel. [DONE]
    11. Unit tests for `generateNarrativeStream` — 4 tests: agent_step events, complete event, handoff path, error propagation. [DONE]
    12. Unit tests for SSE generate route and TTS route — 7 tests; rate limiter mocked as pass-through. [DONE]
*   **Risks:** Environment differences between staging/prod; CORS and deployment-specific security configs.
*   **Done:** Backend live on Railway, frontend live on Vercel. Security headers, CORS, Zod input validation, and rate limiting fully implemented. SSE observability streams real-time LangGraph node progress to the UI. Full test suite: 62 tests (47 server + 15 client), all passing. Playwright E2E tests and `autocannon` load testing formally deferred to Phase 9.

### Phase 9: Feature Completion & Portfolio Polish [IN PROGRESS]
*   **Deliverables:**
    1. **Unit tests (carry-over from Phase 8)** — `generateNarrativeStream` tests in `narrativeService.test.ts`; SSE and TTS route tests in `voiceRoutes.test.ts`. [DONE]
    2. **Narrative modal overlay** — High-contrast "Historical Record" modal with Pause/Resume controls. [DONE]
    3. **Saved Records feature** — Schema migration (`savedNarratives.ancestorProfileId` → nullable), `POST /api/records`, `GET /api/records`, and `DELETE /api/records/:id` endpoints, and "Save to Records" button in the narrative modal. [PLANNED]
    4. **My Records UI** — Replace the dead "Explore the Map" stub with "My Records". Modal/panel listing saved narratives; each card has a Re-Narrate button (calls `/api/narrative/tts` with stored text, skipping LangGraph re-run) and a Delete button. [PLANNED]
    5. **Playwright E2E tests** — Flow 1 (text input path) and Flow 2 (simulated voice input) against production URLs, gated by `E2E_LIVE=true`. Carried from Phase 8. [PLANNED]
    6. **Agent observability UI polish** — Better visual treatment for agent step labels during pipeline execution; sample queries moved below input bar; modal-first pattern for secondary UI. [PLANNED]
    7. **Cross-device responsive audit** — Systematic breakpoint pass (< 375px, 375–430px, 768px, 1024px, 1280px+). Run after E2E tests are in place. [PLANNED]
    8. **Load testing report** — `autocannon` run against Railway TTS endpoint, 5–10 concurrent users, 30-second duration. Carried from Phase 8. [PLANNED]
    9. **`AUDIT.md` pre-ship cleanup pass** — `depcheck`, `ts-prune`, console/TODO grep, and typecheck/lint/test status documented at repo root. Engineering-maturity signal visible to any reviewer. Per `feedback_audit_md_pattern`. [PLANNED]
*   **Risks:** Production schema migration via `drizzle-kit push` — sequence carefully. Playwright E2E tests consume real OpenAI/ElevenLabs credits; `E2E_LIVE=true` gate required in CI.
*   **Done:** Unit tests for `generateNarrativeStream`, SSE generate route, and TTS route complete and passing (62 tests total). Narrative modal overlay finalized during Phase 8. Seven deliverables remain.

### Phase 10: Ancestor Profile System [PLANNED]
*   **Deliverables:**
    1. **Ancestor Profile CRUD** — `POST /api/ancestors`, `GET /api/ancestors`, `PATCH /api/ancestors/:id`, `DELETE /api/ancestors/:id`. The `ancestor_profiles` table has been in the database since Phase 2; this phase wires it to the UI. [PLANNED]
    2. **My Ancestors panel** — Modal/panel listing the user's ancestor profiles with create, edit, delete, and "Narrate" actions. [PLANNED]
    3. **Query enrichment** — When a narrative request includes an `ancestorId`, `narrativeService.ts` fetches the profile and enriches the query with the ancestor's name, birth region, and era before passing it to LangGraph. [PLANNED]
    4. **Personalized narrator prompt** — Narrator agent updated to address the ancestor by name (e.g., "Stanisław would have left Galicia in the winter of 1883..."). [PLANNED]
    5. **Ancestor-linked saves** — Narratives generated via an ancestor profile are saved to `saved_narratives` with `ancestorProfileId` set; My Records panel (Phase 9) shows the ancestor name on linked cards. [PLANNED]
    6. **Unit tests** — Ancestor CRUD endpoints and query enrichment logic. [PLANNED]
*   **Risks:** Query enrichment must degrade gracefully when no ancestor profile is selected — all existing ad-hoc flows must continue working unchanged.
*   **Done:** Nothing yet. The `ancestor_profiles` table and auth middleware are the only prerequisites; both exist.

---

## 🔀 Strategic Fork After Phase 10

After Phase 10 ships, Heritage Odyssey is a complete personalized-narrative product (Ancestor Profile CRUD + query enrichment + personalized narrator). The phases that follow address two more questions: *should HO ingest real third-party genealogy records (Phase 11)*, and *should HO host its own production-grade evaluation layer (Phase 12)*. Each of those questions has two answers — a depth path and a velocity path — and they should be chosen together as a strategy.

**This decision is intentionally deferred to after Phase 10 completes.** Both paths are documented in full detail so the decision can be made with complete visibility into the trade-off rather than re-derived from memory.

### Path A — Depth Path (One mega-project)

Heritage Odyssey becomes the single deep portfolio project that demonstrates the entire stack: multi-agent LangGraph orchestration, real personal-data ingestion (GEDCOM import) with Google OAuth, per-user dynamic embedding, AND a standalone Python FastAPI evaluation microservice with HTTP API.

- **[Phase 11A — Genealogy Import (Depth)](PHASE_11A_GENEALOGY_IMPORT_DEPTH.md)** — Full GEDCOM file import + 12-field schema extension + multi-event parsing + per-user Pinecone namespaces + dual-source researcher + Google OAuth/demo auth. ~6-10 weeks.
- **[Phase 12A — Python FastAPI Eval Service (Depth)](PHASE_12A_PYTHON_EVAL_SERVICE_DEPTH.md)** — Full FastAPI microservice deployed as a second Railway service, `eval_scores` PostgreSQL table, HTTP eval API with 6 scoring dimensions, 30-day trend endpoint, Dockerfile + pytest suite. ~3-4 weeks.

**Path A total estimated time after Phase 10:** ~9-14 weeks (~2-3.5 months).
**Job-applying start estimate:** ~Nov 2026 – Jan 2027.

**Path A pitch:** *"I built a genealogy intelligence platform — multi-agent narrative pipeline, per-user retrieval over the user's own family records (GEDCOM import), and a Python evaluation microservice with automated quality regression in CI."*

### Path B — Velocity Path (Two-projects strategy)

Heritage Odyssey ships at portfolio-grade with the architecturally interesting differentiator (dual-source RAG over the user's own GEDCOM records) and a lean but interview-grade evaluation layer. The weeks freed up are then invested in a *separate* Python + FastAPI project, restoring the two-strong-projects portfolio shape from the original May 26 strategy.

- **[Phase 11B — Genealogy Import (Velocity)](PHASE_11B_GENEALOGY_IMPORT_VELOCITY.md)** — GEDCOM import (core fields) + 6-field schema + per-user Pinecone namespaces + dual-source researcher + Google OAuth/demo auth. ~4-5 weeks.
- **[Phase 12B — Eval Infrastructure (Velocity)](PHASE_12B_EVAL_INFRA_VELOCITY.md)** — Promptfoo CI regression suite + LangSmith production tracing (env vars only) + extended `evaluation/` Python with LLM-as-judge and custom scorers. No FastAPI service, no second Railway deployment. ~1.5-2 weeks.

**Path B total estimated time after Phase 10:** ~5.5-7 weeks (~1.5-2 months).
**Job-applying start estimate:** ~Aug – Oct 2026.

**Path B pitch:** *"I built a genealogy intelligence platform with multi-agent narrative pipeline and dual-source RAG against the user's own family records (GEDCOM import), plus Promptfoo + LangSmith evaluation in CI. My next project is a Python-native [topic] app demonstrating FastAPI and async patterns."*

### Trade-off Summary

| Dimension | Path A (Depth) | Path B (Velocity) |
| :--- | :--- | :--- |
| Total post-Phase-10 weeks | ~9-14 | ~5.5-7 |
| Job-applying start estimate | ~Nov 2026 – Jan 2027 | ~Aug – Oct 2026 |
| GEDCOM import + per-user namespaces + dual-source RAG + Google OAuth/demo | Yes | Yes (identical) |
| Full multi-event parsing (ports, ship names, source citations) + 12-field schema | Yes | **No — 6 core fields only** |
| Python FastAPI microservice | Yes (inside HO) | **No in HO** — but a separate Python project is in scope after |
| Production LangSmith tracing | Yes | Yes (identical) |
| Promptfoo CI regression suite | Yes | Yes (identical) |
| LLM-as-judge scoring | Yes | Yes (identical, just in `evaluation/` not in a service) |
| Number of strong portfolio projects | 1 deep | 2 (HO + separate Python project) |
| Risk if Phase 11 or 12 stalls | Blocks the entire applying-start | Lower — HO ships sooner; the separate Python project is independent |
| Interview answer for "Can you work in Python?" | "Yes — the eval microservice in Heritage Odyssey" | "Yes — Heritage Odyssey's eval suite and my separate Python project" |

### When to make the decision

The decision should be made **after Phase 10 ships**, not before. The right inputs at that point are: (1) where the AI Engineer job market is then (postings, skill demands, what's still hot), (2) how the user feels about HO's depth vs starting a new project, and (3) whether any unforeseen Phase 10 work changed the cost estimates. Both paths are designed to be ready to pick up immediately once Phase 10 completes.

Phase 13 (Migration Map) is independent of this fork and can be tackled under either path — though under Path A it has more meaningful geographic data to work with due to the deeper schema.

---

### Phase 13: Migration Map [SPECCED — build timing TBD]
*   **Summary:** Replace the dead "Explore the Map" hero button with an interactive migration map. With Phase 11's real geographic data from imported GEDCOM records (birth place → arrival port → census residence), actual migration routes become possible. The map shows a user's ancestor's probable journey as an animated route overlaid on a period-appropriate historical map base layer.
*   **Candidate tooling:** Mapbox GL JS (most capable, free tier available), Leaflet (lighter weight, fully open-source), or Deck.gl (best for animated routes).
*   **Specced as a design signal** — shows system design thinking even if not yet built. Include in the portfolio README and blog post as "Phase 13: planned." Recruiters reading the README see the vision even if the feature isn't shipped.
*   **Independent of the Path A / Path B fork** — buildable under either, though Path A's richer schema (departurePort, shipName) gives the map more to render.

---

## File Naming Convention

Phases that have alternative implementation paths use a letter suffix:

- `PHASE_NN_FEATURE.md` — single path (Phases 1-10, 13)
- `PHASE_NNA_FEATURE_DEPTH.md` — depth-path variant for that phase
- `PHASE_NNB_FEATURE_VELOCITY.md` — velocity-path variant for that phase

The A/B variants are mutually exclusive — pick one when the decision is made. Both are kept in the repo as documented alternatives.

---

## Post-Roadmap Documentation

After all phase planning documents are complete, write `project-specs/docs/API_INTEGRATIONS.md` covering: ElevenLabs, OpenAI Whisper, Pinecone, LangGraph, and Ragas/TruLens. Writing it after the phase docs ensures implementation-specific details (exact methods, endpoints, SDK patterns) are captured accurately rather than generically.
