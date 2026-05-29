# Phase 11A Plan: Genealogy Import & Dual-Source RAG (Depth Path)

> **Status: PLANNED — alternative to [Phase 11B Velocity](PHASE_11B_GENEALOGY_IMPORT_VELOCITY.md). Choose one path after Phase 10.**
>
> This is the **Depth Path** for Phase 11. Full GEDCOM import (the complete 12-field ancestor schema extension, multi-event parsing, source citation summary), per-user Pinecone namespaces, dual-source RAG, plus a Google OAuth upgrade to the app's own authentication with a retained demo path. Estimated ~6-10 weeks solo. Pair with [Phase 12A](PHASE_12A_PYTHON_EVAL_SERVICE_DEPTH.md) for the full single-mega-project strategy. See [ROADMAP.md § Strategic Fork After Phase 10](ROADMAP.md) for the trade-off analysis.
>
> This phase delivers the technical differentiator that separates Heritage Odyssey from every other LangGraph + RAG portfolio project: real genealogy records — the user's own family tree — embedded per-user and searched alongside the static historical corpus.

## 0. Data-Source Decision (read first)

An earlier draft of this phase was built around the **FamilySearch API**. That route is closed: FamilySearch only grants API access to registered organizations with a business marketing model, and explicitly rejects personal, student, and proof-of-concept projects. **WikiTree** was evaluated as a fallback and also rejected — its App Policies forbid caching or preserving retrieved data beyond a user's session, which is fundamentally incompatible with the per-user embedding architecture below.

The data source for Phase 11 is therefore **GEDCOM file import**, and it is a *better* foundation than FamilySearch would have been:

- **No gatekeeper.** GEDCOM (GEnealogical Data COMmunication) is an open text-file format, not a service. There is no account, no approval, no API key, no terms-of-service that can be revoked. Reading a `.ged` file the user provides involves no third party at all.
- **Universal.** Every major platform exports GEDCOM for free: Ancestry, MyHeritage, Findmypast, RootsMagic, Family Historian, Gramps. The user's research lives somewhere, and that somewhere exports `.ged`.
- **The user's own data.** Because the file is supplied by the user, there is no third-party copyright or privacy-retention problem of the kind that killed WikiTree.
- **Demo-proof.** A sample `.ged` file is committed to the repo so the full personal-records → embedding → narrative flow is demonstrable in one click, with zero external dependency.

The OAuth portfolio signal that FamilySearch would have provided is recovered independently in § 3 via **Google OAuth on the app's own authentication**, decoupled from the genealogy-data layer entirely.

---

## 1. Objective

Replace the current single-source query model with a dual-source retrieval architecture. The researcher agent currently searches one corpus: general historical documents (immigration patterns, Ellis Island records, migration contexts). After this phase, it searches two:

1. **General historical corpus** (Pinecone, existing) — broad historical context, unchanged.
2. **User-specific record namespace** (Pinecone, new) — actual records attached to the user's ancestors, sourced from an imported GEDCOM file.

The result: instead of "Polish immigrants in the 1880s traveled via Hamburg...", the narrative can say "Stanisław Kowalski (your great-great-grandfather) was born in Galicia around 1872, emigrated via Hamburg in 1896, and by the 1900 census was living in Chicago with his wife Agnieszka and three children."

This is a qualitatively different product and a qualitatively different technical story.

---

## 2. GEDCOM Background

**GEDCOM** is the universal genealogy file format, created in 1984 by The Church of Jesus Christ of Latter-day Saints and adopted by every major genealogy platform since. A `.ged` file is plain UTF-8 text using a line-based, level-numbered hierarchy. A typical 4-generation export is 20-100KB and contains textual data only — names, dates, places, relationships, life events. (Photos and source-document scans are not included in a standard GEDCOM export; that is fine, because the text is exactly what we embed.)

**Key facts:**
- Open published spec (FamilySearch GEDCOM 5.5.1 is the universally supported baseline; 7.0 exists but 5.5.1 has the widest export support).
- No API, no authentication, no rate limits, no approval process. It is a file the user uploads.
- Maintained Node/TypeScript parsers exist: **`@it9gamelog/gedcom-parser`** (TypeScript, Node + browser) is the current best-maintained option. `parse-gedcom` still works but is older. The format is simple enough to hand-parse as a last resort, so the parser is not a hard external dependency.

