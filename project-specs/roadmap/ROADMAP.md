# Heritage Odyssey Roadmap

| Phase | Name | Duration | Key Goal |
| :--- | :--- | :--- | :--- |
| 1 | **Foundation** | 3 Days | Set up the monorepo structure and development environment. |
| 2 | **Database & Auth** | 3 Days | Implement Neon PostgreSQL schema with Drizzle ORM and JWT-based authentication. |
| 3 | **Data & RAG** | 5 Days | Implement document ingestion and vector storage via Pinecone. |
| 4 | **Agent Swarm** | 6 Days | Build the LangGraph orchestration for historical narrative generation. |
| 5 | **Voice & UI** | 5 Days | Integrate ElevenLabs/Whisper and develop the frontend interface. |
| 6 | **Evaluation** | 4 Days | Implement Ragas/TruLens for validation of historical accuracy. |
| 7 | **UI Overhaul & Pre-Deployment Polish** | 3 Days | Fix functional bugs, redesign UI to historical theme, verify end-to-end locally before deployment. |
| 8 | **Deployment & Launch** | 2 Days | Finalize production deployment and verify platform stability. |
| 9 | **Feature Completion & Portfolio Polish** | 3 Days | Implement Saved Records, close test gaps, and bring cross-device quality to portfolio standard. |

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

### Phase 9: Feature Completion & Portfolio Polish [PLANNED]
*   **Deliverables:**
    1. **Saved Records feature** — "Save to Records" button in the narrative text panel. `POST /api/records` and `GET /api/records` endpoints. Requires a schema migration to make `ancestorProfileId` nullable in `savedNarratives` (decouples saving from requiring a full ancestor profile first).
    2. **My Records UI** — Replace the dead "Explore the Map" stub button with "My Records". Opens a panel/modal listing the user's saved narratives: query text, narrative text, and a re-narrate button that calls `/api/narrative/tts` directly with the saved text (skipping the LangGraph re-run).
    3. **Missing unit tests** — `generateNarrativeStream` in `narrativeService.test.ts`; the SSE and TTS routes in `voiceRoutes.test.ts`.
    4. **Playwright E2E tests** — Flow 1 (text input) and Flow 2 (simulated voice) against production URLs (carried from Phase 8).
    5. **Agent observability UI polish** — Better visual treatment for the agent step labels during pipeline execution. Current inline display in the interaction bar is functional but not portfolio-quality.
    6. **Cross-device responsive audit** — Systematic pass across desktop, tablet, and small-screen mobile. Run after E2E is in place to catch regressions.
    7. **Load testing report** — `autocannon` run confirming stability under concurrent load (carried from Phase 8).
*   **Risks:** Schema migration in production (Neon) requires a `drizzle-kit push` or migration file; test carefully before deploying. E2E tests against real production endpoints will consume API credits (OpenAI, ElevenLabs) — mock where possible, gate live calls behind a flag.
*   **Done:** —

### Phase 8: Deployment & Launch [IN PROGRESS]
*   **Deliverables:**
    1. Final production security audit.
    2. Railway configuration for Express backend. [DONE]
    3. Vercel configuration for React + Vite frontend. [DONE]
    4. E2E tests (Playwright) covering user flow.
    5. Production environment variable management. [DONE]
    6. Final performance and load testing.
*   **Risks:** Environment differences between staging/prod; CORS and deployment-specific security configs.
*   **Done:** Initial deployments live on Railway and Vercel. Basic rate limiting and security headers (Helmet) implemented. `railway.toml` and production env vars configured.

---

## Post-Roadmap Documentation

After all phase planning documents are complete, write `project-specs/docs/API_INTEGRATIONS.md` covering: ElevenLabs, OpenAI Whisper, Pinecone, LangGraph, and Ragas/TruLens. Writing it after the phase docs ensures implementation-specific details (exact methods, endpoints, SDK patterns) are captured accurately rather than generically.
