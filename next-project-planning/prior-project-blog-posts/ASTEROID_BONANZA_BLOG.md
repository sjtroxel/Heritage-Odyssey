# Asteroid Bonanza — LinkedIn Blog Post #3

**Status:** v2 draft 2026-05-13. Not yet published. (v1 drafted 2026-05-12 — superseded; see Draft Notes for what changed.)
**Series:** Post 3 of 4. See `BLOG_SERIES_PLAN_MAY_2026.md`.
**Live app:** https://asteroid-bonanza.vercel.app
**Repo:** [VERIFY: github.com URL — likely sjtroxel/AI-Masterclass-Week-3-AsteroidProject given naming pattern]

---

## The Post (paste into LinkedIn as-is)

> Asteroid Bonanza is a four-agent swarm. Pick any near-Earth asteroid; the agents analyze its orbit, composition, economic value, and planetary-defense risk in parallel, then synthesize.
>
> The four specialists: Navigator computes orbital accessibility from NHATS data, Geologist estimates composition from spectral class, Economist separately values terrestrial-export and in-space-utilization, Risk Assessor evaluates planetary-defense and mission-side risk. Each runs as a Claude Sonnet 4.6 agent calling NASA's catalogs through dedicated tools.
>
> Every numeric finding (orbital elements, close-approach dates, mineral percentages, delta-V values) comes from a tool call into NASA's actual datasets: SBDB, CAD, NeoWs, NHATS. Reasoning text is the model's; specific numbers are not.
>
> Each full analysis costs me about $0.50 in Anthropic credits and runs for 60–90 seconds. To keep curious scrollers from exhausting the demo budget, the live site rate-limits to 2 swarm runs per IP per 24 hours. Cheap reads (dossier, cached analyses, planetary-defense dashboard) stay open.
>
> Built with Angular 21, TypeScript, Tailwind 4, Three.js for the orbital canvas, Express 5, Supabase + pgvector, and the Anthropic SDK. 220+ tests at 96% statement coverage on the API. Live at asteroid-bonanza.vercel.app.
>
> #AIEngineering #MultiAgent #RAG #LLMOps #OpenToWork

---

## Length Check

- **Word count:** ~184 words (target was ~200 for posts #1–2; tight but on-spec for the series)
- **Character count:** ~1,310 chars (well under LinkedIn's 3,000 cap)
- **Hook line cut-point:** The first sentence ("Asteroid Bonanza is a four-agent swarm.") is ~40 characters and visible above the cut on both desktop (~210-char cut) and mobile (~140-char cut). The second sentence (~158 chars) completes the picture: what gets analyzed, across which four dimensions. Reader sees the product name, the swarm framing, and the four-domain breadth before any expand-click. The opener is a concrete architectural claim, not a vague tease.

---

## Visuals — TBD as of 2026-05-12

User signaled on 2026-05-12 that video probably won't work as well for Asteroid Bonanza as it did for ChronoQuizzr and Poster Pilot. Two reasons drive this:

1. **The 60–90 second analysis runtime is too long for LinkedIn's engagement sweet spot.** ChronoQuizzr's 42s and Poster Pilot's 1:48 were already at the edge of what works algorithmically. An honest Asteroid Bonanza video would either need to be cut/sped-up to 30–45s (loses authenticity) or run real-time at ~90s (loses retention).
2. **The most visually striking moments are static, not motion.** The completed agent-swarm dashboard with four agent cards, confidence-score bars, and the synthesis card is a strong single-frame composition. The orbital canvas (Three.js asteroid trajectories) is a strong single-frame composition. The handoff/red-button case is a strong single-frame composition. None of these benefit much from motion.

**Recommended approach: 2–3 stills, posted as a LinkedIn carousel or single image.**

Candidate stills (subject to user review):

- **Still A — The completed dashboard.** A successful analysis showing all four agent cards filled in, confidence-score bars at meaningful levels, synthesis card with rich text. This is the "money shot" — recruiter sees the full architectural depth at a glance.
- **Still B — The handoff case.** An asteroid where confidence dropped below threshold, showing the structured handoff packet. This is the "knows its limits" visual proof — directly substantiates the hook's claim about surfacing uncertainty.
- **Still C — The orbital canvas.** Three.js-rendered asteroid orbits with Earth and Sun for scale. Useful for series cohesion (the post needs an "above the fold" visual) but doesn't carry the technical story the way A and B do.

Open question: does the live deploy have a known-low-confidence asteroid that produces a clean handoff visual on demand? If not, this needs either (a) finding one in production data, or (b) generating one via a synthetic test asteroid. Worth checking before committing to Still B.

**Alternative path — short looped video (~15s).** If the user wants motion despite the constraints, the strongest 15-second cut would be: click Run → agent cards animate from idle to running to complete in sequence (sped up) → confidence-score bars fill in → synthesis card appears. Loses authenticity (real analysis is 90s) but compresses the architecture story into a feed-friendly duration. Not recommended over the carousel-of-stills approach, but flagging as an option.

**Decision deferred — user to choose between stills carousel, single still, or short video before Thursday publish.**

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

**Why the cost / rate-limit paragraph is preserved verbatim from v1:**

User explicitly confirmed this paragraph (cost, runtime, rate-limit policy) lands well and belongs roughly two-thirds of the way into the post. Same role that Poster Pilot's "5,000 posters is enough to demonstrate the architecture" paragraph played: signals to recruiters that the author understands production-AI costs and has handled them properly. The specific rate-limit number (2 per IP per 24h) demonstrates a thought-through design decision, not hand-waving.

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

**v2 user-side verifications still needed before publish:**

- Verify the Vercel URL
- Verify the GitHub repo URL (still has [VERIFY] placeholder at top of file)
- Verify the test count (current draft says "220+ tests at 96% statement coverage on the API" — actual is 222 server tests at 96.48% lines as of the rate-limit work; rounded for the post; reasonable as-is)
- Decide on visual (stills carousel vs single still vs short video) — TBD section above has the trade-offs
- Critically read v2 for any line that doesn't sound like the user's voice and flag for rewrite

---

## Publish Log

- **v1 drafted:** 2026-05-12 (immediately after the rate-limit work shipped to Railway, while Railway was deploying the production config). Led with the confidence-aware handoff angle. Superseded by v2.
- **v2 drafted:** 2026-05-13 morning, responding to user critique that v1's uncertainty-led opener struck the wrong tone for a 200-word recruiter-facing post. v2 cuts the handoff story and leads with the four-agent swarm + four-domain breadth instead. See Draft Notes above for the full diff.
- **Video / visuals produced:** _TBD — pending user decision per Visuals section above_
- **Posted:** _TBD — Thursday 2026-05-14 morning is the earliest target per user's 2026-05-12 statement_
- **Inbound notes:** _TBD — fill in after posting if any recruiter inbound or notable engagement_
