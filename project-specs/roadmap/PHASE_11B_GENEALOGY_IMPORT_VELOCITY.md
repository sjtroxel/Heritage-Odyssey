# Phase 11B Plan: Genealogy Import (Velocity Path / MVP Cut)

> **Status: PLANNED — alternative to [Phase 11A Depth](PHASE_11A_GENEALOGY_IMPORT_DEPTH.md). Choose one path after Phase 10.**
>
> This is the **Velocity Path** for Phase 11. Keeps the architecturally interesting parts (GEDCOM import, per-user Pinecone namespacing, dual-source RAG, Google OAuth + demo mode) and drops the work that adds engineering time without much marginal portfolio signal (the full 12-field schema extension, multi-event/port/ship parsing, source citation summary blob). Estimated ~4-5 weeks solo. Pair with [Phase 12B](PHASE_12B_EVAL_INFRA_VELOCITY.md) for the full velocity-to-applying strategy. See [ROADMAP.md § Strategic Fork After Phase 10](ROADMAP.md) for the trade-off analysis.

## 0. Data-Source Decision (read first)

Same context as [Phase 11A § 0](PHASE_11A_GENEALOGY_IMPORT_DEPTH.md): the **FamilySearch API** is closed to individual/portfolio projects, and **WikiTree** was rejected because its terms forbid caching retrieved data beyond a session (incompatible with per-user embedding). The data source is **GEDCOM file import** — an open file format with no gatekeeper, exported free by Ancestry/MyHeritage/Findmypast/etc., supplied by the user themselves. The third-party-OAuth portfolio signal is recovered via **Google OAuth on the app's own auth** (§ 3), not via a genealogy provider.

---

## 1. Objective

Same architectural goal as Phase 11A: replace the single-source query model with a dual-source retrieval architecture (general historical corpus + per-user ancestor record namespace). The narrative output goes from "Polish immigrants in the 1880s traveled via Hamburg..." to "Stanisław Kowalski emigrated from Hamburg in 1896, arriving at Castle Garden..."

Phase 11B reaches that outcome with the minimum work the portfolio story requires. Anything that does not directly serve the recruiter-visible architecture (per-user dynamic embeddings, dual-source RAG, third-party OAuth) is cut.

---

## 2. What's kept vs cut from Path A

| Component | Path A (Depth) | Path B (Velocity) | Why |
| :--- | :--- | :--- | :--- |
| GEDCOM file upload + parser | Full multi-event extraction | **Core fields — kept** | Real personal-data ingestion is the feature value and interview signal |
| Per-user Pinecone namespaces | Full | **Full — kept** | The architectural payoff — the load-bearing differentiator |
| Dual-source researcher agent | Full | **Full — kept** | Interview-load-bearing change to the agent graph |
| Synthesizer/narrator `[PERSONAL RECORD]` updates | Full | **Full — kept** | Small but essential |
| Google OAuth + demo mode | Full | **Full — kept** | This is the third-party-OAuth signal; cheap and high-value |
| Sample `.ged` fixture + "Load sample family" | Full | **Full — kept** | Makes the demo one-click and dependency-free; trivial to build |
| Privacy hardening (discard raw file, skip living persons, namespace isolation, cleanup) | Full | **Full — kept** | Non-negotiable for real personal data |
| `ancestor_profiles` schema extension | 12 new fields | **6 fields — trimmed** | Birth/death/arrival data is enough; cut deathPlace, departurePort, shipName, occupations array, sourceSummary |
| Multi-event / port / ship / source-citation parsing | Full | **CUT** | The deep GEDCOM extraction (ports, ship names, source blobs) is ~1-2 weeks for marginal recruiter signal |
| Unit test breadth | parser + embedding + dual-source + OAuth + demo | parser + embedding + dual-source + OAuth + demo (core fields only) | Track scope |

The cuts remove ~2-4 weeks of work and lose nothing recruiter-visible.

---

## 3. Google OAuth + Demo Mode

Identical to [Phase 11A § 3](PHASE_11A_GENEALOGY_IMPORT_DEPTH.md). "Continue with Google" (OAuth 2.0 authorization code flow) layered on the existing JWT system, a retained "Try the demo" seeded-account path, and the email/password flow preserved. `users` gains `googleId` and `authProvider`. Endpoints: `GET /api/auth/google`, `GET /api/auth/google/callback`, `POST /api/auth/demo`. This carries over without modification.

---

## 4. GEDCOM Import (core fields)

Same upload endpoint and parser library as Phase 11A § 4 (`POST /api/ancestors/import/gedcom`, `@it9gamelog/gedcom-parser`). The difference is extraction depth: parse only the core life-event fields, skip the ports/ship/source-citation extraction.

### 4.1 Schema Addition (trimmed to 6 fields)

Add only these to `ancestor_profiles`:

```typescript
export const ancestorProfiles = pgTable('ancestor_profiles', {
  // Existing fields (unchanged)
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  birthRegion: text('birth_region').notNull(),
  era: text('era').notNull(),
  // New fields parsed from GEDCOM (Velocity cut: 6 fields)
  gedcomId: text('gedcom_id'),               // GEDCOM record pointer, for dedupe
  birthDate: text('birth_date'),             // ISO or approximate
  birthPlace: text('birth_place'),           // Full place string
  deathDate: text('death_date'),
  arrivalDate: text('arrival_date'),         // Immigration arrival
  arrivalPort: text('arrival_port'),         // Castle Garden, Ellis Island, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Dropped from Path A:** `deathPlace`, `departurePort`, `shipName`, `occupations` array, `sourceSummary` JSON blob. The kept six fields are enough to generate narrative-rich personal records (see § 6).

**Still required even in the velocity cut:** skip living persons, discard the raw file after parsing, and dedupe on the GEDCOM record ID so re-import is idempotent.

---

## 5. Sample GEDCOM (Demo-Proofing)

Kept from Phase 11A § 5. Commit a small fictional `.ged` fixture, wire a "Load sample family" button, and pre-seed the demo account with it. This is cheap and it is what makes the recruiter demo a single click with zero external dependency, so it stays in the velocity path.

---

## 6. Per-User Pinecone Namespacing

Identical to Phase 11A § 6 with the only adjustment being smaller per-ancestor document sets due to the trimmed schema.

### 6.1 What gets embedded per ancestor (Velocity Path version)

With the 6-field schema, generate 2-3 short documents per ancestor instead of 4:

```
Doc 1 (identity):
"Stanisław Kowalski was born in 1872 in Galicia, Austria-Hungary. He died
circa 1934."

Doc 2 (immigration):
"Stanisław Kowalski emigrated and arrived at Castle Garden, New York in 1896."
```

Shorter than Path A's documents, but still grounded in the user's real GEDCOM records. The narrative quality difference vs Path A is marginal — Path A's `shipName` and `departurePort` add color but are not load-bearing for the dual-source RAG architecture.

### 6.2 Embedding Service

Same `embedAncestorProfile(profile, userId)` signature as Phase 11A. Same Pinecone namespace pattern (`user-{userId}`). Same trigger (auto-embed on profile create/update when sufficient data is present).

---

## 7. Dual-Source Researcher Agent

Identical to Phase 11A § 7. The two-namespace parallel query, `[PERSONAL RECORD]` prefix, and synthesizer/narrator prompt updates carry over unchanged. This is the load-bearing architectural change — keep it intact.

```typescript
const [generalResults, personalResults] = await Promise.all([
  vectorStore.search(enrichedQuery, { namespace: 'historical-corpus', topK: 5 }),
  userId
    ? vectorStore.search(enrichedQuery, { namespace: `user-${userId}`, topK: 3 })
    : Promise.resolve([]),
]);
```

---

## 8. Client: Data Sources UI

Same as Phase 11A § 8:

- **"Upload GEDCOM File"** control
- **"Load sample family"** button
- Imported ancestors list with re-import + per-user namespace clear
- **"Continue with Google" / "Try the demo"** on the login screen

---

## 9. Privacy & Security

Same requirements as Phase 11A § 9:

- Raw GEDCOM files parsed server-side and discarded — never persisted
- Living persons skipped, never embedded
- User-scoped Pinecone namespaces only queried when authenticated as that user
- Pinecone `deleteAll({ namespace: 'user-{userId}' })` on data-clear or account delete
- No Google access/refresh tokens persisted beyond the sign-in exchange

---

## 10. Unit Tests

Same as Phase 11A § 10 minus the deep-extraction parser cases:

- GEDCOM parser — extracts name, birth/death date, birth place, arrival from the fixture `.ged`; handles missing fields; skips living persons; stable dedupe key
- `embedAncestorProfile` — document generation, namespace targeting, skip-on-insufficient-data
- Dual-source researcher — calls vector store twice when `userId` present, once when absent; `[PERSONAL RECORD]` prefixing
- Google OAuth callback — code-for-token exchange, find-or-create, HO JWT issue; failure path
- Demo login — issues a valid session for the seeded demo account

---

## 11. Verification (Done Criteria)

- [ ] Google Cloud OAuth client registered; "Continue with Google" works end-to-end; `users` gains `googleId` / `authProvider`
- [ ] "Try the demo" issues a seeded-account session; email/password flow still works
- [ ] `ancestor_profiles` schema extended with the 6 velocity-path fields
- [ ] GEDCOM parser implemented; `POST /api/ancestors/import/gedcom` functional, idempotent, skips living persons
- [ ] Sample `.ged` fixture committed; "Load sample family" works; demo account pre-seeded
- [ ] `embedAncestorProfile` service embeds and upserts into the user-scoped Pinecone namespace
- [ ] Researcher agent runs dual-source queries with `[PERSONAL RECORD]` prefix on personal results
- [ ] Synthesizer and narrator prompts updated to treat `[PERSONAL RECORD]` as primary sources
- [ ] Unit tests for parser, embedding service, dual-source researcher, Google OAuth callback, demo login
- [ ] Pinecone namespace cleanup on user data-clear and account deletion
- [ ] Privacy review: raw files not persisted, living persons skipped, namespaces isolated, no Google tokens persisted

---

## 12. Time and Trade-Off Summary

| Dimension | Path A (Depth) | Path B (Velocity) |
| :--- | :--- | :--- |
| Estimated solo time | 6-10 weeks | 4-5 weeks |
| GEDCOM import | Full multi-event extraction | Core fields |
| Google OAuth + demo mode | Yes | Yes |
| Per-user Pinecone namespaces | Yes | Yes |
| Dual-source RAG | Yes | Yes |
| Schema fields added to `ancestor_profiles` | 12 | 6 |
| Ports / ship names / source-citation blobs | Yes | **No** |
| Recruiter-visible architecture difference | None — both demo the same dual-source RAG | None |

Path B gets you to the same recruiter demo ~2-4 weeks faster. The cost is shallower per-ancestor detail (no ports, ships, or source-citation summaries). For a portfolio project with one real user (you) and a bundled sample tree, that cost is essentially zero.