**Sample structure:**

```
0 @I1@ INDI
1 NAME Stanisław /Kowalski/
1 BIRT
2 DATE 15 MAR 1872
2 PLAC Galicia, Austria-Hungary
1 IMMI
2 DATE 1896
2 PLAC Castle Garden, New York
1 DEAT
2 DATE 1934
2 PLAC Chicago, Illinois
1 OCCU Laborer
```

---

## 3. Authentication Upgrade: Google OAuth + Demo Mode

This is where the third-party-OAuth portfolio signal lives, now decoupled from the genealogy data. The current auth (Phase 2) is JWT with email/password. Phase 11A layers Google OAuth 2.0 on top and retains a demo path.

### 3.1 Goals

- **Google OAuth 2.0 sign-in** — "Continue with Google" using the authorization code flow. This is the real third-party-OAuth interview signal (the same OAuth 2.0 pattern FamilySearch would have demonstrated, with an unrestricted provider).
- **Demo / guest login retained** — a "Try the demo" button that issues a session for a pre-seeded demo account, so a recruiter can explore the app (including a sample imported family tree) without connecting a personal Google account.
- **Existing email/password JWT flow preserved** — OAuth is additive, not a replacement.

### 3.2 Flow

```
User clicks "Continue with Google"
  → Server redirects to Google's OAuth consent screen
      with client_id, redirect_uri, response_type=code, scope=openid email profile
  → User authenticates with Google
  → Google redirects back to /api/auth/google/callback?code=<auth_code>
  → Server exchanges code for tokens, reads the verified email/profile
  → Server finds-or-creates a users row keyed by email, issues HO's own JWT
      (access token + refresh cookie — identical to the existing JWT flow)
  → Client lands authenticated
```

The Google tokens themselves are only used to verify identity at sign-in; HO continues to use its own JWT/refresh system for sessions, so the rest of the app is unchanged.

### 3.3 Schema / Endpoints

- `users` gains `googleId text` (nullable, unique) and `authProvider text` (`'password' | 'google' | 'demo'`).
- `GET /api/auth/google` — returns the Google authorization URL.
- `GET /api/auth/google/callback` — handles the callback, exchanges the code, find-or-creates the user, issues HO JWTs.
- `POST /api/auth/demo` — issues a session for the seeded demo account (read-mostly; demo account owns the sample imported tree).

### 3.4 Env vars

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://heritage-odyssey.up.railway.app/api/auth/google/callback
```

---

## 4. GEDCOM Import

Once authenticated, the user uploads a `.ged` file exported from their genealogy platform of choice. The import populates Heritage Odyssey's `ancestor_profiles` table.

### 4.1 Upload & Parse

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ancestors/import/gedcom` | Accepts a `.ged` file upload (multipart). Parses it and creates/updates ancestor profiles. Returns a count of imported ancestors and a list of warnings (unparseable or skipped records). |

Parsing (depth path — full extraction):
- Parse `INDI` (individual) records for name, sex, and all life events.
- Extract `BIRT`/`DEAT` (date + place), `IMMI`/`EMIG` (immigration/emigration date + place), `OCCU` (occupation, possibly multiple), `RESI` (residence/census), and `MARR` where present.
- Capture departure/arrival ports and ship names where encoded (`PLAC` under immigration events, custom `SHIP`/`_SHIP` tags, or notes).
- Build a `sourceSummary` JSON blob from `SOUR` citation records attached to each individual.
- **Skip living persons.** GEDCOM exports often redact living individuals to "Living"; the parser must detect and skip these (no birth date + no death + redaction marker → skip, do not embed).
- **Recommended import scope:** default to the uploaded file's contents; for very large trees, cap embedding at 4-6 generations of direct ancestors to control cost and noise.

**Idempotency:** match on a stable key. GEDCOM individuals carry a record ID (`@I1@`); combined with name + birth year this gives a dedupe key so re-importing an updated file updates rather than duplicates.

### 4.2 Schema Addition to `ancestor_profiles` (12 fields — full depth)

