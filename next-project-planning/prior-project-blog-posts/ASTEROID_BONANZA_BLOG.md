# Asteroid Bonanza — LinkedIn Blog Post #3

**Status:** SHIPPED 2026-05-14 7:50am CT (8:50am ET) on LinkedIn. v3 prose + 5-slide carousel.
**Series:** Post 3 of 4. See `BLOG_SERIES_PLAN_MAY_2026.md`.
**Live app:** https://asteroid-bonanza.vercel.app
**Repo:** [VERIFY: github.com URL — likely sjtroxel/AI-Masterclass-Week-3-AsteroidProject given naming pattern]

---

## The Post (paste into LinkedIn as-is)

> Asteroid Bonanza is a four-agent swarm. Pick any near-Earth asteroid; the agents analyze its orbit, composition, economic value, and planetary-defense risk in parallel, then synthesize.
>
> The four specialists: Navigator computes orbital accessibility (delta-V, mission duration), Geologist estimates composition from spectral class, Economist separately values terrestrial-export and in-space-utilization, Risk Assessor evaluates planetary-defense and mission-side risk. Each runs as a Claude Sonnet 4.6 agent calling NASA's catalogs through dedicated tools.
>
> Every numeric finding (orbital elements, close-approach dates, mineral percentages, delta-V values) comes from a tool call into NASA's actual datasets: SBDB, CAD, NeoWs, NHATS. Reasoning text is the model's; specific numbers are not.
>
> Beyond the swarm, an analyst agent fields follow-ups on any completed analysis. It retrieves from a pgvector index of scientific papers and mission scenarios, renders citations inline with the answer, and exposes its own retrieval metrics (chunks fetched, latency, token cost) directly in the UI.
>
> Built with Angular 21, TypeScript, Tailwind 4, Three.js for the orbital canvas, Express 5, Supabase + pgvector, and the Anthropic SDK. 220+ tests at 96% statement coverage on the API. The deployed demo rate-limits to 2 swarm runs per IP per 24h; cached analyses and read-only views stay open. Live at asteroid-bonanza.vercel.app.
>
> #AIEngineering #MultiAgent #RAG #LLMOps #OpenToWork

---

## Length Check

