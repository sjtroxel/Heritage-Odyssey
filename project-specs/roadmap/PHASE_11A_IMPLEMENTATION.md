# Phase 11A Implementation: Genealogy Import & Dual-Source RAG (Depth Path)

> **Status: NOT STARTED.** Companion to the spec [`PHASE_11A_GENEALOGY_IMPORT_DEPTH.md`](PHASE_11A_GENEALOGY_IMPORT_DEPTH.md). The spec says *what* and *why*; this doc says *how*, in build order, grounded in the actual code as of 2026-05-29 (end of Phase 10).
>
> **How to use this doc:** Work top to bottom. Each step lists the real files to touch, the actual current signatures, the exact change, and a **"What you're learning"** note so the mechanics stick. Run the CI gate (`npm run typecheck && npm run lint && npm run test`) after each backend step — small green increments beat one big red one.
>
> **Data-source reminder:** FamilySearch API is closed to individuals; WikiTree's terms forbid persistent caching. The source is **GEDCOM file upload** (the user's own tree exported from Ancestry/MyHeritage). The OAuth portfolio signal comes from **Google sign-in on the app's own auth**, not a genealogy provider. See the spec's § 0 for the full reasoning.

---

## Current State Baseline (verified 2026-05-29)

| Item | Current State | Phase 11A touches it? |
| :--- | :--- | :--- |
| `users` schema | Phase 10 fields; **no** `googleId` / `authProvider` | Yes — Step 1 |
| `ancestorProfiles` schema | Phase 10 fields incl. `birthYear`, `deathYear` (integers), `originCountry`, `destination` | Yes — Step 1 (adds GEDCOM fields) |
| `vectorStore.ts` | Exports **`query(text, options)`** — `options = {topK, year, region}`. **No namespace support.** Returns `{id, score, metadata, content}` where `content = metadata?.text` | Yes — Step 4 |
| `embedding.ts` | `createEmbedding(text)`, `createEmbeddings(texts)`. **No upsert, no `embedAncestorProfile`** | Yes — Step 4 |
| Pinecone upsert pattern | Only in `scripts/src/ingest.ts`: `index.upsert({ records: vectors })`, each vector `{id, values, metadata: {...meta, text}}`, embed model `text-embedding-3-small` | Mirror it — Step 4 |
| `researcher.ts` | `researcherNode(state)` — single-source: multi-phrase `query()`, dedup by id, **handoff if fewer than 2 results score ≥ 0.25** | Yes — Step 6 |
| `userId` into the graph | Passed via **`configurable: { userId }`** in `narrativeService.ts` (both `graph.invoke` and `graph.stream`). **NOT in `AgentState`.** | Read it in Step 6 |
| `narrativeService.ts` | Already forwards `userId` to the graph. No change needed for userId plumbing. | No |
| `authController.ts` | Email/password JWT: `generateAccessToken`, `generateRefreshToken`, `toUserResponse`, refresh-cookie pattern | Extend — Step 10/11 |
| `ancestorsRoutes.ts` | CRUD with `authenticate` middleware + Zod `safeParse`; `req.user!.id` | Mirror for import route — Step 3 |
| `multer` | **Installed** (`multer` 2.1.1, `@types/multer`) | Use it — Step 3 |
| `google-auth-library` | **Not installed** | Install — Step 0 |
| GEDCOM parser | **Not installed** | Install — Step 0 |
| `server/fixtures/` | **Does not exist** | Create — Step 2 |

---

## ⚠️ Three traps to avoid (these are why tonight's session existed)

