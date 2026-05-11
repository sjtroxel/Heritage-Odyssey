# Poster Pilot — LinkedIn Blog Post #2

**Status:** Draft 2026-05-11. Not yet published.
**Series:** Post 2 of 4. See `BLOG_SERIES_PLAN_MAY_2026.md`.
**Live app:** https://poster-pilot.vercel.app
**Repo:** https://github.com/sjtroxel/AI-Masterclass-Week-5

---

## The Post (paste into LinkedIn as-is)

> Built a poster search where an open-ended query gets expanded into 3–5 concrete descriptive phrases, each runs as a parallel CLIP vector search, and the rankings merge with Reciprocal Rank Fusion.
>
> The problem: a user types "WPA posters about hope" and a single embedding misses most of what they want. Semantic similarity is not semantic coverage.
>
> How it's built:
>
> - 5,000 posters from NARA, the Library of Congress, and the Smithsonian (via DPLA), embedded once with OpenAI's CLIP vit-large-patch14 into a 768-dim pgvector space.
> - Four search modes share the same vector space: text, image, hybrid, and vibe.
> - Vibe mode uses Claude Sonnet 4.6 to expand the query. RRF is an information-retrieval technique from TREC research, not a wrapper around cosine similarity.
> - A grounded RAG chatbot ("The Archivist") answers follow-up questions. Temperature 0.2, citation required, system prompt forbids invented dates or creators.
> - When CLIP's top result drops below 0.20 confidence, the app says so and routes you to a real NARA archivist.
>
> 5,000 posters is enough to demonstrate the architecture, not enough to cover every long-tail query. The mechanism is the demo; production scale is a separate problem.
>
> Stack: React 19, TypeScript, Tailwind v4, Express 5, Supabase + pgvector, Replicate (CLIP), Anthropic SDK. 253 tests at 99.5% statement coverage.
>
> Try it: poster-pilot.vercel.app
>
> #AIEngineering #RAG #VectorSearch #MultimodalAI #OpenToWork

---

## Length Check

