# Phase 11B Plan: FamilySearch Integration (Velocity Path / MVP Cut)

> **Status: PLANNED — alternative to [Phase 11A Depth](PHASE_11A_FAMILYSEARCH_DEPTH.md). Choose one path after Phase 10.**
>
> This is the **Velocity Path** for Phase 11. Keeps the architecturally interesting parts (FamilySearch OAuth, per-user Pinecone namespacing, dual-source RAG) and drops the work that adds engineering time without much marginal portfolio signal (GEDCOM parser, the full 12-field schema extension, source citation summary blob). Estimated ~4-5 weeks solo. Pair with [Phase 12B](PHASE_12B_EVAL_INFRA_VELOCITY.md) for the full velocity-to-applying strategy. See [ROADMAP.md § Strategic Fork After Phase 10](ROADMAP.md) for the trade-off analysis.

## 1. Objective

Same architectural goal as Phase 11A: replace the single-source query model with a dual-source retrieval architecture (general historical corpus + per-user ancestor record namespace). The narrative output goes from "Polish immigrants in the 1880s traveled via Hamburg..." to "Stanisław Kowalski emigrated from Hamburg in 1896, arriving at Castle Garden..."

Phase 11B reaches that outcome with the minimum work the portfolio story requires. Anything that does not directly serve the recruiter-visible architecture (per-user dynamic embeddings, dual-source RAG, encrypted third-party OAuth) is cut.

---

## 2. What's kept vs cut from Path A

| Component | Path A (Depth) | Path B (Velocity) | Why |
| :--- | :--- | :--- | :--- |
| FamilySearch OAuth 2.0 | Full | **Full — kept** | Real third-party API integration is the interview signal |
| AES-256-GCM token encryption at rest | Full | **Full — kept** | Cheap, real depth, security-engineering reps |
| 4-generation tree import | Full | **Full — kept** | The actual feature value |
| Per-user Pinecone namespaces | Full | **Full — kept** | The architectural payoff — the load-bearing differentiator |
| Dual-source researcher agent | Full | **Full — kept** | Interview-load-bearing change to the agent graph |
| `ancestor_profiles` schema extension | 12 new fields | **6 fields — trimmed** | Birth/death/arrival data is enough; cut deathPlace, departurePort, shipName, occupations array, sourceSummary |
| Synthesizer/narrator prompt updates for `[PERSONAL RECORD]` | Full | **Full — kept** | Small but essential |
| Privacy hardening (token encryption, namespace isolation, cleanup on disconnect) | Full | **Full — kept** | Non-negotiable for real third-party data |
| **GEDCOM file import + parser** | Included | **CUT** | You are functionally the only user; "fallback for users without FamilySearch accounts" is product thinking, not portfolio thinking. The parser + edge cases + living-person redaction are ~1-2 weeks for marginal recruiter signal. |
| Unit test breadth | OAuth + embedding + dual-source + GEDCOM | OAuth + embedding + dual-source (no GEDCOM) | Track scope |

The cuts remove ~2-4 weeks of work and lose nothing recruiter-visible.

---

## 3. FamilySearch OAuth 2.0

Identical to Phase 11A § 3. The OAuth flow, schema (`familysearch_tokens` table), and endpoints (`/connect`, `/callback`, `/disconnect`, `/status`) are unchanged. Token encryption with AES-256-GCM and a `FS_TOKEN_ENCRYPTION_KEY` env var is non-negotiable.

See Phase 11A § 3.1-3.3 for the full design; it carries over without modification.

---

## 4. Tree Import (FamilySearch only)

Identical to Phase 11A § 4.1: pull 4-generation pedigree via the FamilySearch API.

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
  // New fields from FamilySearch (Velocity cut: 6 fields)
  fsPid: text('fs_pid'),                    // FamilySearch person ID
  birthDate: text('birth_date'),            // ISO or approximate
  birthPlace: text('birth_place'),          // Full place string
  deathDate: text('death_date'),
  arrivalDate: text('arrival_date'),        // Immigration arrival
  arrivalPort: text('arrival_port'),        // Castle Garden, Ellis Island, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Dropped from Path A:** `deathPlace`, `departurePort`, `shipName`, `occupations` array, `sourceSummary` JSON blob. The kept six fields are enough to generate narrative-rich personal records (see § 6 below).

