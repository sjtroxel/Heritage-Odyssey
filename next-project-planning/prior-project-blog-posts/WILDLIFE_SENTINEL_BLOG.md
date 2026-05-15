# Wildlife Sentinel — LinkedIn Blog Post #4 (Series Finale)

**Status:** Planning + decisions locked 2026-05-14. Drafting begins Friday 2026-05-15. Target publish Monday 2026-05-18 morning.
**Series:** Post 4 of 4. See `BLOG_SERIES_PLAN_MAY_2026.md`.
**Live app:** https://wildlife-sentinel.vercel.app/
**Repo:** https://github.com/sjtroxel/Wildlife-Sentinel

---

## Locked Decisions (2026-05-14 Thursday morning)

These are the decisions that gate drafting. Made during the planning session the morning Asteroid Bonanza shipped. Each one reflects an explicit user input — not Claude's solo call.

### Lead angle: message-bus / Redis Streams (locked)

User picked this from a 4-option ballot (Refiner, message-bus, PostGIS pre-filter, cost-router). Reasoning: production-systems framing has the broadest recruiter-search reach and best sets up Wildlife Sentinel's overall scale. All four architectural threads still appear in the post; message-bus is just the headline.

The Refiner remains a feature but is **demoted to a single-sentence callout** rather than its own paragraph. User's framing: "the Refiner is interesting but not the flashiest part of the app that will make people's jaws drop." Correct read — Refiner is "oh that's clever" engineering, not "stop scrolling" engineering. The jaw-droppers in Wildlife Sentinel are higher-scale: 12 globally-distributed disaster streams, 24/7 autonomy, 1,372 species polygons, 70–80% pre-LLM event filter.

### Length: ~315 words (300+ ceiling 400)

Series §4 explicitly allows posts #3–4 to scale to 350–400 words. Wildlife Sentinel has four architectural stories competing for attention; 200 words can't carry them. User confirmed pushing to "250–300+" — landing at ~315 leaves room for the Discord/dashboard prose without sacrificing density.

### Structural deviation from posts #1–3

ChronoQuizzr: 3-bullet pipeline. Poster Pilot: 1 three-bullet section + prose. Asteroid Bonanza: zero bullets. **Wildlife Sentinel:** distinct shape TBD during drafting — probably zero bullets but with explicit paragraph-as-section structure (one paragraph per architectural layer) so a scanner can pick out each story without bullets. Per `feedback_blog_post_authorship_progression.md` and the series's structural-deviation principle.

### Hook approach: stakes-vignette, not mission-language

User initially proposed an emotional hook ("system that tells what endangered species are SUPER in danger RIGHT NOW because of disasters and you can help them by donating to charities"). After discussion: the canonical "save the animals" opener risks reading as the NGO-template version of "I'm excited to share..." — same AI-tell, different vibe. Series §1 explicitly rejects marketing copy in favor of technical writing.

Resolution: lead with a **concrete stakes-setting vignette** (named species + named disaster type + 10-min response window). Stakes without sentimentality. The conservation purpose then lives in the **closing**, including a charity/donate CTA. This is the same move Asteroid Bonanza used for Apophis (concrete real-world stakes earning the architectural payoff) — except in Wildlife Sentinel's case the stakes are about active endangered species rather than a future asteroid encounter.

### RAG: present but demoted

Wildlife Sentinel HAS RAG — two pgvector indices (`species_facts` for 750 species across multiple topic types, `conservation_context` for 38 WWF/IPBES chunks). The Species Context Agent uses RAG; the Synthesis Agent uses RAG. The interesting design choice is the **"insufficient context" hallucination guard**: agents may only cite facts from retrieved chunks; if retrieval score falls below 0.40 cosine threshold, they must state "insufficient context" rather than fabricate biology.