1. **`userId` is NOT in `AgentState`.** The researcher node gets `state` only. To do per-user retrieval you must read `userId` from the node's **second argument** (`config.configurable.userId`), not from `state`. (Step 6.)
2. **Personal-record vectors must use the same embedding model as the corpus.** The corpus was ingested with `text-embedding-3-small`. If `embedAncestorProfile` embeds with a different model, the vectors live in a different space and retrieval returns garbage. Confirm `MODELS.EMBEDDINGS === 'text-embedding-3-small'` before embedding anything. (Step 4.)
3. **Retrieval reads `metadata.text`.** `vectorStore.query()` returns `content = metadata?.text`. If your upserted ancestor vectors don't put the document string in `metadata.text`, they retrieve as empty strings. (Step 4.)

---

## Step 0 — Pre-flight: accounts, installs, env (do this first)

**Human task (do before Step 10, but start now — it's quick, no approval wait unlike FamilySearch):**
Create a Google Cloud OAuth 2.0 Client.
- Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/google/callback` (dev)
  - `https://heritage-odyssey.up.railway.app/api/auth/google/callback` (prod)
- Copy the **Client ID** and **Client secret**.

> **Why no multi-day wait here:** Google hands you OAuth credentials instantly for a self-serve web app. The FamilySearch wall was a manual human review for database access. Google sign-in is a standard self-service flow — no gatekeeper. This is exactly why we moved the OAuth signal here.

**Installs:**
```bash
cd server && npm install google-auth-library
cd server && npm install gedcom-parser    # see note below
```

> **Parser note:** Evaluate `@it9gamelog/gedcom-parser` (TypeScript, actively maintained) first. If its API is awkward, `parse-gedcom` works but is older. Whichever you pick, isolate it behind *our own* `parseGedcom()` wrapper (Step 2) so the third-party choice never leaks into the rest of the code — if the library dies, you swap one file.

**Env vars** — add to `server/.env` AND register in `server/src/config/env.ts` (Zod schema):
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

> **What you're learning:** `env.ts` validates every env var at boot with Zod. If you add a var to `.env` but forget `env.ts`, `env.GOOGLE_CLIENT_ID` is `undefined` at runtime with no warning. Add it in both places. (See the "Multiple .env files" trap in `CLAUDE.md`.)

---

## Step 1 — Schema migration + shared types

**Files:** `server/src/db/schema.ts`, then `shared/` types, then `drizzle-kit`.

**`users` table — add two columns:**
```typescript
googleId: text('google_id').unique(),                    // null for password/demo users
authProvider: text('auth_provider').notNull().default('password'), // 'password' | 'google' | 'demo'
```

**`ancestorProfiles` table — add the GEDCOM fields.** Note the **overlap trap**: `birthYear` and `deathYear` (integers) already exist from Phase 10. GEDCOM gives richer date strings. Add string fields for the full GEDCOM values and keep the integers as the normalized/queryable form:
```typescript
gedcomId: text('gedcom_id'),          // GEDCOM record pointer e.g. "@I1@" — dedupe key
birthDate: text('birth_date'),        // full GEDCOM date string ("15 MAR 1872", "Abt 1870")
birthPlace: text('birth_place'),
deathDate: text('death_date'),
deathPlace: text('death_place'),
arrivalDate: text('arrival_date'),
arrivalPort: text('arrival_port'),
departurePort: text('departure_port'),
shipName: text('ship_name'),
occupations: text('occupations').array(),
sourceSummary: text('source_summary'), // JSON string of attached source citations
```
> When parsing (Step 2), also derive the integer `birthYear`/`deathYear` from `birthDate`/`deathDate` so the existing Phase 10 enrichment (which reads `birthYear`) keeps working. Don't leave two date fields that disagree.

**Migration:**
```bash
cd server && npx drizzle-kit generate   # READ the generated SQL in server/drizzle/ before applying
cd server && npx drizzle-kit push       # applies to Neon
```
> **What you're learning:** `generate` writes a timestamped SQL file from the schema diff; `push` runs it against Neon. Always eyeball the SQL — a rename you didn't intend shows up as a DROP + ADD (data loss). For pure column ADDs like these, the SQL should be only `ALTER TABLE ... ADD COLUMN`.

**Shared types** (`shared/src/types.ts` or equivalent — match where Phase 10 put `AncestorProfile`): add the new optional fields to `AncestorProfile`, and `googleId` / `authProvider` to `User` if the client needs them. Run `npm run typecheck` from root — the shared package is consumed by both workspaces, so a missing field surfaces everywhere at once.

**Test:** none yet (schema only). `npm run typecheck` is the gate.

---

## Step 2 — GEDCOM parser wrapper + sample fixture

**New files:** `server/src/services/gedcomParser.ts`, `server/fixtures/sample-family.ged`.

**Build the fixture first** — a small fictional 3-4 generation tree with immigration events. This is your test input AND the demo's "Load sample family" data. Hand-write ~4-6 `INDI` records (use the structure in the spec § 2). Include one `1 NAME Living /Person/` with no dates to test the living-person skip.

**`gedcomParser.ts` — a pure function, no DB, no network:**
```typescript
export interface ParsedAncestor {
  gedcomId: string;
  name: string;
  lastName?: string;
  birthDate?: string; birthPlace?: string; birthYear?: number;
  deathDate?: string; deathPlace?: string; deathYear?: number;
  arrivalDate?: string; arrivalPort?: string;
  departurePort?: string; shipName?: string;
  occupations?: string[];
  sourceSummary?: string;
}

export interface GedcomParseResult {
  ancestors: ParsedAncestor[];
  warnings: string[];   // skipped living persons, unparseable records
}

export function parseGedcom(raw: string): GedcomParseResult { /* ... */ }
```
Rules:
- Skip living persons (redaction marker, or no birth + no death + name "Living"). Push a warning, don't throw.
- Derive `birthYear`/`deathYear` (integer) from the parsed date strings where possible.
- Never throw on a malformed record — collect a warning and continue. One bad record must not fail the whole import.

> **What you're learning:** keeping the parser pure (string in → data out, no side effects) makes it trivial to unit-test against the fixture and impossible for a parser bug to corrupt the DB. The library lives *inside* this file only.

**Test** (`server/tests/...`): parse the fixture → assert names, a birth date+place, an immigration event, integer year derivation, and that the "Living" person is skipped with a warning.

---

## Step 3 — GEDCOM import endpoint

**File:** `server/src/routes/ancestorsRoutes.ts` (extend it — mirror the existing CRUD style: `authenticate`, `req.user!.id`, `logger`, Zod where useful).

```typescript
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/ancestors/import/gedcom', authenticate, upload.single('file'),
  async (req, res) => {
    const userId = req.user!.id;
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const raw = req.file.buffer.toString('utf-8');   // memoryStorage → buffer, never written to disk
    const { ancestors, warnings } = parseGedcom(raw);
    // upsert rows (idempotent by gedcomId + userId), then embed (Step 5)
    // ... return { imported: N, warnings }
  });
```
- **Idempotency:** for each parsed ancestor, find an existing row by `(userId, gedcomId)`; update if found, insert if not. (Re-importing an updated file must not duplicate.)
- **Privacy:** `memoryStorage()` keeps the file in RAM as a buffer — it's never written to disk, and it's gone when the request ends. Do not switch to disk storage. (Spec § 9.)
- A second route `POST /ancestors/import/sample` reads `server/fixtures/sample-family.ged` from disk and runs the same path — this powers "Load sample family."

> **What you're learning:** `multer` parses `multipart/form-data` (the only way browsers upload files). `memoryStorage` + `.single('file')` gives you `req.file.buffer`. Because we never persist the raw file, the privacy requirement is satisfied by construction, not by a cleanup step you might forget.

**Test:** mock `parseGedcom`; POST a buffer; assert rows created idempotently and `{imported, warnings}` shape. (Mock the embedding call so the test costs no OpenAI credits.)

---

## Step 4 — Namespace support + `embedAncestorProfile`

**File A — `server/src/services/vectorStore.ts`:** add an optional `namespace` to `QueryOptions` and route through it.
```typescript
export interface QueryOptions { topK?: number; year?: string | number; region?: string; namespace?: string; }

export async function query(text: string, options: QueryOptions = {}) {
  const { topK = 5, year, region, namespace } = options;
  const vector = await createEmbedding(text);
  const target = namespace ? index.namespace(namespace) : index;   // <-- the only structural change
  const queryResponse = await target.query({ vector, topK, filter: /* unchanged */, includeMetadata: true });
  // ...map unchanged (content = metadata?.text)
}
```

**File B — `server/src/services/embedding.ts`:** add the upsert function. **Mirror the exact upsert shape from `scripts/src/ingest.ts`** (`index.upsert({ records: vectors })` with `{id, values, metadata:{...meta, text}}`), scoped to the user namespace:
```typescript
import { ancestorProfiles } from '../db/schema.js';

export async function embedAncestorProfile(profile: typeof ancestorProfiles.$inferSelect, userId: string) {
  const docs = buildAncestorDocuments(profile);   // 3-5 strings, spec § 6.2
  if (docs.length === 0) return;                   // insufficient data → skip
  const vectors = await Promise.all(docs.map(async (text, i) => ({
    id: `anc_${profile.id}_${i}`,
    values: await createEmbedding(text),
    metadata: { text, ancestorId: profile.id, kind: 'personal_record' },  // text REQUIRED (trap #3)
  })));
  await index.namespace(`user-${userId}`).upsert({ records: vectors });
}
```
- **Confirm `MODELS.EMBEDDINGS === 'text-embedding-3-small'`** (trap #2) before running this against real data.
- Deterministic vector ids (`anc_<profileId>_<n>`) make re-embedding on update an overwrite, not a duplicate.
- Trigger: call `embedAncestorProfile` after creating/updating a profile **with sufficient data** (name + ≥1 location + ≥1 date). Wire it in Step 5.

> **What you're learning:** Pinecone *namespaces* are partitions inside one index. `index.namespace('user-abc')` writes/reads only that slice. The general corpus stays in the default namespace; each user's records live in `user-{id}`. Same index, isolated data — that's how one Pinecone index serves both the shared history and per-user records without them bleeding together.

**Test:** mock the Pinecone `index`; assert `embedAncestorProfile` calls `namespace('user-<id>').upsert` with `metadata.text` set, and skips when data is insufficient.

---

## Step 5 — Wire import → embed

In the import route (Step 3), after upserting each ancestor row that has sufficient data, call `embedAncestorProfile(row, userId)`. Do it after the DB write so the row has its real `id`. Embed sequentially or in small batches; a full tree is a fraction of a cent and a few seconds.

**Test:** integration-style with both `parseGedcom` real and Pinecone mocked: import the fixture → assert N rows + N embed calls (minus the skipped living person).

---

## Step 6 — Dual-source researcher (the architectural payoff)

**File:** `server/src/agents/nodes/researcher.ts`. **This is trap #1.** Change the signature to receive `config` and read `userId`:

```typescript
import type { RunnableConfig } from '@langchain/core/runnables';

export async function researcherNode(
  state: typeof AgentState.State,
  config?: RunnableConfig,                       // <-- add this
): Promise<Partial<typeof AgentState.State>> {
  const userId = config?.configurable?.userId as string | undefined;   // <-- NOT from state
  // ...existing: derive searchPhrases, query the general corpus...

  // NEW: also query the user's personal namespace, in parallel, when userId present
  const personalResults = userId
    ? (await Promise.all(searchPhrases.map((p) =>
        vectorStoreQuery(p, { topK: 3, namespace: `user-${userId}` }))))
        .flat()
    : [];
  // dedupe personalResults by id, same as general
```

**Merging + the handoff-threshold subtlety (a bug if ignored):** the current code hands off when fewer than 2 general results score ≥ 0.25. Personal records are the user's *own verified data* — they should:
1. **count toward sufficiency** (a strong personal hit means we should NOT hand off), and
2. **be prefixed** so downstream agents treat them as fact:
```typescript
const personalContext = personalResults.map((r) => `[PERSONAL RECORD] ${r.content}`);
// sufficiency: proceed if (qualifying general results) OR (any personal records) exist
// historicalContext = [...generalContents, ...personalContext]
```
Return `historicalContext` as the merged array. Keep the existing handoff only when *both* sources are thin.

> **What you're learning:** LangGraph passes each node `(state, config)`. Anything you put in `configurable` at invoke time (here, `userId`) is available to every node via `config` — it's the clean way to thread request-scoped data through the graph without polluting the shared `AgentState`. This is *why* `userId` wasn't in state: state is the data the agents produce; config is the request context they run under.

**Test:** call `researcherNode(state, { configurable: { userId: 'u1' } })` with `vectorStoreQuery` mocked; assert it queries both the default and `user-u1` namespaces, prefixes personal hits with `[PERSONAL RECORD]`, and does NOT hand off when a personal record exists even if the general corpus is thin. Also assert single-source behavior when `userId` is absent.

---

## Step 7 — Synthesizer & narrator: treat `[PERSONAL RECORD]` as primary

**Files:** `server/src/agents/nodes/synthesizer.ts`, `server/src/agents/nodes/narrator.ts`. Add to each system prompt: *"Context lines prefixed with `[PERSONAL RECORD]` are verified facts about the user's own ancestors. Build the narrative around them as primary sources; use unprefixed historical context as background. Never contradict a `[PERSONAL RECORD]`."*

> Keep the change to the prompt strings only — per `CLAUDE.md`, the graph wiring (`graph.ts`) should not need edits. Verify the personalized narrator from Phase 10 still works (it reads `ancestorContext` from state, which is unchanged).

**Test:** extend existing node tests — when context contains a `[PERSONAL RECORD]` line, assert it survives into the prompt sent to the model (spy on `ModelRouter.chat`).

---

## Step 8 — Namespace cleanup

When a user clears their imported data or deletes their account, purge their vectors:
```typescript
await index.namespace(`user-${userId}`).deleteAll();
```
Wire into a `DELETE /ancestors/import` (clear my records) route and into account deletion if/when that exists. Also delete the corresponding `ancestor_profiles` rows that came from import.

> **What you're learning:** orphaned vectors are a silent data-leak and cost drift. Deleting the DB row without clearing the namespace leaves the user's records searchable forever. Pair every "delete profile data" path with a namespace cleanup.

**Test:** mock Pinecone; assert `namespace('user-<id>').deleteAll()` is called.

---

## Step 9 — Client: Data Sources UI

**File:** the My Ancestors panel (Phase 10 component). Add a "Data Sources" section:
- **Upload GEDCOM** — `<input type="file" accept=".ged">`; POST as `multipart/form-data` via `authFetch` to `/api/ancestors/import/gedcom`; show count + warnings.
- **Load sample family** — POST to `/api/ancestors/import/sample`.
- Imported list with a "Clear my records" action (Step 8).

> Match the Victorian Registry aesthetic (`CLAUDE.md` design system): brass borders, Spectral italic status text ("Reading the family record…"). Use `authFetch` (`client/src/lib/api.ts`) so the 401-refresh flow is handled.

**Test (client, Vitest):** mock `authFetch`; assert the upload control posts and renders the imported count.

---

## Step 10 — Google OAuth backend

**File:** `server/src/controllers/authController.ts` (+ wire routes where auth routes are registered).

```typescript
import { OAuth2Client } from 'google-auth-library';
const oauth = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);

export const googleAuthUrl = (_req, res) => {
  const url = oauth.generateAuthUrl({ scope: ['openid', 'email', 'profile'] });
  res.json({ url });
};

export const googleCallback = async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth.getToken(code as string);
  const ticket = await oauth.verifyIdToken({ idToken: tokens.id_token!, audience: env.GOOGLE_CLIENT_ID });
  const { email, sub: googleId } = ticket.getPayload()!;
  // find-or-create user by googleId (then by email), authProvider='google'
  // then REUSE existing generateAccessToken/generateRefreshToken + refresh-cookie + toUserResponse
  // redirect to client with the access token (or set it client-side)
};
```
- Routes: `GET /api/auth/google` → `googleAuthUrl`; `GET /api/auth/google/callback` → `googleCallback`.
- **Reuse everything**: the JWT issuance, cookie options, and `toUserResponse` already exist — Google only replaces the *identity check*, not the session system. Don't persist Google tokens. (Spec § 9.)
- A Google user has no password; `passwordHash` is `notNull`. Either store a random unusable hash or make `passwordHash` nullable in Step 1 — decide and be consistent. (Random unusable hash is simpler; keeps the column constraint.)

> **What you're learning:** OAuth 2.0 authorization-code flow = redirect to Google → user consents → Google redirects back with a `code` → you exchange `code` for tokens server-side → verify the ID token → trust the email. After that, HO's own JWT takes over. The third party authenticates *who they are*; your app still manages *the session*.

**Test:** mock `OAuth2Client`; assert callback find-or-creates the user, issues HO JWTs, sets the refresh cookie; assert token-exchange failure returns 401.

---

## Step 11 — Demo mode

- Seed a demo account (`server/src/db/seed.ts` already exists — extend it): `authProvider='demo'`, pre-import the sample family (run the parse+embed once so the demo namespace is populated).
- `POST /api/auth/demo` → issue normal HO JWTs for the demo user. Reuse the existing token helpers.

> **Why keep this:** recruiters won't connect their personal Google account to a stranger's app. The demo button + pre-loaded sample tree lets them see grounded narratives in one click. This is the move that makes the whole feature demonstrable with zero setup. (Spec § 5.)

**Test:** `POST /api/auth/demo` returns a valid session for the seeded user.

---

## Step 12 — Client auth UI

Login screen: add **"Continue with Google"** (GET `/api/auth/google` → redirect to `url`) and **"Try the demo"** (POST `/api/auth/demo` → store token via `useAuth`). Keep the existing email/password form.

**Test:** mock the endpoints; assert both buttons drive the auth flow and `useAuth` stores the token.

---

## Step 13 — Full verification

Run the CI gate from root:
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```
Then the spec's Done Criteria (§ 11). Manual smoke test:
1. Sign in with Google → land authenticated.
2. "Try the demo" → see the pre-loaded family.
3. Upload the sample `.ged` → see imported count, no living person.
4. Generate a narrative for an imported ancestor → confirm it cites a `[PERSONAL RECORD]` detail (a real birth place/year from the file), not just generic history.
5. "Clear my records" → namespace purged; a follow-up narrative falls back to general history only.

> **The proof the architecture works:** step 4. If the narrative weaves in a specific fact that exists *only* in the uploaded GEDCOM, the full pipeline — parse → embed → per-user namespace → dual-source retrieve → `[PERSONAL RECORD]` → narrator — is end-to-end correct.

---

## Suggested commit checkpoints (you run these)

Commit after each green step, e.g.:
```
git add -A && git commit -m "phase11a step 1: schema + shared types for GEDCOM + Google OAuth"
```
Keep steps as separate commits so a regression is easy to bisect. (Per standing preference: Claude does not run commit/push — these are for you.)

---

## Deferred / not in 11A

- LangSmith tracing + Promptfoo + eval scorers → Phase 12 (decide 12A vs 12B when you get there, rested).
- Migration map (Phase 13) — the `birthPlace`/`arrivalPort`/`departurePort` fields you're adding in Step 1 are exactly what it will render.
