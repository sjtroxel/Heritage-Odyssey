# Asteroid Bonanza — LinkedIn Blog Post #3

**Status:** Draft 2026-05-12. Not yet published.
**Series:** Post 3 of 4. See `BLOG_SERIES_PLAN_MAY_2026.md`.
**Live app:** https://asteroid-bonanza.vercel.app
**Repo:** [VERIFY: github.com URL — likely sjtroxel/AI-Masterclass-Week-3-AsteroidProject given naming pattern]

---

## The Post (paste into LinkedIn as-is)

> Asteroid Bonanza is a multi-agent analysis system that surfaces its own uncertainty. Four Claude Sonnet 4.6 agents analyze a near-Earth asteroid in parallel. If their aggregate confidence is too low, the system skips synthesis and emits a handoff packet: what's known, where confidence broke down, what expertise is needed.
>
> The four agents specialize: Navigator computes orbital accessibility from NHATS data, Geologist estimates composition from spectral class, Economist separately values terrestrial-export and in-space-utilization, Risk Assessor evaluates planetary-defense and mission-side risk. They run in parallel where the data flow allows, with synthesis last.
>
> Every numeric finding (orbital elements, close-approach dates, mineral percentages, delta-V values) comes from a tool call into NASA's actual datasets: SBDB, CAD, NeoWs, NHATS. Reasoning text is the model's; specific numbers are not.
>
> Each full analysis costs about $0.50 in Anthropic credits and runs for 60–90 seconds. To keep curious scrollers from exhausting the demo budget, the live site rate-limits to 2 swarm runs per IP per 24 hours. Cheap reads (dossier, cached analyses, planetary-defense dashboard) stay open.
>
> Built with Angular 21, TypeScript, Tailwind 4, Three.js for the orbital canvas, Express 5, Supabase + pgvector, and the Anthropic SDK. 220+ tests at 96% statement coverage on the API. Live at asteroid-bonanza.vercel.app.
>
> #AIEngineering #MultiAgent #RAG #LLMOps #OpenToWork

---

## Length Check