### 4.2 Import Endpoint

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/familysearch/import` | Triggers tree import for the authenticated user. Pulls 4-generation pedigree, creates/updates `ancestor_profiles` rows. Returns count of imported ancestors. Idempotent by `fsPid`. |

Same as Phase 11A. No change.

---

## 5. GEDCOM Import — CUT

Phase 11A § 5 (GEDCOM parser, `/api/ancestors/import/gedcom` endpoint, multipart upload, living-person redaction) is **not implemented in the Velocity Path**.

If a future need to support non-FamilySearch users emerges (e.g., from real user feedback), add as a Phase 11.5. For portfolio purposes, FamilySearch alone covers the differentiator.

---

## 6. Per-User Pinecone Namespacing

Identical to Phase 11A § 6 with the only adjustment being smaller per-ancestor document sets due to the trimmed schema.

### 6.1 What gets embedded per ancestor (Velocity Path version)

With the 6-field schema, generate 2-3 short documents per ancestor instead of 4:

```
Doc 1 (identity):
"Stanisław Kowalski was born in 1872 in Galicia, Austria-Hungary. He died
circa 1934 in the United States. FamilySearch ID: LZNY-BVK."

Doc 2 (immigration):
"Stanisław Kowalski emigrated and arrived at Castle Garden, New York in 1896."
```

Shorter than Path A's documents, but still grounded in real FamilySearch records. The narrative quality difference vs Path A is marginal — Path A's `shipName` and `departurePort` add color but are not load-bearing for the dual-source RAG architecture.

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

## 8. Client: FamilySearch Connection UI

Same as Phase 11A § 8 minus the GEDCOM upload control:

- **"Connect FamilySearch"** button
- **"Import Family Tree"** button
- Connection status indicator
- **"Disconnect"** button (revokes tokens + cleans up user-scoped Pinecone namespace)

No GEDCOM file input control.

---

## 9. Privacy & Security

Same requirements as Phase 11A § 9 minus the GEDCOM-specific concerns:

- FamilySearch OAuth tokens encrypted at rest (AES-256-GCM, not base64)
- User-scoped Pinecone namespaces only queried when authenticated as that user
- Pinecone `deleteAll({ namespace: 'user-{userId}' })` on disconnect or account delete

---

## 10. Unit Tests

Same as Phase 11A § 10 minus the GEDCOM parser tests:

- FamilySearch OAuth callback — code-for-token exchange, encryption, redirect; failure path
- `/api/familysearch/status` — connected/disconnected branches
- `embedAncestorProfile` — document generation, namespace targeting, skip-on-insufficient-data
- Dual-source researcher — calls vector store twice when `userId` present, once when absent; `[PERSONAL RECORD]` prefixing

---

## 11. Verification (Done Criteria)

- [ ] FamilySearch developer app registered; sandbox and production credentials in env vars
- [ ] OAuth flow complete: connect and disconnect from the UI work end-to-end
- [ ] `familysearch_tokens` table added with AES-256-GCM token storage
- [ ] `ancestor_profiles` schema extended with the 6 velocity-path fields
- [ ] `POST /api/familysearch/import` pulls 4-generation pedigree and creates `ancestor_profiles` rows (idempotent by `fsPid`)
- [ ] `embedAncestorProfile` service embeds and upserts into user-scoped Pinecone namespace
- [ ] Researcher agent runs dual-source queries with `[PERSONAL RECORD]` prefix on personal results
- [ ] Synthesizer and narrator prompts updated to treat `[PERSONAL RECORD]` as primary sources
- [ ] Unit tests for OAuth callback, embedding service, and dual-source researcher
- [ ] Pinecone namespace cleanup on user disconnect and account deletion
- [ ] Privacy review: tokens encrypted, namespaces isolated per user

---

## 12. Time and Trade-Off Summary

| Dimension | Path A (Depth) | Path B (Velocity) |
| :--- | :--- | :--- |
| Estimated solo time | 6-10 weeks | 4-5 weeks |
| FamilySearch OAuth | Yes | Yes |
| Per-user Pinecone namespaces | Yes | Yes |
| Dual-source RAG | Yes | Yes |
| GEDCOM file support | Yes | **No** |
| Schema fields added to `ancestor_profiles` | 12 | 6 |
| Recruiter-visible architecture difference | None — both demo the same dual-source RAG | None |
| Product-completeness difference | Real fallback for non-FamilySearch users | FamilySearch-only |

Path B gets you to the same recruiter demo ~2-4 weeks faster. The cost is that the app can only ingest data from one source. For a portfolio project with one real user (you), that cost is essentially zero.
