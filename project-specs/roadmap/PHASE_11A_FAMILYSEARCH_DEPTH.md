# Phase 11A Plan: FamilySearch Integration & Dual-Source RAG (Depth Path)

> **Status: PLANNED — alternative to [Phase 11B Velocity](PHASE_11B_FAMILYSEARCH_VELOCITY.md). Choose one path after Phase 10.**
>
> This is the **Depth Path** for Phase 11. Full FamilySearch integration including GEDCOM fallback import, the complete 12-field ancestor schema extension, source citation summary, and per-user Pinecone namespaces. Estimated ~6-10 weeks solo. Pair with [Phase 12A](PHASE_12A_PYTHON_EVAL_SERVICE_DEPTH.md) for the full single-mega-project strategy. See [ROADMAP.md § Strategic Fork After Phase 10](ROADMAP.md) for the trade-off analysis.
>
> This phase delivers the technical differentiator that separates Heritage Odyssey from every other LangGraph + RAG portfolio project: real genealogy records from the world's largest genealogy database, embedded per-user and searched alongside the static historical corpus.

## 1. Objective

Replace the current static query model with a dual-source retrieval architecture. The researcher agent currently searches one corpus: general historical documents (immigration patterns, Ellis Island records, migration contexts). After this phase, it searches two:

1. **General historical corpus** (Pinecone, existing) — broad historical context, unchanged.
2. **User-specific record namespace** (Pinecone, new) — actual records attached to the user's ancestors, sourced from FamilySearch and/or a GEDCOM file upload.

The result: instead of "Polish immigrants in the 1880s traveled via Hamburg...", the narrative can say "According to the 1900 U.S. Census, Stanisław Kowalski (your great-great-grandfather) lived at 423 W. Division St., Chicago, with wife Agnieszka and three children — four years after arriving at Castle Garden in 1896."

This is a qualitatively different product and a qualitatively different technical story.

---

## 2. FamilySearch Background