- **Word count:** ~213 words (target was ~200 for posts #1–2; on spec for series consistency)
- **Character count:** ~1,470 chars (well under LinkedIn's 3,000 cap)
- **Hook line cut-point:** The first sentence ("Asteroid Bonanza is a multi-agent analysis system that surfaces its own uncertainty.") is ~88 characters and visible above the cut on both desktop (~210-char cut) and mobile (~140-char cut). The full first paragraph is dense at ~330 chars, but the first sentence stands cleanly on its own as the visible hook before any expand-click. Reader sees a concrete principled claim ("surfaces its own uncertainty") before being asked to absorb the technical specifics.

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

**Why lead with the handoff/uncertainty angle vs. other candidate leads?**

Four candidate leads were considered:

- **(a) The cost / rate-limit honesty.** "Each analysis costs $0.50 — here's how I rate-limited it." Rejected because it foregrounds a *limitation* of the demo, not the architectural story. Same principle that buried Poster Pilot's "Red Button" handoff mid-list rather than leading with it: the post's job is to advertise the product's value, not its budget constraints. The rate-limit detail still appears in the body where it carries production-engineering signal.
- **(b) The orbital canvas / Three.js visualization.** "Watch four agents analyze an asteroid in real time over a 3D orbital map." Rejected because it's a UI element, not the architectural story. AI Engineer recruiters scanning #AIEngineering aren't searching for Three.js work.
- **(c) Pure architecture description.** "Four agents in parallel for orbital, compositional, economic, and defense analysis." Rejected because competent-but-not-novel — many multi-agent demos have parallel agents. The differentiator is what happens when those agents disagree or fail, not the fact that they exist.
- **(d) Confidence-aware handoff (CHOSEN).** Most multi-agent demos in 2026 always produce a confident synthesis, even when the underlying data doesn't support one. Asteroid Bonanza explicitly refuses to in low-confidence cases and emits a structured handoff packet instead. This is engineering judgment, not just feature surface — the kind of detail recruiters with shipped-product experience will recognize. The line "surfaces its own uncertainty" is the principled framing.

**Why "surfaces its own uncertainty" instead of "knows when to stop" or "knows its limits"?**

Earlier drafts used "knows when to stop" — too anthropomorphizing, edges toward cute when the audience values technical seriousness. "Surfaces its own uncertainty" is the same idea framed without metaphor: it's the actual technical behavior (computing per-agent confidence, aggregating, gating synthesis on threshold) described accurately.

**Why a contrast/refusal hook instead of Poster Pilot's "the interesting part" bridge?**

Poster Pilot's revision on 2026-05-12 landed on a "[Product] is [X]. The interesting part: [Y]" structure. Reusing that bridge phrase on post #3 would make the series look templated. This post uses a different rhetorical move: declarative principled claim in sentence 1 ("surfaces its own uncertainty"), specific mechanism in sentences 2–3, no bridge phrase. Structural distinctiveness across the four posts matters more than locking in one "best" hook pattern.

**Why no bullets at all?**

ChronoQuizzr had a 3-bullet Generate→Attack→Rewrite loop. Poster Pilot kept ONE 3-bullet section for the vibe-mode pipeline. Asteroid Bonanza has zero bullets. Progression goal: each post in the series deviates structurally from the prior, so the four together read as four different shapes rather than four iterations of one template. The four agents could have been bulleted, but the comma-separated specialization sentence preserves prose density and avoids the visual "this is a list" cue that triggers AI-content pattern recognition.

**Why "Most demos do X; this one doesn't" is NOT in the hook (even though I considered it)?**

Early drafts of the hook used a "Most multi-agent demos always produce a confident synthesis; this one doesn't" contrast device. Workshopped that and removed it because:

1. It edges toward contrarian-flex territory ("most others are wrong; I'm right"). Risks reading as overclaiming on a small portfolio piece.
2. The same content is communicated more cleanly via the declarative claim "surfaces its own uncertainty" without throwing shade at any other unnamed projects.

The principled-claim framing is stronger than the contrast framing. Saved this rationale here so a future post in the series doesn't accidentally re-land on the same contrast move.

**Why grounding paragraph is a separate paragraph (not embedded in architecture)?**

Hallucination in this domain has unique stakes: invented orbital elements could mislead a real mission planner, fabricated mineral content could mislead a real investor, fictional close-approach dates could mislead someone evaluating planetary defense. The grounding paragraph is short but earns its own paragraph because "reasoning is the model's; specific numbers are not" is the most defensible architectural claim in the entire post. It substantiates the rest. If a recruiter only reads three sentences, this is one of them.

**Why the 60–90 second / $0.50 cost paragraph is in the body?**

This is the honest "production demo budget" framing — same role that Poster Pilot's "5,000 posters is enough to demonstrate the architecture, not enough to cover every long-tail query" paragraph played. It signals to recruiters that the author understands what it costs to run production AI, has actually deployed something that costs real money, and has handled the cost properly. The specific rate-limit number (2 per IP per 24h) demonstrates a thought-through design decision, not just hand-waving.

**Why no framework name (LangGraph, etc.) in the post?**

Asteroid Bonanza's orchestrator is hand-rolled (no LangGraph, no AutoGen, no CrewAI). Per existing `feedback_no_langchain_phrasing.md` memory, "no LangChain"-style negative framing is rejected as recruiter-facing copy — could read as principled refusal when in fact the user would happily use LangGraph if it fit. Solution: don't mention frameworks at all. The post describes the actual behavior (four agents, parallel execution, confidence aggregation, handoff trigger) which is the substance recruiters care about. Whether it's framework-orchestrated or hand-rolled is secondary, and silence avoids the framing problem entirely.

**Why "Anthropic SDK" in the stack list but not "Claude" or "Sonnet" in the hook?**

Per `feedback_dont_lead_with_claude.md` memory. "Sonnet 4.6" appears in the body (paragraph 1, "Four Claude Sonnet 4.6 agents") where it carries technical specificity. Doesn't appear in the hook. "Anthropic SDK" appears in the stack list as a recruiter-search anchor. Whole post is consistent with the series-level guidance.

**Hashtag choices:**

5 specific tags, matching Poster Pilot's count. `#AIEngineering` is the broad anchor (consistent across all three posts so far). `#MultiAgent` is the series-differentiator for this post — none of the other posts cover this. `#RAG` is included because the project has a real RAG component (ragService.ts at 100% line coverage in the test suite, used in the analyst-chat follow-up feature) even though the core swarm uses tool calls rather than chunk retrieval; #RAG is a high-volume recruiter-search anchor and worth keeping. `#LLMOps` is the production-engineering signal (rate limiting, cost-aware design, structured failure handling) — rarer than #AIEngineering and rewards recruiters specifically looking for shipped-product experience. `#OpenToWork` is the universal job signal.

Skipped: `#LangGraph` (not used), `#VectorSearch` (used in Poster Pilot; would overlap), `#AnthropicAPI` (covered by #AIEngineering), `#GenerativeAI` (too broad), `#TypeScript` (already an anchor in the body), `#NASA` (interesting but recruiter-search relevance is low), `#PlanetaryDefense` (cool but niche).

**AI-tells stripped:**

- No em dashes (used periods, semicolons, colons in their place; en dash for the range "60–90" which is correct punctuation)
- No emojis
- No "I'm thrilled to share / excited to announce" opening
- No "Selected Projects:" template header
- No "no LangChain" framing
- No bullets at all (max structural deviation from prior posts in the series)
- Hook is concrete and specific in the first sentence; doesn't lead with abstract claims
- Vendor name (Claude) does not appear in the hook; "Sonnet 4.6" appears in the body where it carries technical signal
- Hook does NOT reuse the "the interesting part:" bridge phrase from Poster Pilot

**Authorship note (per `feedback_blog_post_authorship_progression.md`, recalibrated 2026-05-12):**

Claude drafted this post. Per the recalibrated authorship plan, the user is exercising critical-editor responsibility rather than drafting from scratch yet. Expected user-side edits before publish:

- Verify the Vercel URL and substitute for the [VERIFY] placeholder
- Verify the GitHub repo URL
- Verify the exact aggregate-confidence threshold for handoff (test fixture suggests 0.35 triggers handoff, 0.82 does not; actual threshold is somewhere between, probably 0.5 — confirm against orchestrator.ts before publishing if specificity matters)
- Verify the test count (current draft says "220+ tests at 96% statement coverage on the API" — actual is 222 server tests at 96.48% lines as of the rate-limit work earlier today; rounded for the post; reasonable as-is)
- Decide on visual (stills carousel vs single still vs short video) — TBD section above has the trade-offs
- Critically read the prose for any line that doesn't sound like the user's voice and flag for rewrite

---

## Publish Log

- **Drafted:** 2026-05-12 (immediately after the rate-limit work shipped to Railway, while Railway was deploying the production config)
- **Video / visuals produced:** _TBD — pending user decision per Visuals section above_
- **Posted:** _TBD — Thursday 2026-05-14 morning is the earliest target per user's 2026-05-12 statement_
- **Inbound notes:** _TBD — fill in after posting if any recruiter inbound or notable engagement_
