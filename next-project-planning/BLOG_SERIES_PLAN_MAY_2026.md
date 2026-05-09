# LinkedIn Blog Series — May 2026 Macro Plan

**Goal:** Four LinkedIn feed posts, one per deployed project, in technical depth, to drive recruiter inbound for the remote AI Software Engineer search.

**Status:** Planned 2026-05-09. Series opens with ChronoQuizzr post #1.

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

## 9. Pre-post #3 work: Asteroid Bonanza rate limit

**Problem:** Each analysis = 60–90s of 4-Sonnet inference, ~$0.50+ from prepaid Claude balance. Without a guard, spammed traffic could exhaust the user's credit budget before recruiters get value.

**Plan** (handled in a separate Claude session opened at the asteroid-bonanza repo, since this Heritage-Odyssey session is scoped to a different working directory):

1. Add `express-rate-limit` middleware. 2 analyses per IP per 24 hours. 429 response with a friendly "demo budget exhausted; see video walkthrough above" message.
2. Record the 60–90s native screencast of a real analysis running, end-to-end. Save to disk and upload directly to the LinkedIn post.
3. Optional: a "view sample analysis" route that loads a pre-computed dossier with zero API cost — lets visitors browse the output structure even after their rate-limit quota is spent.

**Sequence:** ship #1 first, then defer this until after post #1 (ChronoQuizzr) is live. Must be done before post #3 publishes. ~30–60 min of work.

**Do not downgrade to Haiku.** The 4-Sonnet swarm is the story. Cost-shifting through rate limit + cached samples is the right answer.

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
