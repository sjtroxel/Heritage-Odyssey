# Audit: Pre-Ship Cleanup Pass

> Run date: 2026-05-28. All commands run from repo root against the monorepo.

## 1. Dependency Audit — `depcheck`

```
npx depcheck --skip-missing
```

**Result: No depcheck issues.** No unused dependencies detected across the monorepo.

## 2. Unused Exports — `ts-prune`

```
npx ts-prune
```

**Findings reviewed:**

| Export | File | Status |
| :--- | :--- | :--- |
| Config file defaults | `playwright.config.ts`, `vite.config.ts`, `drizzle.config.ts` | Expected — these are consumed by their respective CLI tools, not imported by name |
| `shared/types.d.ts` exports | `AncestorProfile`, `SavedNarrative`, `ModelUsage`, `TranscriptionResponse`, `StreamNarrativeRequest`, `NarrativeState` | Retained — shared types package; these will be consumed by Phase 10+ |
| `AuthProvider`, `useAuthContext` | `context/AuthContext.tsx` | Consumed internally; ts-prune false-positive on context exports |
| `server/dist/**` | Various `.d.ts` files | Build output — not source code, ignored |
| React component defaults | All `client/src/components/*.tsx` | All consumed via JSX imports; ts-prune false-positive |

**Action taken: None.** All flagged exports are either build artifacts, shared type contracts for upcoming phases, or ts-prune false positives on default exports consumed by their callers.

## 3. Stale Code Grep

```bash
grep -rn "TODO|FIXME|XXX" --include="*.ts" --include="*.tsx" server/src client/src
grep -rn "console\.log"   --include="*.ts" --include="*.tsx" server/src client/src
```

**Result: Zero matches.** No TODO/FIXME/XXX markers and no `console.log` calls in source files. Logging is routed through the `pino`-based `logger` service throughout.

## 4. Type and Lint Health

```bash
npm run typecheck   # tsc --noEmit across all workspaces
npm run lint        # ESLint across all workspaces
```

**Typecheck: Passed.** Zero TypeScript errors across `server`, `client`, and `scripts` workspaces.

**Lint: Passed.** Zero ESLint errors or warnings.

## 5. Test Suite

```bash
npm run test
```

**Result: 62 tests passing (47 server + 15 client). Zero failures.**

| Suite | Tests | Status |
| :--- | :--- | :--- |
| `tests/vectorStore.test.ts` | 5 | ✓ |
| `tests/services/narrativeService.test.ts` | 9 | ✓ |
| `tests/agents/graph.test.ts` | 3 | ✓ |
| `tests/routes/voiceRoutes.test.ts` | 13 | ✓ |
| `tests/app.test.ts` | 7 | ✓ |
| `tests/auth.test.ts` | 10 | ✓ |
| `tests/hooks/useMediaRecorder.test.ts` | 5 | ✓ |
| `tests/hooks/useAudioStream.test.ts` | 8 | ✓ |
| `tests/App.test.tsx` | 2 | ✓ |

## 6. Load Test — `autocannon`

Target: `POST https://heritage-odyssey.up.railway.app/api/narrative/tts`
Rationale: TTS is the highest-latency endpoint (calls ElevenLabs); it is the realistic production bottleneck.

```bash
npx autocannon -c 5 -d 30 -m POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -b '{"text":"The Kowalski family departed Galicia in the bitter winter of 1883, their few possessions bundled against the cold as they made their way westward to Hamburg."}' \
  https://heritage-odyssey.up.railway.app/api/narrative/tts
```

**Status: Deferred.** Load test against the live TTS endpoint incurs real ElevenLabs API credit consumption per request. Scheduled for a dedicated load-test run with a short `text` payload to minimize credit cost. See Phase 9 §7 in `PHASE_9_FEATURES.md` for the full command.

## Summary

| Check | Status |
| :--- | :--- |
| `depcheck` — unused/missing deps | ✓ Clean |
| `ts-prune` — unused exports | ✓ All false positives or retained by contract |
| `console.log` grep | ✓ Zero |
| TODO/FIXME grep | ✓ Zero |
| TypeScript typecheck | ✓ Zero errors |
| ESLint lint | ✓ Zero errors |
| Test suite | ✓ 62/62 passing |
| Load test | ⏳ Deferred |