**FamilySearch** is operated by The Church of Jesus Christ of Latter-day Saints. It is the largest genealogy database in the world: 7+ billion records, 1.4+ billion individuals in linked family trees, records from 110+ countries spanning 500 years. The API is **free** and well-documented. Access requires creating a developer account and registering an app at [developer.familysearch.org](https://developer.familysearch.org).

**Key resources:**
- API documentation: [https://www.familysearch.org/developers/docs/api/](https://www.familysearch.org/developers/docs/api/)
- OAuth 2.0 sandbox environment available for development without real user data
- Rate limits: 200 requests/minute per app in production; sandbox is more permissive
- Authentication: OAuth 2.0 authorization code flow (same pattern as Google/GitHub OAuth)

---

## 3. Authentication: FamilySearch OAuth 2.0

FamilySearch uses OAuth 2.0 authorization code flow. The user logs in with their FamilySearch credentials on FamilySearch's own login page; Heritage Odyssey receives an access token and refresh token. This is standard third-party OAuth — the same pattern as "Login with Google."

### 3.1 Flow

```
User clicks "Connect FamilySearch"
  → Server redirects to https://ident.familysearch.org/cis-web/oauth2/v3/authorization
      with client_id, redirect_uri, response_type=code, scope=openid profile
  → User authenticates on FamilySearch's login page
  → FamilySearch redirects back to /api/familysearch/callback?code=<auth_code>
  → Server exchanges code for access_token + refresh_token via POST to token endpoint
  → Server stores tokens (encrypted) against the Heritage Odyssey user record
  → Client receives confirmation; "Connect FamilySearch" button becomes "FamilySearch Connected"
```

### 3.2 Schema Addition

Add a `familysearch_tokens` table (or add columns to `users`):

```sql
-- Option A: separate table (preferred — keeps OAuth concerns isolated)
familysearch_tokens (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  access_token text NOT NULL,       -- encrypted at rest
  refresh_token text NOT NULL,      -- encrypted at rest
  expires_at timestamp NOT NULL,
  fs_person_id text,                -- the user's own FamilySearch person ID
  created_at timestamp NOT NULL
)
```

Token encryption: use Node.js `crypto.createCipheriv` with AES-256-GCM and a `FS_TOKEN_ENCRYPTION_KEY` env var. Tokens must NOT be stored in plaintext — this is user data belonging to a third-party service.

### 3.3 New API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/familysearch/connect` | Generates the FamilySearch OAuth authorization URL and returns it (client redirects) |
| `GET` | `/api/familysearch/callback` | Handles the OAuth callback; exchanges code for tokens; stores them; redirects to client |
| `DELETE` | `/api/familysearch/disconnect` | Revokes tokens and removes the `familysearch_tokens` row |
| `GET` | `/api/familysearch/status` | Returns `{ connected: boolean, personId?: string }` — used by the client to show connection state |

---

## 4. Family Tree Import

Once connected, the user can import their family tree into Heritage Odyssey's `ancestor_profiles` table.

### 4.1 FamilySearch API Calls

The FamilySearch API uses a REST/JSON format with HAL links. Key endpoints:

- `GET /platform/tree/current-user-person` — the authenticated user's own person record
- `GET /platform/tree/persons/{pid}` — a person record by ID
- `GET /platform/tree/persons/{pid}/pedigree` — ancestors in a pedigree tree (4 generations = 15 people)
- `GET /platform/tree/persons/{pid}/sources` — attached sources/records for a person

**Recommended import scope:** 4 generations (great-great-grandparents) by default, configurable up to 6 generations. Beyond 6 generations the record quality drops significantly and the API calls multiply.

### 4.2 Schema Addition to `ancestor_profiles`

The current `ancestor_profiles` table has only `name`, `birth_region`, and `era`. FamilySearch provides much richer data. Extend the schema with a Drizzle migration:

```typescript
export const ancestorProfiles = pgTable('ancestor_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // Existing fields
  name: text('name').notNull(),
  birthRegion: text('birth_region').notNull(),
  era: text('era').notNull(),
  // New fields from FamilySearch
  fsPid: text('fs_pid'),                    // FamilySearch person ID (e.g., "LZNY-BVK")
  birthDate: text('birth_date'),            // ISO string or approximate ("1872", "Abt 1870")
  birthPlace: text('birth_place'),          // Full place string ("Galicia, Austria-Hungary")
  deathDate: text('death_date'),
  deathPlace: text('death_place'),
  arrivalDate: text('arrival_date'),        // Immigration arrival (from vital records)
  arrivalPort: text('arrival_port'),        // "New York", "Baltimore", "Castle Garden"
  departurePort: text('departure_port'),    // "Hamburg", "Bremen", "Liverpool"
  shipName: text('ship_name'),
  occupations: text('occupations').array(), // Array of known occupations
  sourceSummary: text('source_summary'),    // JSON blob of attached record citations
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 4.3 New API Endpoint

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/familysearch/import` | Triggers tree import for the authenticated user. Pulls 4-generation pedigree, creates/updates `ancestor_profiles` rows. Returns a count of imported ancestors. |

The import is idempotent: if an `ancestor_profile` with a matching `fsPid` already exists for this user, update it rather than create a duplicate.

---

## 5. GEDCOM Import (Fallback for Non-FamilySearch Users)

GEDCOM (.ged) is the universal genealogy file format. Every major genealogy platform (Ancestry, MyHeritage, Findmypast, MacFamilyTree) can export a GEDCOM file. Supporting GEDCOM import means users who don't have a FamilySearch account — or who have more complete data on Ancestry — can still use the full feature set.

### 5.1 Parsing

Use the `gedcom` npm package or `@geneanet/gedcom-parser` (both well-maintained). GEDCOM files are text; a typical 4-generation family export is 20-100KB.

Parse `INDI` (individual) records to extract: name, birth date, birth place, death date, death place, immigration events (`IMMI`, `EMIG`), occupation (`OCCU`), ship (`SHIP` custom tag or note). Create `ancestor_profiles` rows from the parsed data.

### 5.2 New API Endpoint

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ancestors/import/gedcom` | Accepts a `.ged` file upload (multipart). Parses it and creates ancestor profiles. Returns a count of imported ancestors and a list of warnings (unparseable records). |

---

## 6. Per-User Record Namespacing in Pinecone

This is the architectural heart of Phase 11. The current Pinecone index stores general historical documents in a shared namespace. Phase 11 adds a second tier: each user's actual ancestor records, stored in a Pinecone namespace scoped to that user.

### 6.1 Namespace Strategy

Pinecone supports **namespaces** within an index as a way to partition vectors. Use the user's UUID as the namespace:

```
General corpus namespace:   "historical-corpus" (existing)
User-specific namespace:    "user-{userId}"     (new per user)
```

When a user imports their family tree (§4 or §5), each ancestor profile generates a set of text documents from the structured data, which are then embedded and upserted into the user's namespace.

### 6.2 What Gets Embedded Per Ancestor

For each ancestor profile row with sufficient data, generate 3-5 text documents:

```
Doc 1 (identity):
"Stanisław Kowalski was born approximately 1872 in Galicia, Austria-Hungary (now southern Poland). He died circa 1934 in Chicago, Illinois. His FamilySearch ID is LZNY-BVK."

Doc 2 (immigration):
"Stanisław Kowalski emigrated from the port of Hamburg, Germany in 1896, arriving at Castle Garden, New York. He traveled aboard the S.S. Pennsylvania. His stated destination was Chicago, Illinois."

Doc 3 (life events):
"In the 1900 U.S. Federal Census, Stanisław Kowalski was recorded at 423 W. Division St., Chicago, Cook County, Illinois. Occupation: laborer. Household included wife Agnieszka (born 1875, Poland) and three children."

Doc 4 (sources):
"FamilySearch sources attached to Stanisław Kowalski (LZNY-BVK): 1900 U.S. Federal Census (FamilySearch Film 1240251), Hamburg Emigration Records 1896, Cook County Death Certificate 1934."
```

These documents are small, specific, and citation-rich. When the researcher agent retrieves them, the narrator can ground the story in actual records.

### 6.3 Embedding Service Change

Add a `embedAncestorProfile(profile: AncestorProfile, userId: string)` function in `server/src/services/embedding.ts`:
- Generates the text documents from the structured profile fields
- Embeds them using the existing embedding model
- Upserts into the `user-{userId}` Pinecone namespace

Called automatically when an ancestor profile is created or updated with sufficient data (name + at least one location field + at least one date field).

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

## 8. Client: FamilySearch Connection UI

Add a "Data Sources" section to the My Ancestors panel (Phase 10):

- **"Connect FamilySearch"** button — triggers the OAuth flow (server returns the auth URL; client does `window.location.href = authUrl`).
- Post-connection: shows "FamilySearch Connected ✓" with the user's name from FamilySearch.
- **"Import Family Tree"** button — calls `POST /api/familysearch/import`; shows a progress indicator; confirms how many ancestors were imported.
- **"Upload GEDCOM File"** — file input for `.ged` files; calls `POST /api/ancestors/import/gedcom`.
- **"Disconnect"** — revokes tokens and removes user-scoped Pinecone data.

---

## 9. Privacy & Security Considerations

- FamilySearch OAuth tokens must be encrypted at rest (AES-256-GCM, not base64 encoding).
- User-scoped Pinecone namespaces must ONLY be queried when the request is authenticated as that user. The server must never mix up user namespaces.
- GEDCOM files must be parsed server-side and discarded after processing — do not store the raw file.
- The Pinecone delete API (`deleteAll({ namespace: 'user-{userId}' })`) must be called when a user disconnects FamilySearch or deletes their account.
- Living persons in GEDCOM files are often redacted (replaced with "Living") — the parser must handle this gracefully and skip embedding for living persons.

---

## 10. Unit Tests

- FamilySearch OAuth callback — exchanges code for tokens, encrypts and stores them, redirects correctly; handles token exchange failure.
- `/api/familysearch/status` — returns `connected: true` when tokens exist, `connected: false` otherwise.
- `embedAncestorProfile` — generates correct document text from profile fields; calls Pinecone upsert with the correct namespace; skips embedding when insufficient data.
- Dual-source researcher — calls `vectorStore.search` twice (once for each namespace) when `userId` is present; calls once (general corpus only) when `userId` is absent; merges results with `[PERSONAL RECORD]` prefix on personal results.
- GEDCOM parser — correctly extracts name, birth date, birth place, immigration event from a fixture `.ged` file; handles missing fields gracefully.

---

## 11. Verification (Done Criteria)

- [ ] FamilySearch developer app registered; sandbox and production credentials in env vars.
- [ ] OAuth flow complete: user can connect and disconnect FamilySearch from the UI.
- [ ] `familysearch_tokens` table added with encrypted token storage.
- [ ] `ancestor_profiles` schema extended with immigration fields (birth/death/arrival/departure/ship).
- [ ] `POST /api/familysearch/import` pulls 4-generation pedigree and creates `ancestor_profiles` rows.
- [ ] GEDCOM parser implemented; `POST /api/ancestors/import/gedcom` functional.
- [ ] `embedAncestorProfile` service embeds and upserts into user-scoped Pinecone namespace.
- [ ] Researcher agent runs dual-source queries; personal records prefixed with `[PERSONAL RECORD]`.
- [ ] Synthesizer and narrator prompts updated to treat `[PERSONAL RECORD]` as primary sources.
- [ ] Unit tests for OAuth callback, embedding service, dual-source researcher, and GEDCOM parser.
- [ ] Pinecone namespace cleanup on user disconnect and account deletion.
- [ ] Privacy review: raw GEDCOM files not persisted; tokens encrypted; namespaces isolated per user.