- **Word count:** ~184 words (target was ~200 for posts #1–2; tight but on-spec for the series)
- **Character count:** ~1,310 chars (well under LinkedIn's 3,000 cap)
- **Hook line cut-point:** The first sentence ("Asteroid Bonanza is a four-agent swarm.") is ~40 characters and visible above the cut on both desktop (~210-char cut) and mobile (~140-char cut). The second sentence (~158 chars) completes the picture: what gets analyzed, across which four dimensions. Reader sees the product name, the swarm framing, and the four-domain breadth before any expand-click. The opener is a concrete architectural claim, not a vague tease.

---

## Visuals — DECIDED 2026-05-13: 5-slide LinkedIn image carousel

**Iteration arc 2026-05-13.** Started the morning intending to do another native-video post like the prior two. User recorded ~5 minutes of source material across three screencasts (Cardea full-swarm analysis, Apophis case study + completed analysis, Analyst chat + Orbital Map). Two Cardea recordings ended in confidence-handoff (no clean success), so we couldn't cut a single end-to-end success video. Built a 35-second frankenstein cut (`videos/Asteroid_Bonanza_v1.mp4`) that stitched the Cardea swarm-running middle into the Apophis success ending — watchable but jarring. User's read: "the viewer experience isn't great. It's jarring and anyone who does want to take their time and see it all feels rushed." Pivoted to **carousel of stills** — better fit because (a) most visually striking moments are static compositions, (b) viewer controls pacing, (c) the swarm tool-call text is finally readable when not flying past at 3x speed, (d) carousel swipes are a strong algorithmic engagement signal on LinkedIn.

**Final 5-slide deck (in `carousel/`):**

1. **`slide_1_orbital_hero_square.png`** — Orbital Canvas hero with 20 asteroids plotted, color legend, sidebar visible. **Square format, user-produced manually** (~540x540) after Claude's auto-generated versions kept hitting empty-space / aspect-mismatch issues. Source moment: `videos/Recording 2026-05-13 120224.mp4` ~44s.
2. **`slide_2_swarm.png`** — Four-agent swarm at peak with rich tool-call text visible (Geologist's "S-type / C-type chondrite composition" queries, Risk Assessor's "PHA classification criteria MOID 0.05 AU planetary defense", Economist's "ISRU water propellant 2050" / "asteroid mining mission cost delta-V"). **1280x800 rectangular.** The architectural money shot. Source: `videos/Recording 2026-05-13 095817.mp4` ~145s. Cardea designation "2164287" visible in page header — accepted as-is per user (the slide is about the architecture, not the specific asteroid).
3. **`slide_3_analyst_rag.png`** — Analyst chat with the RAG retrieval banner ("RAG retrieved 5 science + 5 scenario in 1048ms · ~4274 tokens") and full markdown answer with academic citations rendering below. **1280x800 rectangular.** Substantiates the `#RAG` hashtag with visible retrieval metrics. Source: `videos/Recording 2026-05-13 120224.mp4` ~23s.
4. **`slide_4_apophis_countdown_square.png`** — Apophis 2029 case study with "FEATURED CASE STUDY" tag, headline, dramatic "1,065 : 08 : 58 : 30" countdown timer, Raw Dossier / AI Analysis buttons, and full 6-column data table (MISS DISTANCE / DIAMETER / SPECTRAL CLASS / FLYBY DATE / NHATS Δv / MOID). **1080x1080 square.** Sidebar dropped to preserve all 6 table columns. Sets up slide 5 narratively (here's the asteroid → here's our analysis result). Source: `videos/Recording 2026-05-13 100225.mp4` ~11s.
5. **`slide_5_synthesis.png`** — Apophis completed Agent Swarm Analysis with confidence bars and "Apophis: Synthesis Assessment" rendered text. **1280x800 rectangular.** The success payoff. Source: `videos/Recording 2026-05-13 100225.mp4` ~37s.

**Mixed aspect ratios — known caveat for tomorrow's upload.** Slides 1 and 4 are square (1:1), slides 2/3/5 are rectangular (~1.6:1). Authoritative behavior of LinkedIn carousel display with mixed aspects is not known to me. **Action for upload:** verify in LinkedIn's pre-publish preview; if rectangular slides letterbox awkwardly inside a square container imposed by the hero, fall back to dropping the square hero (slide 1) and going all-rectangular (loses the strongest visual hook but eliminates inconsistency).

**Source material — all in `videos/` subfolder** (created 2026-05-13 to clean up the blog folder root):
- `Recording 2026-05-13 095817.mp4` — 126MB, **gitignored** (exceeds GitHub's 100MB limit). Failed Cardea full-swarm analysis. Source for slide 2.
- `Recording 2026-05-13 100225.mp4` — Apophis case study tour + completed analysis review. Source for slides 4, 5.
- `Recording 2026-05-13 120224.mp4` — Analyst chat with RAG + Orbital Map exploration. Source for slides 1, 3.
- `Asteroid_Bonanza_v1.mp4` — abandoned 35s frankenstein video. Kept as historical artifact, not used.
- `Recording 2026-05-09 094327.mp4`, `Recording 2026-05-11 103347.mp4` — older ChronoQuizzr and Poster Pilot videos, moved here as part of the cleanup.

**Tooling:** ffmpeg-only. ImageMagick is NOT installed on this system; ffmpeg's `crop` and `scale` filters handled all composition. Slide 1 ended up user-produced manually after multiple iteration rounds with Claude on auto-generated versions — coordinate-precision work from rendered image previews proved unreliable.

---

## Draft Notes (why these choices)

**v2 — what changed from v1 and why.**

v1 led with "Asteroid Bonanza is a multi-agent analysis system that surfaces its own uncertainty" and developed the confidence-aware handoff story across the entire first paragraph. User pushed back 2026-05-13: leading with "uncertainty" / "confidence broke down" framing reads negatively to the 97% of readers who aren't deep AI-engineering specialists, and at 200 words the post can't do justice to the handoff packet story anyway. Same mistake as the Poster Pilot v1 "Red Button" hook that got cut: leading with a graceful-failure story instead of with what the product does well. v2 cuts the uncertainty thread entirely from the post — not just demotes it. The grounding paragraph ("numbers from NASA tool calls, reasoning from the model") does most of the "this thing won't lie to you" work that v1's uncertainty paragraph was reaching for, and does it more positively. The confidence-aware handoff remains excellent interview material; it's just not load-bearing for a 200-word LinkedIn post.

**v2 lead angle: the swarm itself + the four-domain breadth.**

The genuinely impressive thing about Asteroid Bonanza is that four specialists collaborate across four distinct expertise domains (orbital mechanics, geology, economics, planetary defense) on real NASA data. v2 makes that the headline. Paragraph 1 establishes the swarm and names the four dimensions. Paragraph 2 names the four specialists and what each one does, and slots in the Sonnet 4.6 attribution. The reader meets the architectural ambition before anything else.

**Why "four-agent swarm" instead of "multi-agent analysis system":**

v1's phrasing was accurate but generic. "Four-agent swarm" is more specific, more visual, and stakes a more confident claim about what the system is. The post's job is to advertise the architectural ambition, not to underspecify it.

**Why "Claude" appears in paragraph 2 but not the hook:**

Per `feedback_dont_lead_with_claude.md`. "Claude Sonnet 4.6" carries technical signal where it appears (specifying the model class on which all four specialists run), but the hook leads with the architecture, not the vendor. "Anthropic SDK" appears in the stack list as a recruiter-search anchor. v1 violated this by mentioning "Four Claude Sonnet 4.6 agents" in sentence 2 of the hook paragraph; v2 moves the model attribution to paragraph 2 where it belongs.

**Why no framework name (LangGraph, etc.):**

Asteroid Bonanza's orchestrator is hand-rolled. Per `feedback_no_langchain_phrasing.md`, "no LangChain"-style negative framing is rejected as recruiter-facing copy — could read as principled refusal when in fact the user would happily use LangGraph if it fit. Solution: don't mention frameworks at all. The post describes the actual behavior, which is the substance recruiters care about.

**Why v3 swaps the cost paragraph for an analyst/RAG paragraph:**

v2's paragraph 4 was the cost+rate-limit graf preserved from v1. User flagged 2026-05-14 morning that "$0.50 in Anthropic credits" reads as "this will cost YOU" to fast readers regardless of the "me" insertion, and that the whole paragraph functioned as defensive copy ("look how responsibly I built this") rather than offensive copy (architectural depth recruiters scan for). Same diagnostic that retired Poster Pilot v1's Red Button hook and Asteroid Bonanza v1's confidence-led opener: defensive framing loses to depth in 200-word recruiter-facing copy.

v3 replaces the paragraph with a description of the analyst/RAG follow-up layer: pgvector-backed retrieval from scientific papers + mission scenarios, citations rendered inline, retrieval metrics (chunks/latency/tokens) surfaced in the UI. This earns the `#RAG` hashtag substantively (v2 only gestured at it), pairs with carousel slide 3 (the RAG retrieval banner), and shows a second distinct AI architectural layer beyond the swarm — strengthening the architecture story instead of pivoting away from it.

The rate-limit fact (2 per IP per 24h, cached analyses unmetered) is preserved as a single sentence buried in the stack paragraph: retains the `#LLMOps` anchor without giving defensive copy its own paragraph. The cost figure ($0.50) is dropped entirely. An alternative replacement angle — featuring the Apophis 2029 case study in prose — was considered and rejected: Apophis already gets two of five carousel slides, and a prose paragraph about a single asteroid would tilt the post from "AI engineer pitch" toward "space enthusiast post." The blog real estate should carry weight the slides can't: architectural substance, not topical color.

**Why the grounding paragraph is its own paragraph:**

Hallucination in this domain has unique stakes: invented orbital elements could mislead a real mission planner, fabricated mineral content could mislead a real investor, fictional close-approach dates could mislead someone evaluating planetary defense. "Reasoning is the model's; specific numbers are not" is the most defensible architectural claim in the post. It earns its own paragraph. If a recruiter only reads three sentences, this is one of them.

**Why zero bullets:**

ChronoQuizzr had a 3-bullet Generate → Attack → Rewrite loop. Poster Pilot kept ONE 3-bullet section. Asteroid Bonanza has zero bullets — max structural deviation from prior posts in the series. The four specialists could have been bulleted, but the comma-separated specialization sentence preserves prose density and avoids the visual "this is a list" cue that triggers AI-content pattern recognition.

**Hashtag choices (unchanged from v1):**

5 specific tags. `#AIEngineering` is the broad anchor (consistent across all three posts). `#MultiAgent` is the series-differentiator for this post — none of the other posts cover this. `#RAG` is included because the project has a real RAG component (ragService.ts at 100% line coverage, used in the analyst-chat follow-up feature) even though the core swarm uses tool calls rather than chunk retrieval; #RAG is a high-volume recruiter-search anchor. `#LLMOps` is the production-engineering signal (rate limiting, cost-aware design). `#OpenToWork` is the universal job signal.

Skipped: `#LangGraph` (not used), `#VectorSearch` (used in Poster Pilot; would overlap), `#AnthropicAPI` (covered by #AIEngineering), `#GenerativeAI` (too broad), `#TypeScript` (already an anchor in the body), `#NASA` (interesting but recruiter-search relevance is low), `#PlanetaryDefense` (cool but niche).

**AI-tells stripped:**

- No em dashes (used periods, semicolons, colons; en dash for the range "60–90" which is correct punctuation)
- No emojis
- No "I'm thrilled to share / excited to announce" opening
- No "Selected Projects:" template header
- No "no LangChain" framing
- Zero bullets (max structural deviation from prior posts in the series)
- Hook is concrete and specific in the first sentence; doesn't lead with abstract claims
- Vendor name (Claude) does not appear in the hook
- Hook does NOT reuse the "the interesting part:" bridge phrase from Poster Pilot
- Hook does NOT lead with uncertainty / failure-mode framing (v1's miss, corrected in v2)

**Authorship note (per `feedback_blog_post_authorship_progression.md`, recalibrated 2026-05-12):**

Claude drafted v1 and v2. Per the recalibrated authorship plan, the user is exercising critical-editor responsibility rather than drafting from scratch yet. The v2 revision is itself an example of that responsibility working: user critically read v1, named the specific tonal problem (negative-led opener), and Claude responded with a structural rewrite, not a surface edit.

**Pre-publish verifications still needed Thursday morning 2026-05-14:**

- Verify the Vercel URL is current (`asteroid-bonanza.vercel.app`)
- Verify and substitute the GitHub repo URL (still has [VERIFY] placeholder at top of file)
- Verify the test count (current draft says "220+ tests at 96% statement coverage on the API" — actual is 222 server tests at 96.48% lines as of the rate-limit work; rounded for the post; reasonable as-is)
- ✅ ~~Decide on visual~~ — RESOLVED 2026-05-13: 5-slide carousel, files in `carousel/` subfolder
- **Upload carousel to LinkedIn and verify mixed-aspect rendering in the pre-publish preview** before clicking Post. If slides 2/3/5 letterbox awkwardly inside the square container set by hero slide 1, fall back to dropping the square hero (use rectangular `slide_1_orbital_hero.png` if you produce one, or just go 4-slide all-rectangular).
- Critically read v2 prose one more time for any line that doesn't sound like the user's voice and flag for rewrite

---

## Publish Log

- **v1 prose drafted:** 2026-05-12 (immediately after rate-limit work shipped to Railway). Led with confidence-aware handoff angle. Superseded by v2.
- **v2 prose drafted:** 2026-05-13 morning, responding to user critique that v1's uncertainty-led opener struck the wrong tone for a 200-word recruiter-facing post. v2 cuts the handoff story and leads with the four-agent swarm + four-domain breadth instead. Plus minor "$0.50 in **me** Anthropic credits" tweak to neutralize fear-of-billing concern for casual readers.
- **v3 prose drafted:** 2026-05-14 morning, just before publish. Three edits on user critique: (1) "NHATS" replaced with concrete physics terms ("delta-V, mission duration") in paragraph 2 — the acronym means nothing to readers, and Googling it returns "National Health and Aging Trends Study" before any NASA result; (2) the cost+rate-limit paragraph swapped out for a paragraph on the analyst/RAG follow-up layer — earns `#RAG` substantively and pairs with carousel slide 3; (3) one-sentence rate-limit clause moved into the stack paragraph to preserve the `#LLMOps` anchor without giving defensive copy its own moment. Cost figure ($0.50) dropped entirely. Apophis-case-study replacement angle considered and rejected (Apophis already covered by slides 4 and 5; prose Apophis would tilt the post toward space content instead of AI-engineer content).
- **Visuals produced 2026-05-13 afternoon:**
  - Recorded 3 screencasts as raw source (two failed Cardea analyses, one Apophis case study tour). User burned daily quota twice on Cardea analyses that ended in handoff (no clean end-to-end success captured live).
  - Built and rejected a 35s frankenstein video (`videos/Asteroid_Bonanza_v1.mp4`) — content stitched from multiple sources to land on success; technically workable but viewer experience too rushed.
  - Pivoted to 5-slide carousel approach. Produced all 5 slides as PNGs in `carousel/`. See Visuals section above for slide-by-slide breakdown, source material map, and the mixed-aspect-ratio caveat.
  - Cleanup: created `videos/` and `carousel/` subfolders to organize the blog folder. Moved all 6 .mp4 source files into `videos/`. .gitignore updated for the 126MB Cardea recording.
- **Posted:** 2026-05-14 7:50am CT (8:50am ET) on LinkedIn. v3 prose + 5-slide carousel.
- **Post-publish notes (2026-05-14):**
  - User reflected post-publish that the carousel reads less engaging than the native-video format used for posts #1 and #2. Confirms the visual-format tradeoff: carousel was the right call given the two failed Cardea recordings (no clean end-to-end success captured live), but native video remains the stronger engagement format for this series when the source material allows. Lesson for Post #4 (Wildlife Sentinel): plan recording sessions to capture at least one clean end-to-end success before committing to a video format.
  - Slide 3 shipped with a known visual defect: the analyst response renders as unparsed markdown in the screenshot. The defect is in the live app (analyst chat component not running its response through a markdown processor), not in slide composition. Fix deferred — would have required a codebase change + re-screencap + re-export, which exceeded the publish-day budget. If a recruiter clicks through and asks about the chat rendering, the fix is straightforward (run the markdown through a parser before render). Worth fixing if Asteroid Bonanza is revisited or if this surfaces in any recruiter conversation.
  - Mixed-aspect-ratio caveat (slides 1, 4 square; slides 2, 3, 5 rectangular) appears to have rendered acceptably in LinkedIn's preview at upload time. Monitor for awkward letterboxing in the live feed; if it impacts engagement noticeably, future posts should standardize aspect ratios across all slides.
- **Inbound notes:** _TBD — fill in if any recruiter inbound or notable engagement_
