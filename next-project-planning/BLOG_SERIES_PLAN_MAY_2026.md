# LinkedIn Blog Series — May 2026 Macro Plan

**Goal:** Four LinkedIn feed posts, one per deployed project, in technical depth, to drive recruiter inbound for the remote AI Software Engineer search.

**Status:** **SERIES COMPLETE 2026-05-18.** All 4 posts shipped on cadence: ChronoQuizzr (5/11), Poster Pilot (5/12), Asteroid Bonanza (5/14), Wildlife Sentinel (5/18 8:54am CT). Whole-series window = 8 days (under the 10-day target). Originally planned 2026-05-09.

**Companion docs:**
- `DEVELOPER_PROFILE_MAY_2026.md` (Section 10 — LinkedIn Update Log; the Pending Change #1 entry is what this plan executes on)
- `prior-project-readme-docs/` (per-project READMEs Claude will reread before each post)
- `prior-project-blog-posts/` (this is where each finished post's source `.md` will be archived)

---

## 1. Why this series

The LinkedIn rebuild shipped 2026-05-08. Profile is recruiter-ready. Per the Codefi instructor recommendation, blog posts are now the highest-leverage visibility move. Each post addresses Section 8 priority #2 (technical write-ups) and the public-artifacts gap flagged in Section 7 of the developer profile doc.

The series is not "marketing." It is technical writing aimed at a reader who can tell when an architectural choice signals judgment versus when it signals lack of one.

## 2. Order — increasing complexity

| # | Project | Why this slot |
|---|---|---|
| 1 | **ChronoQuizzr** | Lowest complexity, highest interactivity. Auto-loads 5 questions on visit; non-technical connections (friends, classmates, past-life people) can play immediately. No auth gate. Ideal series opener — gets the cadence going with low-stakes content. |
| 2 | **Poster Pilot** | Mid-complexity. Semantic search over 5,000 posters. Includes honest dataset-size framing (see §10 below). |
| 3 | **Asteroid Bonanza** | Higher complexity. Four-Sonnet swarm + dual RAG indices + Anthropic tool use. **Blocked on rate-limit work** (see §9 below). Native video required. |
| 4 | **Wildlife Sentinel** | Highest complexity. Strongest portfolio piece. Self-improving Refiner/Evaluator loop. Series finale — the most ambitious post lands when the audience is warmest. |

## 3. Cadence

- ~2–3 days between posts.
- Morning publish window: 8–10 AM local time, ideally Tue / Wed / Thu (peak LinkedIn engagement).
- Whole series window: ~10 days.
- The Asteroid rate-limit work can be deferred until after post #1 ships, but must be live before post #3 publishes.

## 4. Length

- **Posts #1–2: ~200 words** baseline. Tight, hook-driven.
- **Posts #3–4: may scale to 350–400 words** as complexity warrants.
- LinkedIn feed cap is 3,000 characters (~500 words). We stay well below.

## 5. Per-post template

Every post follows this skeleton:

1. **Hook line** — first ~120–210 characters, before the "...see more" cut. Specific, concrete, not template-y. Avoid "I'm excited to share..." openings.
2. **Problem framing** — 1–2 sentences. What real (or simulated) problem this solves.
3. **Architecture in 3–4 short bullets** — agents, models, datastores, key flow. Concrete.
4. **One specific technical choice with reasoning** — the meat. The decision that signals judgment, not just feature listing.
5. **Stack list** — 1–2 lines, comma-separated.
6. **Outcome / link** — live deployment URL, optional GitHub link, optional CTA.

## 6. Visuals

- **1–2 images per post**, native-uploaded.
- **Video for Asteroid Bonanza specifically** — 60–90s native screencast of the 4-Sonnet swarm running, end-to-end. Embedded in the post. Solves the cost-exposure issue (§9) and gives the post the "watch the impressive runtime" payoff.
- **Per-app shot list** is provided when each post is drafted, not in advance. The shot list will name the exact view, the framing, what to crop, what to caption. User captures; Claude reviews before posting.

## 7. Hashtags

3–5 specific tags per post (not 15 generic). Pull from this set:

- Universal job-signal: `#OpenToWork`
- AI / engineering: `#AIEngineering`, `#GenerativeAI`, `#LLMs`
- Architecture: `#MultiAgentSystems`, `#RAG`, `#VectorSearch`, `#SemanticSearch`
- Stack: `#TypeScript`, `#NodeJS`

## 8. AI-tells to strip (locked, per existing feedback memory)

- No em dashes
- No emojis
- No "Selected Projects:" template headers
- No "no LangChain" framing
- Lead with concrete specifics, not abstract claims
- No "I'm thrilled to share / excited to announce" openings

## 9. Pre-post #3 work: Asteroid Bonanza rate limit — **COMPLETED 2026-05-12**

**Problem:** Each analysis = 60–90s of 4-Sonnet inference, ~$0.50+ from prepaid Claude balance. Without a guard, spammed traffic could exhaust the user's credit budget before recruiters get value.

**Status by item (as of 2026-05-12, end of day):**

1. **Rate-limit middleware — DONE.** `express-rate-limit` middleware applied to swarm-firing endpoints (POST `/api/analysis/:id` and GET `/api/analysis/:id/stream`) at 2 swarm runs per IP per 24h. Production-only (skips in dev/test). 429 response body uses friendly framing: *"Today's 2-analysis quota is exhausted. The 4-Sonnet swarm is expensive to run, so the demo is rate-limited per visitor. Quota resets in 24 hours."* The original planned message referenced "see video walkthrough above" — dropped because video is now TBD (see item 2). Also: trust-proxy was unset on the existing 500/15min global limiter — fixed in the same patch (`app.set('trust proxy', 1)`).

   **Plus three unplanned-but-needed additions caught during the work:**
   - **Companion `GET /api/analysis/quota` endpoint.** The Asteroid Bonanza client uses `EventSource` for streaming, which cannot read standard `RateLimit-*` HTTP headers in the browser. Added a peek-the-MemoryStore-non-mutatively endpoint that returns `{ limit, used, remaining, resetTime, active }` in JSON form. Client wires this for pre-flight (block stream open if exhausted) AND post-completion refresh (display "1 of 2 used today" indicator). See `project_asteroid_eventsource_migration` memory note for the longer-term migration path that would obsolete this workaround.
   - **IDE/ESLint config drift fix.** Server's `tsconfig.json` only included `src/**/*`, so the editor's eslint-plugin couldn't lint test files. Created `tsconfig.eslint.json` that extends the main one but widens scope to `tests/**/*`; ESLint config now points there. Also added explicit `rootDir: "./src"` to client's `tsconfig.app.json` and `tsconfig.spec.json` to silence the TS6059 warning. Pure editor-UX cleanup; no CI impact.
   - **Husky prepare script + railway.toml installCommand fix.** Surfaced during deployment debugging (see "Deployment cascade" below). Root `package.json` now has `"prepare": "husky || true"`. `railway.toml`'s `[build]` block now has `installCommand = "npm ci --include=dev"` so devDeps are present during Railway's build phase even with NODE_ENV=production.

2. **Native screencast of a real analysis — NOT DONE.** User pivoted away from video for this post on 2026-05-12 based on two arguments: 60–90s analysis runtime is too long for LinkedIn's engagement sweet spot, and the most visually striking moments of the app are static (completed dashboard, handoff case, orbital canvas) rather than motion. Replacing with a 2–3-still carousel approach. Final visuals decision deferred to user closer to publish.

3. **Optional pre-cached sample-analysis route — NOT DONE.** The original justification was "lets visitors browse output even after rate-limit quota is spent." Mostly obsoleted by the fact that the existing cheap-read endpoints (`/latest`, `/record/:id`, dossier route, planetary-defense dashboard) all stay open under the new rate-limit design — they aren't rate-limited because they're cheap DB reads. Visitors who exhaust their swarm quota can still browse any prior analysis cached in the DB. Deferred indefinitely.

**Deployment cascade (the multi-hour debug saga):** Setting `NODE_ENV=production` on Railway (required for the new limiter to activate) caused npm ci to skip devDependencies, which cascaded into multiple deploy failures: missing husky during prepare, then missing tsc during build. Two-commit fix landed: `package.json` prepare made production-safe (`husky || true`), then `railway.toml` got an explicit `installCommand = "npm ci --include=dev"` override. Lesson captured in `feedback_railway_node_env_cascade.md` memory for future Railway deploys (including Heritage Odyssey when it gets there).

**Test impact:** Server test suite grew from ~215 tests to 229 tests (7 new rate-limit + quota tests in `tests/integration/analysis.test.ts`; coverage held at 96.45% lines, comfortably above the 80% threshold). Client tests unchanged at 28 passing.

**"Do not downgrade to Haiku" rule held.** 4-Sonnet swarm preserved. Cost-shifting through per-IP rate limit + open cheap reads turned out to be sufficient; no model downgrade needed.

## 10. Poster Pilot honesty note

The 5,000-poster dataset has known semantic-search gaps (the "pig" query returns the handful of actual pigs, then declines into low-relevance matches; not because retrieval is broken, but because the catalog is small).

This is **not a weakness to hide** — it is a signal of engineering judgment if framed correctly. Draft framing to consider:

> 5,000 posters is enough to demonstrate the architecture, not enough to cover every long-tail query. A production version would need 100K–1M. The mechanism is the demo; the catalog size is a known constraint.

This converts the perceived flaw into "I know what production scale looks like."

## 11. Archive convention

Each post's final source markdown saves to `next-project-planning/prior-project-blog-posts/`, matching the existing `prior-project-readme-docs/` naming:

- `CHRONO_QUIZZR_BLOG.md`
- `POSTER_PILOT_BLOG.md`
- `ASTEROID_BONANZA_BLOG.md`
- `WILDLIFE_SENTINEL_BLOG.md`

LinkedIn posts decay from the in-feed view in days. The user owns the durable artifact via these `.md` files.

## 12. Per-post workflow (what Claude does each time)

When drafting each post, Claude will:

1. Read the project's README in `prior-project-readme-docs/` to refresh context.
2. WebFetch the deployed app URL to identify screenshot candidates.
3. WebFetch the GitHub repo's README + a key source file or two for any technical detail needed.
4. Draft the post following §5 template, at the §4 length.
5. Provide a per-app shot list (1–2 images, with explicit framing direction).
6. Review user's screenshot attempts before final posting.
7. Save final post text to `prior-project-blog-posts/PROJECT_NAME_BLOG.md`.
8. After publish: append a one-line entry to Section 10 of `DEVELOPER_PROFILE_MAY_2026.md` with the publish date and any inbound notes.

## 13. Success criteria

- All 4 posts published within ~10 days of 2026-05-09.
- Each post has at least one native-uploaded image; Asteroid Bonanza has a native video.
- Asteroid Bonanza rate limit shipped before post #3 goes live.
- All 4 source markdown files archived in `prior-project-blog-posts/`.
- Section 10 of `DEVELOPER_PROFILE_MAY_2026.md` updated after each publish.
- At least one recruiter inbound traceable to the series (stretch goal — the real signal, not vanity metrics).