But RAG is a supporting feature here, not a headline. **`#RAG` dropped from the hashtag set** (it carried Asteroid Bonanza where RAG was load-bearing; reusing it here would dilute the message-bus story). The hallucination-grounding choice can be mentioned in passing inside the cost-routing paragraph if there's room.

### Hashtag set (locked)

`#AIEngineering #MultiAgentSystems #DistributedSystems #DiscordBot #OpenToWork`

- `#AIEngineering` — universal anchor across all 4 posts in the series
- `#MultiAgentSystems` — covers the 5 intelligence agents + ThreatAssembler fan-in pattern
- `#DistributedSystems` — covers the Redis Streams message bus, consumer groups, circuit breakers, ThreatAssembler fan-in. Recruiter-search filter for senior backend / platform / infrastructure roles. Substantively earned, not vanity.
- `#DiscordBot` — niche, but Wildlife Sentinel is the only project in the series that justifies it. Unique signal that pulls bot-platform roles. User accepted the niche tradeoff: "we probably won't ever use it again but this one time so yeah why not do something unique that other applicants don't have."
- `#OpenToWork` — universal job signal across all 4 posts

Dropped: `#RAG` (supporting feature here, not load-bearing). Considered but rejected: `#LLMOps` (Asteroid Bonanza already used it; doesn't differentiate the finale), `#PostgreSQL`/`#PostGIS` (substantively earned by the spatial filter, but would dilute set coherence at 6 tags).

---

## Proposed Paragraph Structure (~315 words)

Working sketch. Word counts approximate. Actual prose drafted Friday.

```
[Hook] ~30 words.
  Concrete vignette: named species + named disaster scenario + 10-min response window.
  "When a wildfire crosses within 75km of [endangered species] habitat in [region], 
  Wildlife Sentinel fires within 10 minutes. The system runs 24/7. The world triggers it."

[Architecture — message bus] ~70 words.
  12 scouts → 4 Redis Streams → 5 intelligence agents.
  Agents communicate only through the bus; if one crashes, messages queue and wait.
  Frame as message-bus, not "agents calling each other." Redis Streams as persistent log.
  XADD/XREADGROUP/XACK pattern. This is the locked lead angle.

[Judgment call — PostGIS pre-filter] ~45 words.
  ST_DWithin against 1,372 species polygons drops 70-80% of incoming events 
  before any LLM call. "The cheapest model is no model."
  GIST spatial index. Signals engineering judgment, not just feature-listing.

[Discord bot — primary UX] ~50 words (EXPANDED per user).
  Primary interface is a Discord bot. Rich alert embeds: species + threat level + 
  distance from habitat + wind data + IUCN status + matched conservation charities.
  Critical alerts gate on human ✅ approval before going public.
  9 slash commands for pipeline ops (/status /pause /trends /refiner /donate etc.).

[Web dashboard — secondary surface] ~30 words.
  Next.js + Leaflet at wildlife-sentinel.vercel.app.
  Live map color-coded by 9 event types. Real-time agent activity stream.
  Refiner accuracy trend chart.

[Self-correction — one sentence] ~30 words.
  Refiner demoted to passing mention, NOT its own paragraph (per user 2026-05-14):
  "24h post-alert, the Refiner scores predictions against actual NASA/NOAA data 
   deterministically and rewrites the Threat Agent's system prompt when accuracy 
   drops below threshold."

[Cost-aware routing + grounding] ~35 words.
  Three models, three roles: Gemini Flash-Lite for volume, Gemini Flash for RAG 
  synthesis, Claude Haiku for reasoning. Per-call cost tracked in DB.
  Maybe one clause on the RAG "insufficient context" hallucination guard if budget allows.

[Stack + close — conservation purpose lands here] ~40 words.
  Stack list (TypeScript, Express, Next.js, Redis, Neon+PostGIS+pgvector, 
  Discord.js, Gemini SDK, Anthropic SDK).
  Test count: 470 + 43 Playwright E2E at 91.4% coverage.
  Live at wildlife-sentinel.vercel.app.
  Closes with charity CTA — the conservation purpose lands at end-of-scroll.

[Hashtags] ~5 tags
  #AIEngineering #MultiAgentSystems #DistributedSystems #DiscordBot #OpenToWork
```

Total: ~315 words.

---

## Open Decisions (for Friday + the weekend)

### Visuals approach — RESOLVED 2026-05-14

**Locked approach:** Multi-image LinkedIn carousel with a long animated GIF slide carrying the Discord motion, plus still images for the Next.js dashboard. User's framing: "I think we need a screencast/video for the discord parts at least. Still images can do what we need them to for the next.js part. Maybe a long .gif can be a way to sneak the 'video' in there."

**Why this format:**

- LinkedIn's multi-image carousel doesn't allow video slides, but it does allow animated GIFs (LinkedIn treats GIFs as images). GIFs autoplay silently in feed — exactly the right behavior since LinkedIn viewers are usually scrolling with audio off anyway.
- The Discord bot is the most motion-dependent part of Wildlife Sentinel: an alert posting in real time, a slash command response rendering, the HITL ✅ reaction approval flow. Still images can't carry this — viewers won't see what makes it interesting.
- The Next.js dashboard is more static-feeling. The Leaflet map with 9 color-coded event types, the alerts feed, the Refiner accuracy chart — all read well as held stills where the viewer can study the detail without it scrolling past.
- Hybrid GIF+stills inside the carousel format also addresses the Post #3 reflection (carousel reads less engaging than native video) by injecting motion where it matters, while preserving viewer-controlled pacing for the parts that benefit from it.

**Lesson from Post #3 preserved:** plan recording sessions to capture at least one clean end-to-end success before committing to a format. If the Discord recording session fails to produce usable footage (e.g., no live alert triggers during the recording window, or the staged alert looks artificial), fallback is an all-stills carousel with one slide being a held screenshot of the alert embed instead of the GIF.

**Slide candidates (to refine during the weekend):**

1. **Hero still — architecture overview or live dashboard map.** The strongest single-frame visual hook. Possibly a custom architecture diagram (12 scouts → 4 streams → 5 agents → Discord), possibly a screenshot of the dashboard with several events plotted on the Leaflet map. Decide based on which one wins the "stop scrolling" test in feed preview.
2. **GIF — Discord alert posting in real time.** ~5–15 second loop showing an alert embed appearing in `#wildlife-alerts` with species name, threat level, distance, charity matches. The flagship visual.
3. **GIF or still — Discord slash command demo.** `/refiner` or `/species [orangutan]` running and responding. Could be a GIF if the response is visually interesting, or a still capture of the response embed.
4. **Still — Next.js dashboard front page.** Full Leaflet map view + alerts feed + agent activity stream + Refiner accuracy chart, all on one composed screenshot.
5. **Still — single alert detail page or species profile page** from the Next.js app. Shows the depth available beyond the front page.

**Execution notes / known constraints:**

- **GIF size budget (confirmed 2026-05-14 via LinkedIn AI Overview).** LinkedIn actually allows GIFs up to **100 MB and 500 frames** — much more generous than initially assumed. For screen-recorded Discord content at 720p, 30 seconds @ 10–12 fps lands at 6–15 MB, well under both caps. Two-stage ffmpeg conversion (palettegen + paletteuse with bayer dithering) produces dramatically smaller files than direct conversion with no visible quality loss for UI content. See `linkedin-gif-conversion-reference` memory for the canonical command pattern.
- **Live-alert capture plan.** User will capture screenshots and short screencasts whenever a real alert posts to Discord during normal pipeline operation — no staged test, no codebase changes. The system runs 24/7 against 12 disaster streams, so naturally-occurring captures over the next few days should produce enough source material. User will share preliminary captures with Claude mid-weekend; final image/GIF/video selections targeted Sunday during the production pass.
- **HITL approval visual.** The ✅ reaction approval gate on critical alerts is a unique-to-this-app interaction worth capturing if possible — even just a single still showing both the `#sentinel-ops` review post and the `#wildlife-alerts` public post would tell the HITL story without prose having to spell it out.
- **Aspect ratio discipline.** Post #3 mixed square and rectangular slides and the carousel rendering was acceptable but inconsistent. For Post #4, standardize on one aspect ratio across all 5 slides — probably 1280×720 rectangular for video-style content, but verify what LinkedIn currently displays cleanest.

**Recording plan + GIF conversion workflow (locked 2026-05-14 PM):**

User's plan for the Discord motion slide:

- **Target duration:** ≤30 seconds total
- **First 10–15 sec:** scroll through `#sentinel-ops` channel showing bot alerts and logs, pausing strategically at key moments to let the viewer read embed details
- **Final 5–10 sec:** open various slash commands and hold each response visible long enough to read

Frame count math at 30 seconds (all fit LinkedIn's 500-frame cap):

| FPS | Frames | Typical file size for screen-recorded content |
|---|---|---|
| 10 fps | 300 ✅ | 6–12 MB |
| 12 fps | 360 ✅ | 8–15 MB |
| 15 fps | 450 ✅ | 10–18 MB |
| 24 fps | 720 ❌ | over frame cap |

Discord UI has no fast motion, so 10–12 fps is plenty smooth. Higher fps would push past 500 frames at 30s without visual benefit.

**MP4 → GIF conversion workflow:**

1. User records at any resolution/fps via screen recorder of choice, saves as `.mp4`
2. User shares the `.mp4` path with Claude in chat
3. Claude runs two-stage ffmpeg conversion targeting 720p, 10–12 fps, optimized palette (see `linkedin-gif-conversion-reference` memory for canonical command)
4. Verify output: size ≤15 MB, frames ≤450, visual quality intact
5. User uploads GIF as one slide in the LinkedIn multi-image carousel

**Composition decision (Claude's recommendation, awaiting user lock):**

Leaning toward **1 GIF (Discord) + 4 stills (Next.js)** rather than 2 GIFs + 3 stills:

- Honors user's original architectural framing — Discord motion, Next.js static. Matches the project's actual UX hierarchy (Discord is primary, dashboard is secondary).
- One strong motion anchor (the 30-second purposeful Discord scroll) outperforms two weaker ones.
- Production simplicity: one screen recording session, one conversion pass.
- Open to 2 GIFs + 3 stills if weekend captures reveal a Next.js moment that *really* benefits from motion (live agent activity SSE panel firing, Leaflet map populating as events arrive). At ~25 MB total carousel that's still well within budget.

**Reminder of the AI-Overview "convert to MP4" caveat:** that tip from LinkedIn help docs applies to single-video posts, NOT carousel slides. LinkedIn multi-image carousels do not accept MP4 slides. So if a GIF doesn't animate cleanly in feed preview, the fix is to re-encode the GIF (lower fps, smaller resolution, optimize palette), not swap to MP4.

**OPEN QUESTION — RESOLVED 2026-05-14 PM via dedicated research agent:** GIFs DO animate in LinkedIn multi-image feed posts. Confirmed via LinkedIn's official help docs (https://www.linkedin.com/help/linkedin/answer/a564109) and operational guidance from B2H Agency / Designlogic, who run animated multi-image post production for clients. The earlier AI Overview that triggered the panic was conflating LinkedIn's PDF document carousel format (where GIFs freeze) with the multi-image-attachment feed post format (where they animate). Different upload paths, different behavior. No test required.

**Critical new constraint surfaced by the research — must shape production:** LinkedIn's in-post upload tool enforces a **~6 MB practical ceiling per tile**, much tighter than the 100 MB official format-spec ceiling. Animation duration operational recommendation: under ~5 seconds per tile.

**What this means for the Discord screencast plan:**

A 30-second 720p / 12 fps GIF would land at 8–15 MB and be rejected by LinkedIn's upload tool. Three workable strategies to fit under 6 MB:

1. **Shorter duration** — trim Discord screencast to ~15–20 seconds total instead of 30. Keeps 720p quality.
2. **Lower resolution** — 540p or 480p instead of 720p (likely 3–6 MB at 30s / 10 fps). Loses some sharpness but keeps full 30-second narrative.
3. **Split into 2–3 shorter GIFs** of 3–5 seconds each, one per Discord moment (alert appearing, slash command response, HITL approval flow). This also aligns with the "under ~5 sec per tile" operational guidance AND changes the composition to 2–3 short GIFs + 2–3 stills, which may actually be stronger than 1 long GIF + 4 stills.

**Action item for user when resuming work:** decide which compression/duration/composition strategy fits the desired narrative. The strongest play is probably Strategy 3 (multiple short focused GIFs) — but defer the final composition call to recording day when you can see which Discord moments actually got captured cleanly.

### Hook vignette — which species + which disaster?

The hook needs a specific named species + specific named disaster type to feel concrete. Candidates from the project's natural strengths:

- **Sumatran orangutan + wildfire** (the README's own example) — well-known endangered species, NASA FIRMS is the most-developed scout, fire is the most visually striking event type
- **Coral bleaching + Great Barrier Reef species** — niche but has a strong "active right now" feel given climate state
- **Earthquake + Andean species** — broad species coverage but seismic isn't the strongest scout

Default to Sumatran orangutan + wildfire unless user wants to vary it.

### Charities CTA in close — phrasing TBD

The conservation purpose lands at the end of the post via the charity/donate angle. Phrasing should be concrete (named charities or the `/donate` slash command) rather than abstract ("support conservation organizations"). Resolves Friday during drafting.

### Refiner sentence — final phrasing

Demoted to one sentence. Worth at most one clause about the deterministic accuracy scoring (composite score = 0.6 × direction accuracy + 0.4 × magnitude accuracy) — most readers won't parse the math but the "deterministic, not LLM-judged" claim is the substantive bit.

---

## Cadence

| Day | Plan |
|---|---|
| **Thu 2026-05-14** | Decisions locked (this document). Posted Asteroid Bonanza in the morning. |
| **Fri 2026-05-15** | Claude drafts v1 prose. User reviews, names tonal/structural concerns. |
| **Sat 2026-05-16** | v2 revision incorporating Friday's feedback. Begin thinking about visuals. |
| **Sun 2026-05-17** | Visuals captured (recording session for video, or carousel production). v3 prose if any final pre-publish edits. |
| **Mon 2026-05-18 AM** | Publish 7–9 AM CT. Update memory + publish log. |

Sleep cycles between days are deliberate per user's working pattern — same approach that produced v2 and v3 of Asteroid Bonanza by letting the user return with overnight thinking each morning.

---

## Draft Notes

### v1 Draft (2026-05-15 Friday morning)

**Resolution of open prose decisions (user input 2026-05-15):**

- **Hook species:** Sumatran orangutan + wildfire. User asked for a sympathy-triggering species; orangutan sits in the charismatic-primate tier (big eyes, "old man of the forest"). Also the README's canonical case, so the technical claims earn authenticity. Koala+wildfire is the maximum-sympathy alternative thanks to 2019–20 Australian bushfire memory — swap candidate for v2 if user wants to dial up emotional pull at the cost of "designed-around-this-case" authenticity.
- **Refiner sentence:** one sentence with the deterministic 0.6/0.4 composite-score detail, per user request for "sufficient sophistication and detail."
- **Charity CTA:** tried `"Every public alert ends with /donate links to vetted charities for the species at risk."` — concrete (names the slash command), ties back to the hook species, lands at end-of-scroll. User undecided; will see if it sticks in review.

**Structural choices:**

- 8 paragraphs of pure prose, no bullets, no section headers. One paragraph per architectural story (message bus, pre-filter, Discord, dashboard, refiner, routing+grounding, stack+close), plus the hook. Follows the planning-doc "paragraph-as-section" structural deviation principle.
- Agent names not enumerated in the message-bus paragraph. The planning doc confirms 5 intelligence agents and explicitly names Species Context, Threat, and Synthesis; the other two are inferable but not verified. Defer naming to v2 if user wants — current prose says "Five intelligence agents read those streams as consumer groups" and moves on.
- `ThreatAssembler` fan-in pattern omitted from v1 to stay under the word budget. Candidate addition for v2 if there's room — would slot into the message-bus paragraph as a one-clause aside.

**Word count:** ~339 (planning doc allows 350–400 for posts #3–4; finalist after edits).

**AI-tells audit:** zero em dashes. No "Selected Projects:" or "Under the hood" type tells. "Human checkmark reaction" instead of literal ✅ emoji in body (per `feedback_no_ai_writing_tells.md`). Did not lead with "Claude" (per `feedback_dont_lead_with_claude.md`) — lead is the orangutan/wildfire vignette. No defensive paragraphs about cost, rate limits, or failure modes (per `feedback_blog_depth_over_defense.md`).

**Open items flagged for v2:**

1. Whether to swap orangutan → koala for max-sympathy hook
2. Whether to name the 5 agents explicitly
3. Whether to surface the `ThreatAssembler` fan-in pattern
4. Whether the `/donate` CTA phrasing lands or needs to be more direct (named-charity callout)
5. Pre-publish: verify the GitHub repo URL (`[VERIFY: github.com URL]` at top of doc still pending)

---

**v1 prose:**

When a wildfire crosses within 75km of critically endangered Sumatran orangutan habitat, Wildlife Sentinel fires an alert within 10 minutes. It runs 24/7 against 12 global disaster streams.

Twelve disaster scouts (NASA FIRMS, USGS, NOAA, and nine others) push events into four Redis Streams. Five intelligence agents read those streams as consumer groups. Agents never call each other directly; they communicate only through the bus. If one crashes, messages queue and replay on the next read. If one is slow, the others don't block. XADD, XREADGROUP, XACK.

Before any LLM touches an event, PostGIS runs ST_DWithin against 1,372 species habitat polygons. Seventy to eighty percent of incoming events drop here, outside any monitored range. The cheapest model is no model. A GIST index keeps the filter cheap enough to run on every event.

The primary interface is a Discord bot. Alerts render as rich embeds: species and IUCN status, threat level, distance from habitat, wind and weather context, and matched conservation charities. Critical alerts require a human checkmark reaction before going public. Nine slash commands cover pipeline ops: /status, /pause, /trends, /refiner, /donate.

A secondary Next.js dashboard at wildlife-sentinel.vercel.app shows a Leaflet map color-coded by nine event types, a live alerts feed, a real-time agent activity stream, and a Refiner accuracy chart.

Twenty-four hours after each alert, a Refiner scores predictions against observed NASA and NOAA outcomes via a deterministic composite of direction accuracy (0.6) and magnitude accuracy (0.4), and rewrites the Threat Agent's system prompt when accuracy drops below threshold.

Routing is cost-aware: Gemini Flash-Lite for volume, Gemini Flash for RAG synthesis, Claude Haiku for reasoning. Per-call cost is logged. The RAG agents are bound by retrieval score; if no chunk scores above 0.40 cosine, they say "insufficient context" rather than fabricate biology.

Stack: TypeScript, Express, Next.js, Redis, Neon with PostGIS and pgvector, Discord.js, Gemini SDK, Anthropic SDK. 470 unit and integration tests plus 43 Playwright E2E at 91.4% coverage. Live at wildlife-sentinel.vercel.app. Every public alert ends with /donate links to vetted charities for the species at risk.

#AIEngineering #MultiAgentSystems #DistributedSystems #DiscordBot #OpenToWork

---

### v2 Preparation Notes (2026-05-15 Friday afternoon)

Research and decisions documented Friday so v2 drafting Saturday morning can happen cleanly. User reviewing v1 overnight; may bring additional considerations before v2 prose is written.

#### Item 1 — Koala hook alternative (for v2 comparison)

User wants a look at swapping `Sumatran orangutan` → `koala` to test maximum-sympathy hook, anchored to the 2019–20 Australian bushfire memory. Final decision deferred to v2 review. Two koala draftings to compare against the existing orangutan hook:

**Variant A (longer, ~53 words — full historical anchor):**

> During the 2019–20 Australian bushfires, an estimated three billion animals were killed or displaced; koalas became the symbol of climate-disaster wildlife loss. When a wildfire now crosses within 75km of critically endangered koala habitat, Wildlife Sentinel fires an alert within 10 minutes. It runs 24/7 against 12 global disaster streams.

**Variant B (tighter, ~41 words — historical anchor without the statistic):**

> Koalas became the symbol of the 2019–20 Australian bushfire crisis. When a wildfire now crosses within 75km of critically endangered koala habitat, Wildlife Sentinel fires an alert within 10 minutes. It runs 24/7 against 12 global disaster streams.

**Current v1 orangutan hook (~28 words, for reference):**

> When a wildfire crosses within 75km of critically endangered Sumatran orangutan habitat, Wildlife Sentinel fires an alert within 10 minutes. It runs 24/7 against 12 global disaster streams.

**Tonal risk assessment (per user guidance):** Variant A pushes hardest on emotional anchor and adds ~25 words to the total post (lands at ~365, still under the 400 ceiling). Variant B keeps the koala/bushfire anchor but lets paragraph 2 (Redis Streams) hard-pivot to architecture sooner, reducing the risk that a skimming reader pegs the post as "about koalas and fires" rather than "about multi-agent systems." Variant B is the safer koala play; A is the higher-impact one.

**Verification flag:** koala habitat polygons need to exist in the system's 1,372-polygon set for the koala hook to be technically truthful. Worth confirming in the codebase before locking v2, since the system can't actually fire a koala alert if there's no koala polygon. Easy check by grepping the species seed data.

#### Item 2 — The 5 intelligence agents (confirmed from codebase)

Pulled from `wildlife-sentinel/server/src/agents/`. The five files map 1:1 to the five intelligence agents:

| Agent (codebase class) | Role |
|---|---|
| `EnrichmentAgent` | First-stage enrichment of raw scout events (geocoding, normalization, IUCN status lookup) |
| `HabitatAgent` | PostGIS spatial filter (ST_DWithin against 1,372 polygons) + GBIF recent-sightings lookup |
| `SpeciesContextAgent` | RAG-grounded species briefs from the `species_facts` pgvector index |
| `ThreatAssessmentAgent` | LLM-scored threat level, distance, direction, magnitude prediction |
| `SynthesisAgent` | RAG-grounded final alert composition (conservation context + charity matches + write-up) |

For v2 prose: the message-bus paragraph can name them explicitly. Suggested phrasing:

> Twelve disaster scouts (NASA FIRMS, USGS, NOAA, and nine others) push events into four Redis Streams. Five intelligence agents read those streams as consumer groups: Enrichment, Habitat, Species Context, Threat Assessment, Synthesis. Agents never call each other directly; they communicate only through the bus.

**Note: there is no standalone "Charity Matching" agent.** Charity matching is a function inside the Synthesis stage, not a sixth agent. The v1 phrasing "matched conservation charities" in the Discord bot paragraph remains accurate — but if you ever want to name a "Charity Agent," that's not the codebase reality.

#### Item 3 — ThreatAssembler fan-in pattern (read from `server/src/pipeline/ThreatAssembler.ts`)

**What it is:** a scatter-gather coordinator between HabitatAgent and SpeciesContextAgent. It is not a sixth agent and not itself an LLM caller — it's a pure pipeline-coordination component sitting on Redis.

**How the flow works:**

1. **Scatter (fork):** the upstream `disaster:enriched` Redis Stream is consumed by HabitatAgent and SpeciesContextAgent in parallel. Both run simultaneously on the same event.
2. **Partial-result storage:** each agent writes its result into a Redis hash keyed by event ID (`assembly:<eventId>`). The event itself is also stored in the same hash by an upstream call to `storeEventForAssembly`. So the hash builds up three fields: `event`, `habitat`, `species`.
3. **Gather (join):** every time a partial result lands, `tryAssemble` checks the hash. If all three fields are present, it atomically claims the publish-right via `SETNX` on `assembly:publishing:<eventId>` (60s TTL). This prevents double-publish when both agents finish concurrently.
4. **Publish:** assembler merges event + habitat + species into a `FullyEnrichedEvent`, writes to the `alerts:assessed` Redis Stream, then deletes the assembly hash. Downstream consumers (ThreatAssessmentAgent, SynthesisAgent) read from `alerts:assessed`.
5. **Backlog tolerance:** 24-hour TTL on the assembly hash (`ASSEMBLY_TTL_SECONDS = 86_400`). Lets SpeciesContextAgent grind through deep species backlogs (17–20 species per event × ~90s = ~30 min per event in the worst case) without losing the partial habitat result.
6. **Failure-mode handling:** if both habitat and species arrive but no event field exists (orphaned hash from an old backlog message processed without the upstream store call), the assembler logs a warning to the Discord `#war-room` channel and abandons assembly rather than emitting a corrupt event.

**Why it matters for the post (a "production-systems judgment call" signal):**

- It's a classic distributed-systems fork-join pattern implemented at the Redis layer, not in application memory. That means it survives process restarts: if the assembler process crashes mid-event, the partial state is durably stored in Redis and assembly resumes when the process comes back.
- The atomic `SETNX` claim handles the concurrency edge case (both agents finishing at the same instant) without needing a distributed lock or a transaction.
- The 24h TTL is a deliberate operational choice driven by measured backlog timing, not a default value — that's the kind of detail that reads as production-experience signal.

**Suggested v2 prose (~38 words; slots into the message-bus paragraph as a closing sentence, or stands alone as a 9th paragraph):**

> A ThreatAssembler fans the two parallel agents back in: it gathers habitat and species-context results in a Redis hash keyed by event ID, claims publish-rights atomically with SETNX to handle concurrent completion, and emits the assembled event downstream.

**Recommendation:** add it as the closing sentence of the message-bus paragraph rather than its own paragraph. That keeps the 8-paragraph rhythm and avoids fragmenting the architecture story. The sentence carries enough density on its own — readers who know fork-join will recognize it instantly; readers who don't will move on without losing the thread.

#### Item 4 — `/donate` CTA

Locked as written in v1. No change for v2.

#### Item 5 — URLs

Updated at top of doc:

- `Live app:` https://wildlife-sentinel.vercel.app/
- `Repo:` https://github.com/sjtroxel/Wildlife-Sentinel

#### Open before v2 drafting Saturday

1. User overnight review of v1 — any tonal/structural concerns to incorporate
2. User's call on koala (Variant A vs B) vs orangutan
3. User's call on whether to include the ThreatAssembler sentence in v2
4. If koala wins: confirm koala polygon exists in the 1,372-polygon species set

---

## Publish Log

- **Planning locked:** 2026-05-14 Thursday morning, immediately after Asteroid Bonanza shipped.
- **v1 prose drafted:** 2026-05-15 Friday morning
- **Visuals decided:** _TBD_
- **Posted:** _TBD — Monday 2026-05-18 morning target_
- **Inbound notes:** _TBD — fill in after posting if any recruiter inbound or notable engagement_
