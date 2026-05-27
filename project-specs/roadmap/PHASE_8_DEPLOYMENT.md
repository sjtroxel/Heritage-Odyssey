e# Phase 8 Plan: Deployment & Launch

## 1. Objective
Finalize the production environment for Heritage Odyssey by deploying the Express 5 backend to Railway and the React 19 frontend to Vercel. This phase focuses on production-grade security, performance stability under load, and end-to-end verification of the full narrative pipeline.

## 2. Production Architecture

### Backend: Railway
- **Environment:** Node.js 22 (LTS)
- **Deployment Strategy:** Automatic deploys from the `main` branch, scoped to the `server` workspace.
- **Service Configuration:**
  - `Health Check Path`: `/health`
  - `Root Directory`: `/` (Monorepo root)
  - `Build Command`: `npm install && npm run build --workspace=shared && npm run build --workspace=server`
  - `Start Command`: `npm run start --workspace=server`

### Frontend: Vercel
- **Framework Preset:** Vite
- **Deployment Strategy:** Automatic deploys from the `main` branch, scoped to the `client` workspace.
- **Build Settings:**
  - `Build Command`: `npm run build --workspace=client`
  - `Output Directory`: `client/dist`
  - `Root Directory`: `.` (Monorepo root)

## 3. Environment Variable Management
All environment variables must be configured in the respective deployment platforms.

| Variable | Source Phase | Description | Required In |
| :--- | :--- | :--- | :--- |
| `PORT` | Phase 1 | Port for the Express server (set by Railway automatically) | Server |
| `NODE_ENV` | Phase 1 | Set to `production` | Server, Client |
| `OPENAI_API_KEY` | Phase 3, 4, 5 | Used for Whisper (STT) and GPT-4o models (Swarm) | Server |
| `PINECONE_API_KEY` | Phase 1, 3 | Access to the vector database | Server |
| `PINECONE_ENVIRONMENT` | Phase 1, 3 | The environment for the Pinecone index | Server |
| `PINECONE_INDEX` | Phase 1, 3 | The name of the production index | Server |
| `ELEVENLABS_API_KEY`| Phase 5 | Access to ElevenLabs TTS | Server |
| `ELEVENLABS_VOICE_ID`| Phase 5 | ID for the narrator voice | Server |
| `VITE_API_URL` | Phase 8 | The public URL of the deployed Railway backend | Client |
| `CORS_ORIGIN` | Phase 8 | The public URL of the deployed Vercel frontend | Server |
| `EVAL_MODE` | Phase 6 | Set to `false` or leave unset in production to disable trace logging | Server |
| `LANGCHAIN_TRACING_V2`| Phase 4 | Must NOT be enabled in production without a configured LangSmith key; leave unset | Server |
| `JWT_SECRET` | Phase 2 | Defined in Zod schema; set to placeholder for now | Server |
| `DATABASE_URL` | Phase 2 | Defined in Zod schema; set to placeholder for now | Server |

## 4. Security & Hardening

### Server-Side Protection
1. **Helmet:** Use `helmet` middleware to set secure HTTP headers (HSTS, CSP, etc.). [DONE]
2. **Rate Limiting:** Implement `express-rate-limit` to prevent abuse.
   - AI Endpoints (`/api/voice/*`, `/api/narrative/*`): 10 requests per 10 minutes. [PENDING]
   - General Endpoints: 100 requests per 15 minutes. [DONE]
3. **CORS Configuration:** Strictly allow only the `CORS_ORIGIN` (Vercel URL). [DONE]
4. **Input Sanitization:** Validate all incoming query strings using `zod` to prevent injection. [DONE]

## 5. Performance & Load Testing
To ensure the backend handles concurrent narrative requests without degradation:
- **Tooling:** Use `autocannon` or `k6` for stress testing.
- **Scenario:** Simulate 5-10 concurrent users requesting transcriptions and narratives.
- **Target Metrics:**
  - First-byte latency for audio streams < 2 seconds.
  - 0% error rate under sustained load of 5 concurrent narrative generations.
  - Memory usage stable under 512MB on Railway.

## 6. End-to-End Verification (Playwright)
The E2E suite in `client/tests/e2e/` will cover two explicit production flows:

### Flow 1: Text Input Path
1. **Action:** User types "Tell me about a Polish family in 1890 Chicago" into the text field and submits.
2. **Verification:**
   - Status indicators ("Researching...", "Generating...") appear.
   - Narrative text is rendered on screen.
   - Audio element `src` is populated.
   - `oncanplaythrough` event triggers within 5 seconds.

### Flow 2: Simulated Voice Input Path
1. **Action:** A pre-recorded audio fixture file is injected into the `VoiceInputButton` component (bypassing the real microphone).
2. **Verification:**
   - Transcription returns the expected text.
   - Swarm processes the query.
   - Audio playback criterion (populated `src` and `oncanplaythrough` within 5s) is met.

## 7. Beyond-Original-Spec Work Completed

The following were implemented during Phase 8 beyond the original plan and represent significant portfolio-visible additions:

- **SSE agent observability** — `POST /api/narrative/generate` streams LangGraph node progress (researcher → synthesizer → narrator) to the client in real time via Server-Sent Events.
- **Dedicated TTS endpoint** — `POST /api/narrative/tts` accepts pre-generated text and calls ElevenLabs directly, decoupling the expensive LangGraph pipeline from audio synthesis so the pipeline runs exactly once.
- **`generateNarrativeStream` generator** — `narrativeService.ts` exports an async generator using `graph.stream({ streamMode: 'updates' })` that yields typed `NarrativeEvent` objects as each agent node completes.
- **`useNarrativePipeline` hook** — client-side hook that orchestrates the two-step SSE → TTS flow, manages agent step labels, narrative text state, and audio playback.
- **Narrative text display** — `InteractionLayer` now renders the generated narrative text on screen before audio plays, with themed styling.
- **Real-time agent step labels** — "Consulting the Historical Archive...", "Weaving the Ancestral Narrative...", "Voicing the Chronicle..." cycle visibly as each LangGraph node fires.

## 8. Verification (Done Criteria)
- [x] Railway configuration (`railway.toml`) created and environment variables configured in dashboard.
- [x] Backend is live on Railway with security headers and basic rate limiting active.
- [x] Frontend is live on Vercel and successfully communicates with the backend.
- [x] CORS is strictly limited to the Vercel production origin.
- [x] AI-specific rate limits (10 req / 10 min) implemented for all four narrative/voice endpoints.
- [x] All linting and type-checking pass across all workspaces.
- [ ] **Unit tests for `generateNarrativeStream`** added to `server/tests/services/narrativeService.test.ts` — currently untested.
- [ ] **Unit tests for `/api/narrative/generate` (SSE) and `/api/narrative/tts`** added to `server/tests/routes/voiceRoutes.test.ts` — currently untested.
- [ ] **Agent observability UI polish** — step label display needs a better visual treatment (modal, overlay, or dedicated panel). Currently renders inline in the interaction bar area. Deferred pending Gemini quota reset.
- [ ] **Playwright E2E tests** (Flow 1: text input, Flow 2: voice input) pass against production URLs.
- [ ] **Performance report** confirms stability under concurrent load (verified via `autocannon`).
- [ ] **Cross-device responsive audit** — known issues on desktop, tablet, and small-screen mobile. To be addressed once E2E tests are in place to catch regressions.