- **Word count:** ~213 words (target was ~200 for posts #1–2; on spec)
- **Character count:** ~1,500 chars (well under LinkedIn's 3,000 cap)
- **Hook line cut-point:** The full first sentence is ~190 characters. On desktop the "...see more" cut lands around 210 chars, so the full hook is visible. On mobile (~140-char cut), the cut lands inside the sentence at "...gets expanded into 3–5..." — still intriguing enough to drive an expand-click.

---

## Video

**File:** `Recording 2026-05-11 103347.mp4` (in this same folder)
**Duration:** 108 seconds (1:48)
**Resolution:** 1280×828, 30 fps, H.264
**Size:** 62 MB (well under LinkedIn's 5 GB / 10 min native-video cap)
**Audio:** silent (correct choice for the same reasons as ChronoQuizzr — feed-scrollers have sound off; UI is text-on-screen)

### Why video, not stills (decided mid-session 2026-05-11)

Original plan was 2 still images: a vibe-mode hero shot and an Archivist detail shot. Mid-shoot the user hit two real problems with stills: (a) the masonry grid is only 4 cards wide so initial-viewport screenshots only show 3–4 posters; (b) The Archivist's streaming response is genuinely a motion-native feature — a still of completed text reads as "yeah, AI generated some words" while a clip of the response streaming + citation landing reads as "this is actually happening, with sources." User suggested screencast; agreed.

Native LinkedIn video also still gets stronger 2026-feed algorithmic lift than stills, and the precedent set by the ChronoQuizzr video on the same account makes a same-format follow-up the right move for series cohesion.

### Why 1:48 is acceptable here (longer than the ChronoQuizzr 0:42)

The video is longer than the LinkedIn-engagement sweet spot (~30–60s) but the length is justified because every section delivers a distinct piece of the story and no section is cuttable without architectural information loss:

- **0:00–0:05** — Dark-mode landing page. Logo + 4-mode selector + search bar visible. Hero frame for autoplay.
- **0:05–0:15** — Theme toggle to light/parchment mode. Demonstrates the dual-theme system as a polish bonus.
- **0:15–0:30** — Vibe mode selected, query ("Bold colorful propaganda from World War II") typed and submitted. The mode-selector change is the visual lede.
- **0:30–1:15** — Vibe results grid: WWII propaganda posters in masonry layout with confidence-percentage bars on every card. Visually striking; recruiter sees the catalog depth, the design system, and the confidence indicators all at once.
- **1:15–1:30** — Click into "Watch Your Safety Rules" poster detail page. Visible: Visually Similar section with 4 sibling posters and their similarity scores (84%, 83%, 82%, 82%) — free bonus demonstrating pgvector visual-siblings.
- **1:30–1:47 — the climax frame zone.** The Archivist sidebar receives a follow-up question; the response streams in with real grounded content naming specific entities (Lawson Wood, Bowman Pump Company, WPA Federal Art Project). Concrete visual proof of "doesn't hallucinate." The final ~2 seconds linger on the completed response with citation-style references so LinkedIn's auto-thumbnail logic can pick a strong end frame.

The audience for this post is recruiters and engineers searching `#AIEngineering #RAG #VectorSearch` — they're signing up for technical depth, not entertainment-content optimization. A 1:48 video with 40% completion rate sends a stronger algorithmic signal than a 0:42 video with 30%. The post stands on the depth showcase.

### Climax frame confirmation (from `ffmpeg` frame review 2026-05-11)

Frames extracted at 0s, 5s, 15s, 30s, 50s, 70s, 90s, 100s, and 107s. The 100s and 107s frames both show The Archivist's grounded response with named historical entities visible — these are the candidate auto-thumbnail frames. The 107s end frame is the strongest single-frame summary of the post's claim. If LinkedIn's auto-pick lands somewhere in the 70–107s range, no override needed. If it picks a 0–15s frame (landing page), consider overriding to 100s via ffmpeg-extracted PNG.

### LinkedIn upload notes

- Upload as **native video** via LinkedIn's "Add a video" button when composing the post. Do not link to a hosted file.
- LinkedIn auto-picks a thumbnail from an early frame, but the strong climax in the back half (90–107s) is worth checking. If the auto-pick lands on the static dark landing page (0–4s), override with `ffmpeg -ss 100 -i "Recording 2026-05-11 103347.mp4" -frames:v 1 thumbnail.png -loglevel error`.
- Mobile feed-viewers see roughly a square crop of the video. The 1280×828 native resolution is wider than 1:1 — the masonry result grid and The Archivist sidebar are both centered on screen, so the mobile center-crop should preserve the key visual content.

---

## Draft Notes (why these choices)

**Why lead with the vibe + RRF mechanism, not Claude or the Red Button?**

Three candidate leads were considered: (a) the "Red Button" human-handoff feature, (b) vibe mode + RRF, (c) the 4-mode multimodal search overview. Lead (a) was rejected because Poster Pilot's value prop is to *replace* the friction of contacting a human archivist — leading with "the app admits when it can't help" foregrounds the failure mode of the product, which makes for a strange marketing claim. Lead (c) was rejected as too descriptive, no narrative pull. Vibe + RRF won because it's a positive technical claim, it name-checks a real IR technique (Reciprocal Rank Fusion from TREC research) which separates the post from the LangChain-tutorial layer, and the architecture itself is the most novel piece in the codebase.

**Why "not a wrapper around cosine similarity"?**

This is the single most important sentence in the post. Most "AI search" demos in 2026 are exactly that — wrapper around cosine similarity. Calling that out by name signals the developer reads past the surface of how generic RAG demos work. Recruiters with shipped-product experience will recognize the distinction; recruiters without it will recognize the confident specificity.

**Why "WPA posters about hope" as the example query?**

Dual purpose. (1) It demonstrates what vibe mode is *for* — a vague, intent-heavy query that a single embedding would struggle with. (2) It quietly steers any recruiter who clicks the deploy link toward one of the dataset's strongest collections (WPA Federal Art Project), so they're more likely to see a great result on their first interaction. Avoids the "pig problem" by directing initial traffic toward the long tail's *strong* side.

**Why is the Red Button buried mid-list, not the hook?**

Discussed at length in the strategy chat that produced this draft. The Red Button is a real signal of engineering judgment — handling LLM failure modes is rare in portfolio projects — but as a hook it advertises the product's limit instead of its value. As a one-bullet mid-list detail, it reads as honest engineering ("the app says so") rather than as the marketing claim. Buried correctly. Recruiters who care about that detail will find it; recruiters who only read the hook get the positive-claim version of the post.

**Why the 5,000-poster honesty paragraph?**

§10 of `BLOG_SERIES_PLAN_MAY_2026.md` calls this out explicitly. The dataset has known semantic-search gaps (the "pig problem" — search for pigs and you get the handful of actual pigs, then it degrades). Hiding this would be a recruiter trap if they happened to try it. Acknowledging it openly converts the perceived weakness into "I know what production scale looks like." The line "the mechanism is the demo; production scale is a separate problem" is the precise framing — it elevates the architecture above the catalog size.

**Why the Anthropic SDK in the stack list but not "Claude" in the hook?**

User flagged on 2026-05-11 that ChronoQuizzr already led with "Claude" and a second post leading with Claude risks narrowing the user's brand to "Claude engineer" rather than "AI engineer." The fix: Claude (and Sonnet 4.6 specifically) still appears in the body where it carries concrete technical signal — vibe mode, The Archivist guardrails — and "Anthropic SDK" appears in the stack list as a recruiter-search anchor. The hook itself reads as architecture, not vendor. Saved to memory as `feedback_dont_lead_with_claude.md` so the pattern is applied to posts #3 and #4 too.

**Hashtag choices:**

5 specific tags. `#AIEngineering` is the broad anchor (consistent with ChronoQuizzr post). `#RAG` and `#VectorSearch` are the recruiter-search anchors for this post's architecture. `#MultimodalAI` is the differentiator from a generic RAG project — Poster Pilot is one of the few portfolio-level multimodal projects in the user's TAM. `#OpenToWork` is the universal job signal. Skipped: `#SemanticSearch` (overlaps with `#VectorSearch`, would be the 6th tag), `#GenerativeAI` (too broad), `#TypeScript` (positioned `#MultimodalAI` over it because multimodal is the rarer skill).

**AI-tells stripped:**

- No em dashes (used periods and semicolons in their place; one en dash for the range "3–5" which is correct punctuation)
- No emojis
- No "I'm thrilled to share / excited to announce" opening
- No "Selected Projects:" template header
- No "no LangChain" framing (per existing feedback memory)
- Hook is concrete and specific in the first sentence; doesn't lead with abstract claims
- Vendor name (Claude) does not appear in the hook; appears in the body where it carries technical signal

---

## Publish Log

- **Drafted:** 2026-05-11
- **Video produced:** 2026-05-11 (`Recording 2026-05-11 103347.mp4`)
- **Posted:** _TBD — user is sitting on it 24–48h after ChronoQuizzr's 2026-05-11 publish_
- **Target publish window:** Tuesday 2026-05-12 or Wednesday 2026-05-13, morning (8–10 AM local)
- **Inbound notes:** _TBD — fill in after posting if any recruiter inbound or notable engagement_