The current `ancestor_profiles` table has only `name`, `birthRegion`, and `era` (plus the Phase 10 additions). Extend it with a Drizzle migration:

```typescript
export const ancestorProfiles = pgTable('ancestor_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // Existing fields
  name: text('name').notNull(),
  birthRegion: text('birth_region').notNull(),
  era: text('era').notNull(),
  // New fields parsed from GEDCOM
  gedcomId: text('gedcom_id'),               // GEDCOM record pointer (e.g. "@I1@") for dedupe
  birthDate: text('birth_date'),             // ISO string or approximate ("1872", "Abt 1870")
  birthPlace: text('birth_place'),           // Full place string ("Galicia, Austria-Hungary")
  deathDate: text('death_date'),
  deathPlace: text('death_place'),
  arrivalDate: text('arrival_date'),         // Immigration arrival
  arrivalPort: text('arrival_port'),         // "New York", "Baltimore", "Castle Garden"
  departurePort: text('departure_port'),     // "Hamburg", "Bremen", "Liverpool"
  shipName: text('ship_name'),
  occupations: text('occupations').array(),  // Array of known occupations
  sourceSummary: text('source_summary'),     // JSON blob of attached source citations
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## 5. Sample GEDCOM (Demo-Proofing)

Commit a small, fictional sample `.ged` file (e.g. `server/fixtures/sample-family.ged`) covering 3-4 generations with immigration events, so the entire feature is demonstrable without the user having any genealogy account:

- A **"Load sample family"** button in the UI imports this fixture into the current account's namespace.
- The seeded **demo account** (§ 3) owns a pre-imported copy so the demo path shows grounded narratives immediately.
- The same fixture doubles as the test fixture for the parser unit tests (§ 10).

This makes the recruiter demo a single click and removes every external dependency from the critical path.

---

## 6. Per-User Record Namespacing in Pinecone

This is the architectural heart of Phase 11. The current Pinecone index stores general historical documents in a shared namespace. Phase 11 adds a second tier: each user's actual ancestor records, stored in a Pinecone namespace scoped to that user.

### 6.1 Namespace Strategy

Pinecone supports **namespaces** within an index as a way to partition vectors. Use the user's UUID as the namespace:

```
General corpus namespace:   "historical-corpus" (existing)
User-specific namespace:    "user-{userId}"     (new per user)
```

When a user imports their GEDCOM (§ 4), each ancestor profile generates a set of text documents from the structured data, which are then embedded and upserted into the user's namespace.

### 6.2 What Gets Embedded Per Ancestor

For each ancestor profile row with sufficient data, generate 3-5 text documents:

```
Doc 1 (identity):
"Stanisław Kowalski was born approximately 1872 in Galicia, Austria-Hungary (now southern Poland). He died circa 1934 in Chicago, Illinois."

Doc 2 (immigration):
"Stanisław Kowalski emigrated from the port of Hamburg, Germany in 1896, arriving at Castle Garden, New York. He traveled aboard the S.S. Pennsylvania. His stated destination was Chicago, Illinois."

Doc 3 (life events):
"By 1900, Stanisław Kowalski was recorded living in Chicago, Cook County, Illinois. Occupation: laborer. Household included wife Agnieszka (born 1875, Poland) and three children."

Doc 4 (sources):
"Records attached to Stanisław Kowalski: 1900 U.S. Federal Census, Hamburg Emigration Records 1896, Cook County Death Certificate 1934."
```

These documents are small, specific, and citation-rich. When the researcher agent retrieves them, the narrator can ground the story in actual records.

### 6.3 Embedding Service Change

Add an `embedAncestorProfile(profile: AncestorProfile, userId: string)` function in `server/src/services/embedding.ts`:
- Generates the text documents from the structured profile fields
- Embeds them using the existing embedding model
- Upserts into the `user-{userId}` Pinecone namespace

Called automatically when an ancestor profile is created or updated with sufficient data (name + at least one location field + at least one date field). At ada-002 pricing a full multi-generation import costs a fraction of a cent — embedding cost is a non-issue.

---

## 7. Dual-Source Researcher Agent

The researcher node (`server/src/agents/nodes/researcher.ts`) currently runs one Pinecone query against the general corpus. After this phase, it runs two queries in parallel:

```typescript
const [generalResults, personalResults] = await Promise.all([
  vectorStore.search(enrichedQuery, { namespace: 'historical-corpus', topK: 5 }),
  userId
    ? vectorStore.search(enrichedQuery, { namespace: `user-${userId}`, topK: 3 })
    : Promise.resolve([]),
]);

