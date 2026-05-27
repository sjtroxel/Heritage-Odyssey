# Phase 9 Plan: Feature Completion & Portfolio Polish

## 1. Objective

Close the gap between Heritage Odyssey's current state and portfolio-quality standards comparable to Asteroid Bonanza and Wildlife Sentinel. Two categories of work: (1) features that make the app actually persistent and useful rather than a one-shot demo, and (2) test/polish work carried over from Phase 8.

## 2. The Core Problem This Phase Solves

The database schema has `ancestor_profiles` and `saved_narratives` tables that are entirely disconnected from the UI. Every narrative generated is thrown away. The "Explore the Map" button in the hero section has no `onClick` handler — it is a dead stub. This phase turns the app from a demo into a product.

---

## 3. Feature: Saved Records

### 3.1 Schema Migration

`savedNarratives.ancestorProfileId` is currently `NOT NULL` with a foreign key to `ancestor_profiles`. This blocks saving a narrative without first creating a full ancestor profile, which is too much friction for a first-use flow.

**Migration:** Make `ancestorProfileId` nullable in `savedNarratives`. This is a single Drizzle schema change + `drizzle-kit generate` + deploy. The `ancestor_profiles` table remains for future use but is no longer a hard dependency for saving.

### 3.2 New API Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/records` | Required | Save a narrative. Body: `{ query: string, contentText: string }`. Returns the saved record. |
| `GET` | `/api/records` | Required | List all saved narratives for the authenticated user, ordered by `createdAt` desc. |
| `DELETE` | `/api/records/:id` | Required | Delete a saved record (must belong to the requesting user). |

### 3.3 Client: Save Button

After a narrative generates and `narrativeText` is set in `useNarrativePipeline`, show a "Save to Records" button in the narrative text panel inside `InteractionLayer`. On click, call `POST /api/records` with the current query and `narrativeText`. Show a brief confirmation ("Saved to the Registry") then disable the button to prevent duplicate saves.

### 3.4 Client: My Records Panel

Replace the dead "Explore the Map" button in `App.tsx` hero section with "My Records". This button opens a modal or slide-over panel showing:

- The user's saved narratives, most recent first.
- Each card: the original query as a title, a truncated preview of the narrative text, the save date.
- A **Re-Narrate** button on each card that calls `POST /api/narrative/tts` directly with the saved `contentText` (skipping the LangGraph pipeline entirely — the text is already stored).
- A **Delete** button that calls `DELETE /api/records/:id` and removes the card from the list.

If no records exist yet, show an empty-state message consistent with the Victorian Registry aesthetic.

---

## 4. Test Coverage: Carry-Overs from Phase 8

### 4.1 Unit Tests — Server

**`server/tests/services/narrativeService.test.ts`**

Add tests for `generateNarrativeStream`:
- Yields `agent_step` events for each node that runs (researcher, synthesizer, narrator).
- Yields a `complete` event with the `finalScript` when the graph completes normally.
- Yields a `handoff` event when the researcher node sets `handoffPackage`.
- Throws (or yields an error-equivalent) when neither `finalScript` nor `narrativeDraft` is set.
- Mock `graph.stream` (add it to the existing `vi.mock('../../src/agents/graph.js')` block).

**`server/tests/routes/voiceRoutes.test.ts`**

Add tests for:
- `POST /api/narrative/generate` — returns `text/event-stream` content type; emits SSE events matching the mock stream output; handles missing `query` with 400.
- `POST /api/narrative/tts` — calls `streamNarrative` with the provided text; returns `audio/mpeg`; handles missing `text` with 400.

Note: Testing SSE with `supertest` requires reading the response body as a stream. Use `supertest`'s `.buffer(false)` option or collect raw bytes and parse SSE manually in the test.

### 4.2 E2E Tests — Playwright

Install Playwright in the `client` workspace. Tests run against the deployed production URLs (set via env vars `E2E_BASE_URL`, `E2E_API_URL`).

**Flow 1: Text Input Path**
1. Navigate to the app. Log in with a test account.
2. Type "Tell me about an Irish family emigrating to New York during the 1840s famine" and submit.
3. Assert: agent step labels cycle visibly (at least one appears).
4. Assert: narrative text panel populates with non-empty content.
5. Assert: audio element `src` is set and `canplaythrough` fires within 10 seconds.

**Flow 2: Simulated Voice Input Path**
1. Inject a pre-recorded fixture audio file into the voice input (bypass real microphone).
2. Assert: transcription returns text.
3. Assert: pipeline runs and narrative text populates.
4. Assert: audio plays.

**API cost note:** These tests hit live OpenAI and ElevenLabs. Add a `E2E_LIVE=true` env gate so they are opt-in and not run on every push. Unit and integration tests remain the default CI gate.

---

## 5. Agent Observability UI Polish

The current agent step labels render inline inside the `InteractionLayer` status area. This is functional but visually weak — the step label appears and disappears in a small text block that doesn't draw the eye.

**Target treatment:** When the pipeline is running, expand or overlay a more prominent "status theater" element — a centered modal-style card, a full-width banner just above the input bar, or a dedicated status strip with the three agent names shown as a progress track (greyed out → active → completed). The Victorian Register aesthetic should carry through (Spectral italic, brass accents, uppercase Libre Baskerville labels).

Exact design is intentionally left open for iteration — write a focused Gemini prompt once the test work above is complete.

---

## 6. Cross-Device Responsive Audit

After E2E tests are in place, do a systematic pass:

| Breakpoint | Device Analog | Known Issues |
| :--- | :--- | :--- |
| `< 375px` | Small Android | TBD — document during audit |
| `375–430px` | iPhone SE / 14 | TBD |
| `768px` | iPad portrait | TBD |
| `1024px` | iPad landscape / small laptop | TBD |
| `1280px+` | Desktop | TBD |

Record specific broken elements during the audit pass, then write targeted Gemini prompts to fix. Do not attempt a broad responsive overhaul in a single prompt — fix one breakpoint or one component at a time.

---

## 7. Load Testing

Carry-over from Phase 8 section 5. Use `autocannon` to simulate 5–10 concurrent users against the Railway backend.

```bash
npx autocannon -c 5 -d 30 -m POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -b '{"text":"A long pre-generated narrative text..."}' \
  https://<railway-url>/api/narrative/tts
```

The TTS endpoint is the right load target — it calls ElevenLabs and is the bottleneck. The LangGraph pipeline is too expensive to hammer in a load test without significant API cost.

Target: 0% error rate, memory stable under 512MB on Railway.

---

## 8. Verification (Done Criteria)

- [ ] Schema migration applied: `savedNarratives.ancestorProfileId` is nullable in production.
- [ ] `POST /api/records` and `GET /api/records` endpoints implemented and tested.
- [ ] "Save to Records" button functional in the narrative text panel.
- [ ] "My Records" panel replaces the dead "Explore the Map" stub.
- [ ] Re-Narrate button on saved records works (calls `/api/narrative/tts` with stored text).
- [ ] Unit tests for `generateNarrativeStream` added and passing.
- [ ] Unit tests for `/api/narrative/generate` and `/api/narrative/tts` added and passing.
- [ ] Playwright E2E Flow 1 and Flow 2 pass against production (with `E2E_LIVE=true`).
- [ ] Agent observability UI polish implemented and visible on mobile and desktop.
- [ ] Cross-device responsive audit complete; known issues fixed.
- [ ] Load testing report generated.