const context = [
  ...generalResults.map(r => r.pageContent),
  ...personalResults.map(r => `[PERSONAL RECORD] ${r.pageContent}`),
].join('\n\n');
```

Personal records are prefixed with `[PERSONAL RECORD]` so the synthesizer and narrator know to treat them as verified facts, not inferred historical context.

The synthesizer and narrator prompts need a small update: when `[PERSONAL RECORD]` tags are present, treat those as primary sources and build the narrative around them, using the general historical context as background.

---

## 8. Client: Data Sources & Connection UI

Add a "Data Sources" section to the My Ancestors panel (Phase 10):

- **"Upload GEDCOM File"** — file input for `.ged` files; calls `POST /api/ancestors/import/gedcom`; shows a progress indicator and confirms how many ancestors were imported (plus any warnings).
- **"Load sample family"** — imports the bundled fixture (§ 5) so the user/recruiter can see the feature work instantly.
- **Imported ancestors list** — shows imported profiles with their parsed fields; supports re-import (idempotent) and per-user namespace clear.
- **"Continue with Google" / "Try the demo"** live on the login screen (§ 3), not here.

---

## 9. Privacy & Security Considerations

- GEDCOM files must be parsed server-side and **discarded after processing** — do not store the raw uploaded file.
- Living persons in GEDCOM files are often redacted ("Living"); the parser must skip them and never embed them.
- User-scoped Pinecone namespaces must ONLY be queried when the request is authenticated as that user. The server must never mix up user namespaces.
- The Pinecone delete API (`deleteAll({ namespace: 'user-{userId}' })`) must be called when a user clears their data or deletes their account.
- Google OAuth: store only `googleId` and verified email; do not persist Google access/refresh tokens beyond the sign-in exchange (HO issues its own JWTs).

---

## 10. Unit Tests

- GEDCOM parser — correctly extracts name, birth/death date + place, immigration event, occupation, and source citations from the fixture `.ged` file; handles missing fields gracefully; skips living persons; dedupe key is stable on re-import.
- `embedAncestorProfile` — generates correct document text from profile fields; calls Pinecone upsert with the correct namespace; skips embedding when insufficient data.
- Dual-source researcher — calls `vectorStore.search` twice (once for each namespace) when `userId` is present; calls once (general corpus only) when `userId` is absent; merges results with `[PERSONAL RECORD]` prefix on personal results.
- Google OAuth callback — exchanges code for tokens, verifies email, find-or-creates the user, issues HO JWTs; handles token-exchange failure.
- Demo login — `POST /api/auth/demo` issues a valid session for the seeded demo account.

---

## 11. Verification (Done Criteria)

- [x] Google Cloud OAuth client registered; credentials in env vars (dev + prod redirect URIs).
- [x] "Continue with Google" sign-in works end-to-end; `users` gains `googleId` / `authProvider`.
- [x] "Try the demo" issues a session for the seeded demo account; existing email/password flow still works.
- [x] `ancestor_profiles` schema extended with the 12 GEDCOM-derived fields.
- [x] GEDCOM parser implemented; `POST /api/ancestors/import/gedcom` functional, idempotent, skips living persons.
- [x] Sample `.ged` fixture committed; "Load sample family" import works; demo account pre-seeded with it.
- [x] `embedAncestorProfile` service embeds and upserts into the user-scoped Pinecone namespace.
- [x] Researcher agent runs dual-source queries; personal records prefixed with `[PERSONAL RECORD]`.
- [x] Synthesizer and narrator prompts updated to treat `[PERSONAL RECORD]` as primary sources.
- [x] Unit tests for the GEDCOM parser, embedding service, dual-source researcher, Google OAuth callback, and demo login.
- [x] Pinecone namespace cleanup on user data-clear and account deletion.
- [x] Privacy review: raw GEDCOM files not persisted; living persons skipped; namespaces isolated per user; no Google tokens persisted.
