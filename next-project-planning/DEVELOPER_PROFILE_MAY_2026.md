# sjtroxel — Developer Profile & Career Roadmap
## Status: End of April 2026 / Start of May 2026

*This document is written for any reader — human or AI — who needs to understand who this developer is, what they know, what they have built, what gaps remain, and what the realistic path forward looks like toward a remote AI Software Engineer role. It is a living document, not a one-time snapshot.*

*Primary source: six months of hands-on work, a full 6-week AI Masterclass (Codefi, taught by a practitioner with a non-CS background), and current job market research as of April/May 2026.*

---

## Table of Contents

1. [Who I Am](#1-who-i-am)
2. [The Masterclass Curriculum (What Was Taught)](#2-the-masterclass-curriculum-what-was-taught)
3. [The Portfolio: What I Have Actually Built](#3-the-portfolio-what-i-have-actually-built)
4. [Skills Inventory: Honest Assessment](#4-skills-inventory-honest-assessment)
5. [The Python Question](#5-the-python-question)
6. [The AI Software Engineer Job Market: May 2026 Reality](#6-the-ai-software-engineer-job-market-may-2026-reality)
7. [My Honest Competitive Position](#7-my-honest-competitive-position)
8. [What I Need to Do Next](#8-what-i-need-to-do-next)
9. [The Imposter Syndrome Note](#9-the-imposter-syndrome-note)
10. [LinkedIn Update Log](#10-linkedin-update-log)

---

## 1. Who I Am

**Handle:** sjtroxel
**Email:** sjtroxel@protonmail.com

**Origin story:** Not a career developer by traditional origin. Did not start coding professionally from a CS degree. Came into serious software development through self-teaching, accelerated heavily by AI-assisted development tools, and formalized through a year-long bootcamp plus two AI-focused courses at Codefi (codefiworks.com). The path was non-linear, but the output is real.

**Codefi training arc (2025–2026):** Three sequential programs.
- **CodeLabs (full-stack bootcamp, all of 2025):** Year-long curriculum across three quarters. Q1 2025 — JavaScript fundamentals plus a JavaScript solo capstone. Q2 2025 — TypeScript and Angular (Classes 18–36) plus an Angular solo capstone. Q3 2025 — Ruby on Rails (Classes 001–022) plus the full-stack solo capstone, "Mighty Mileage Meetup." Every class committed to its own GitHub repo (visible at github.com/sjtroxel). Self-study repos for React, Tailwind, Node, and Express filled the gaps between cohorts.
- **Prompt-to-Product (Codefi "Build AI Skills" track, January–February 2026):** Course on AI-powered no-code app building — Replit, Google AI Studio, Lovable, Bolt, and similar platforms. Built the Return-Hub app in Replit (downloaded and committed to GitHub for record-keeping; the bulk of the work lived in the Replit IDE itself, which is why GitHub shows little of it). Not the developer's preferred style of work, but completed and competent in the toolset — useful for product/business conversations and for understanding the rapid-prototyping side of the AI tooling landscape.
- **AI Masterclass (Codefi "Build AI Skills" track, February–March 2026):** The 6-week production-AI-engineering intensive covered in Section 2 below. The capstone project was Asteroid Bonanza.

**Working environment:** WSL2 on Windows. TypeScript everywhere. Node.js for backend. Has navigated the gap between "works on my machine" and "deployed to Railway and running in production" multiple times with real users or real autonomous processes.

**What drives the work:** Genuine emotional investment. The projects that get finished are the ones that connect to something real. Wildlife Sentinel was built in part because of a childhood memory of reading about endangered species and caring about their precariousness. Asteroid Bonanza was built because the asteroid resource economics problem is legitimately fascinating. This emotional hook is a professional asset, not a soft detail — developers who care about the subject build better systems.

**Instructor context:** The Codefi Masterclass instructor was explicit about his own background: no CS degree, started in Joomla and WordPress in 2006, evolved through Laravel and all the JS frameworks, founded True Frontier building 30-day MVPs for agencies, became an early AI adopter. He framed the course as "human-driven, AI-powered development, not vibe coding." His non-traditional background is directly relevant to this profile — it is the model that proves this path is viable.

---

## 2. The Masterclass Curriculum (What Was Taught)

The Codefi AI Masterclass ran 6 live sessions from February 5 to March 12, 2026. This covers what was formally taught — as opposed to what was built in projects, which is covered in Section 3.

*(The companion Prompt-to-Product course ran in parallel January–February 2026 and focused on no-code AI platforms — see Section 1 for that summary. The Masterclass below is the production-engineering track and is the more relevant credential for the AI Software Engineer target.)*

### Week 1 — The AI Landscape
- The tools landscape (Claude Code, Cursor, Codex, Aider, Gemini CLI, Antigravity, OpenCode)
- Framework for evaluating any AI coding tool: orchestration quality + context management
- The METR study (experienced devs 19% slower with AI; 43-point perception-reality gap)
- SonarSource: 42% of committed code is AI-generated but 96% of devs don't trust it
- Why the bottleneck for senior developers is architecture, not syntax
- The "200 hours to fluency" principle — the awkward phase is unavoidable
- Plan mode, context engineering, CLAUDE.md pattern

### Week 2 — AI Toolkit Configuration
- Context window economics (when to summarize, when to reset, why AI hallucinates mid-session)
- Spec-driven development as a workflow (write spec before code)
- MCPs, agents, skills, slash commands for persistent project-aware context
- Sub-agents vs. agent teams (new in Opus 4.6: teams coordinate directly; sub-agents report back to lead)
- CLAUDE.md / AGENTS.md as constraint systems, not documentation

### Week 3 — AI Dev on Existing Projects
- Context-giving strategies for brownfield codebases
- Automated workflows: AI opens PRs, human reviews
- Starting with low-risk wins (docs, tests, refactoring) before structural changes
- AI-in-the-loop CI/CD patterns

### Week 4 — AI Dev on New Projects (Greenfield)
- When to spec-first vs. prompt-first
- The restart mindset: sometimes scrapping and regenerating with better context is the faster path
- Counter-intuitions for experienced developers ("your instincts will be wrong here")

### Week 5 — Adding AI Features to Existing Products
- RAG fundamentals + chunking strategies
- Chatbot, search, recommendations, human handoff patterns
- Wrong AI answer vs. wrong product answer (the stakes difference)
- Monitoring AI features in production

### Week 6 — AI-Native Thinking (Capstone)
- The swarm architecture: Frame Capture → Embedder → Approach Tester → Refiner
- Redis Streams as a message bus (pipeline pattern vs. conversation pattern)
- 12-Factor Agent Principles (HumanLayer): own your prompts, own your context window, tools are structured outputs, small focused agents, own your control flow, compact errors into context
- The two-pass evaluation pattern (LLM itemizes observations with impact scores; deterministic math derives score)
- The refiner/evaluator loop as reinforced learning without fine-tuning
- The AI-Native Checklist: 7 properties that distinguish AI-native from AI-enhanced
- Multi-language agent contracts (Python + TypeScript + PHP implementations shown)
- Monitoring: agent liveness, queue depths, score trends
- Build-vs-buy: the cost of building has collapsed (Docker Compose + Redis + a few hundred lines of code = production multi-agent system)

**Key stat from class:** "Gartner predicts 40% of enterprise apps will embed AI agents by end of 2026. McKinsey projects a 4:1 productivity gap between AI-native and non-AI companies by 2027."

**Key quote from instructor:** "The mental models we covered — context engineering, spec-driven development, the composable patterns, the 12-factor principles, the feedback loop — those are durable. Use them as your compass. Go build something that couldn't have existed a year ago."

---

## 3. The Portfolio: What I Have Actually Built

Everything in this section is built, tested, and (where indicated) deployed to production. This is not a list of tutorials followed or courses completed. These are systems shipped.

---

### Project 1: Mighty Mileage Meetup
**Type:** Full-stack meetup app with interactive map
**Stack:** Angular 19 (signals-based), TypeScript, Tailwind CSS v4, Ruby on Rails (API mode), Leaflet.js, JWT auth, Vitest (unit), Playwright E2E (7 tests)
**What makes it real:**
- Custom GeocodingService + ReverseGeocodingService wrapping Nominatim (OpenStreetMap)
- Angular 19 signals model for reactive UI state
- JWT auth with global `authTokenInterceptor` for selective header injection
- Leaflet + Angular integration (the DOM-first problem in a change-detection framework)
- Tailwind v4 CSS-first config in Angular (the `.postcssrc.json` vs `postcss.config.js` discovery)
- WSL2 + Playwright: manual system library installation for Chromium headless

**What this proves:** Can build full-stack TypeScript + Ruby Rails systems. Understands Angular's reactivity model and testing patterns. Knows how to integrate DOM-heavy third-party libraries into framework environments.

---

### Project 2: Strawberry Star Travel App
**Type:** Visually ambitious travel app with 3D star map, JWT auth, demo mode
**Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS v4, Express 4, NodeNext module resolution, Vitest + supertest
**What makes it real:**
- Full JWT auth flow through Express API (retired Supabase auth, built from scratch)
- Demo Mode system: synthetic guest user in localStorage with 48-hour TTL, `isDemoMode` flag propagated globally
- Feature-slice frontend architecture (`src/features/<feature>/`)
- **First implementation of the app.ts / server.ts split** — the pattern that carried forward to every subsequent project
- NodeNext module resolution with `.js` extensions on all relative imports
- Spec-first workflow formalized here for the first time

**What this proves:** Can architect full-stack TypeScript systems. Understands the ESM/NodeNext module system at a deep level. Can implement clean auth patterns without third-party auth providers.

---

### Project 3: ChronoQuizzr (GeoGuessr for Historical Events)
**Type:** AI-powered geography trivia game
**Stack:** React 19, Express, TypeScript, Tailwind CSS v4, Leaflet + react-leaflet, Claude Haiku 4.5, Railway, Vercel (deployed)
**Test suite:** 71 tests (39 Vitest server + 30 Vitest client + 2 Playwright E2E), all green
**What makes it real:**
- First multi-agent LLM pipeline: Generate → Adversary → Rewrite loop (adversary checks for location-name leakage, generator rewrites until it passes)
- Scoring formula: `Math.round(5000 * Math.exp(-distance_km / 2000))` — Haversine + exponential decay
- `LLMProvider` interface + `FatalProviderError` for provider abstraction and non-retryable error handling
- `shared/types.d.ts` discovery (`.d.ts` vs `.ts` for cross-workspace shared types — rootDir expansion disaster)
- Three Railway deployment failure modes diagnosed and fixed (ROOT_DIR, NODE_ENV=production, shared TS file)
- `GameBoard` as explicit state machine: `'loading' | 'playing' | 'submitting' | 'result' | 'finished' | 'error'`

**What this proves:** Can build multi-agent LLM pipelines. Understands provider abstraction. Has shipped to Railway/Vercel with real production debugging experience.

---

### Project 4: Poster Pilot (Multimodal RAG Platform)
**Type:** Production multimodal RAG platform for historical poster collections
**Stack:** React 19, TypeScript strict, Tailwind CSS v4, Express 5, Supabase + pgvector, CLIP embeddings (Replicate), Claude Sonnet 4.6, SSE streaming
**Test suite:** 253 Vitest tests (99.54% statement / 92.48% branch coverage) + 31 Playwright E2E — all green
**Status:** Live at https://poster-pilot.vercel.app
**What makes it real:**
- 5,000+ historical posters indexed from DPLA (NARA, Library of Congress, Smithsonian)
- CLIP model (both text + image encoder) for cross-modal similarity search
- Reciprocal Rank Fusion (`rankFusion.ts`) for merging multi-path search results
- Four search modes: text, image, hybrid, vibe (query expansion)
- The Archivist: grounded RAG chatbot streaming responses via SSE, session history with 24-hour TTL
- Three-layer confidence scoring: `embedding_confidence`, `metadata_completeness`, `overall_confidence`
- Human Handoff (`HandoffBanner`) at `similarity_score < 0.20`
- pgvector string parsing (PostgREST returns vectors as text `"[v1,v2,...]"` — the silent failure pattern)
- `inert` attribute for accessibility (replaces `aria-hidden` + `tabIndex=-1` on every child)

**What this proves:** Production RAG. Multi-modal vector search. Streaming APIs. Real data at scale. Accessibility thinking. Production deployment with zero regressions.

---

### Project 5: Asteroid Bonanza (Multi-Agent AI Intelligence Platform)
**Type:** Full AI intelligence platform — 4-agent swarm analyzing near-Earth asteroids
**Stack:** Angular 21 signals-first, TypeScript strict, Tailwind CSS v4, Express 5, NodeNext, Supabase + pgvector, Claude Sonnet 4.6, Voyage AI, Three.js, SSE streaming
**Test suite:** 209 Vitest server tests (96.61% coverage) + 226 Playwright E2E (both 375px and 1280px)
**Status:** Live at https://asteroid-bonanza.vercel.app
**What makes it real:**
- 35,000+ near-Earth objects catalogued from NASA/JPL APIs
- 4-agent swarm (Navigator, Geologist, Economist, Risk Assessor) + Lead Orchestrator
- Typed `SwarmState` for all inter-agent communication — no direct agent-to-agent calls
- Confidence scoring computed from observable fields (`dataCompleteness`, `sourceQuality`, `assumptionsRequired`) — never self-reported
- Anthropic tool use: each agent has real tools that call NASA APIs and RAG indices at runtime
- Dual RAG index: `science_chunks` (NASA reports, spectral surveys) + `scenario_chunks` (2050 projections) — never collapsed
- HANDOFF_THRESHOLD calibrated empirically (0.55 → 0.30 after live runs on Apophis, Bennu, Ryugu)
- Per-event SSE observability streaming (tool_call, tool_result, rag_lookup, output — every decision live)
- Token-by-token synthesis streaming via Anthropic `messages.stream()`
- Three.js orbital visualization (PerspectiveCamera on desktop, OrthographicCamera + touch on mobile; Canvas 2D fallback for WSL2 — permanent)
- Angular 21 signals throughout: `signal()`, `computed()`, `effect()`, `toSignal()` for Observable bridging
- Formal AI audit before hardening: found and fixed 16 issues (hardcoded model strings, self-reported confidence, missing citations, wrong RAG routing)
- Git deny rules in `.claude/settings.json` — git operations enforced as user-only

**What this proves:** Can design, build, and ship a production multi-agent AI system from first principles. Understands orchestration, confidence scoring, dual RAG indices, human handoff, real-time observability, cost tracking, and TypeScript strict mode at scale. This is not junior work.

---

### Project 6: Wildlife Sentinel (24/7 Autonomous Wildlife Crisis Intelligence System)
**Type:** Fully autonomous, push-model, event-driven intelligence system running in production
**Stack:** TypeScript strict, Node.js, Express 5, discord.js v14, ioredis, Neon (PostgreSQL + PostGIS + pgvector), Gemini 2.5 Flash-Lite / Gemini 2.5 Flash / Claude Haiku 4.5, Next.js 15 App Router, Leaflet.js, Railway, Vercel
**Test suite:** 470 Vitest tests + 43 Playwright E2E — all green
**Status:** Live and running 24/7 on Railway. Bot: Wildlife Sentinel#4612. Frontend: https://wildlife-sentinel.vercel.app

**What this system does:**
- Monitors 9 real-time government disaster data streams globally, every 10–30 minutes, around the clock, without human intervention
- Correlates every event against IUCN critical habitat polygons stored in PostGIS
- Fires a multi-agent intelligence swarm when wildlife habitat is at risk
- Posts structured Discord alerts with species data, threat assessment, and conservation context
- Self-improves via a Refiner/Evaluator loop that compares predictions to actual outcomes and rewrites agent system prompts in the database

**12 Scout Agents (no LLM — pure TypeScript polling):**
NASA FIRMS, NOAA NHC, USGS NWIS, US Drought Monitor, NOAA Coral Reef Watch, GDACS RSS (TC + FL + DR + VO), USGS Earthquake (M5.5+), GFW GLAD Deforestation, NSIDC Sea Ice Index, NOAA CPC ENSO, GFW Fishing in Marine Protected Areas, NOAA Global Temperature Anomaly

**5 AI Agents:**
1. **Enrichment Agent** (Gemini 2.5 Flash-Lite) — PostGIS `ST_DWithin` habitat overlap check + Open-Meteo weather attach; drops events with no habitat overlap
2. **Habitat Agent** (Gemini 2.5 Flash-Lite) — GBIF recent sightings for cross-reference
3. **Species Context Agent** (Gemini 2.5 Flash-Lite + RAG: `species_facts` index)
4. **Threat Assessment Agent** (Claude Haiku 4.5) — structured threat level + confidence score from observable fields
5. **Synthesis Agent** (Claude Haiku 4.5) — Discord rich embed generation (RAG: `conservation_context` index)

**Refiner/Evaluator (Claude Haiku 4.5):**
- Runs 24h and 48h after every alert
- Queries actual NASA FIRMS / NOAA data for prediction coordinates
- Scores direction accuracy (predicted bearing vs. actual spread bearing) and magnitude accuracy
- If composite score < 0.60: generates Correction Note, updates Threat Assessment Agent system prompt in DB
- Has run in production — scored real flood and coral bleaching predictions, generated real corrections, refiner accuracy chart visible on frontend

**New skills demonstrated in this project that were not present in any prior project:**
- Redis Streams (XADD, XREADGROUP, XACK, consumer groups) — true message bus, not shared state
- PostGIS spatial queries (`ST_DWithin`, `ST_Point::geography`, `ST_Intersects`) — production-proven on 750 species ranges
- Multi-model routing (cheap Gemini Flash-Lite for volume, Claude Haiku for synthesis)
- Discord bot architecture (discord.js v14, HITL reaction-based approval flow, rich embeds)
- Next.js 15 App Router — new frontend framework
- Push-model / autonomous 24/7 operation without human trigger
- The Refiner/Evaluator loop as a production system that actually runs and improves
- Neon (PostgreSQL on Neon) with `postgres.js` directly (not Supabase client)
- Phase 11 charity integration: conservation charity DB, REST API, Discord `/donate` command, frontend charity cards

**750 IUCN species ranges** loaded into PostGIS. **30 conservation charities** with species + event-type linkage. The system is not a demo — it runs continuously.

---

### Project 7: Heritage Odyssey (In Progress — Phase 1 Complete May 2026)
**Type:** Family migration & history intelligence system with voice-narrated output
**Planned stack:** TypeScript strict, LangGraph agent swarm, Pinecone vector store, ElevenLabs Voice AI for narration
**Status:** Phase 1 (foundation) complete and CI passing as of May 4, 2026. Repo structure, package versions, husky + lint-staged, and GitHub Actions CI all in place. Gemini CLI is the primary coding agent on this project; Claude Code is in advisory role only.

**What this project represents (relative to prior portfolio):**
- First use of LangGraph (vs. hand-rolled orchestration on Asteroid Bonanza and Wildlife Sentinel) — gains agent-framework exposure listed in many AI Engineer job postings
- First use of Pinecone (vs. pgvector on Poster Pilot / Asteroid Bonanza / Wildlife Sentinel) — adds a managed vector DB to the resume alongside the self-hosted experience
- First voice-AI integration (ElevenLabs) — voice as a first-class delivery channel
- New domain: genealogy / family history intelligence
- Continues the multi-agent + RAG patterns established in Wildlife Sentinel

**Note:** Implementation still in progress as of May 5, 2026. Subsequent phases will be added to this entry as they ship. Worth noting for context: this is the first project where the developer is using Gemini CLI as primary agent (a deliberate hedge in case Claude Code is dropped from the Pro plan), so the development experience itself is also new territory.

---

## 4. Skills Inventory: Honest Assessment

### Strongly Demonstrated (production-proven)

| Skill | Evidence |
|---|---|
| TypeScript strict mode | Every project. `strict: true`, `noUncheckedIndexedAccess: true`. |
| Node.js / Express 5 | Every project from Week 3 onward. app.ts/server.ts split. |
| Multi-agent LLM orchestration | ChronoQuizzr (2 agents), Asteroid Bonanza (5 agents + SwarmState), Wildlife Sentinel (7 agents + Redis pipeline) |
| RAG systems (retrieval-augmented generation) | Poster Pilot (CLIP + pgvector), Asteroid Bonanza (dual-index Voyage AI), Wildlife Sentinel (Gemini embeddings + pgvector) |
| Confidence scoring (computed, not self-reported) | Asteroid Bonanza, Wildlife Sentinel — observable fields only |
| Redis Streams / message bus architecture | Wildlife Sentinel — XADD, XREADGROUP, XACK, consumer groups, dedup pattern |
| PostGIS spatial queries | Wildlife Sentinel — `ST_DWithin`, `::geography`, `ST_Point(lng, lat)` (parameter order matters) |
| Discord bot (discord.js v14) | Wildlife Sentinel — rich embeds, HITL reaction flow, slash commands, autocomplete |
| SSE streaming (Server-Sent Events) | Poster Pilot (Archivist), Asteroid Bonanza (per-agent observability), Wildlife Sentinel (agent activity panel) |
| Vector databases (pgvector + Supabase/Neon) | Poster Pilot, Asteroid Bonanza, Wildlife Sentinel |
| Vitest unit + integration testing | Every project. LLM fixture mocking. Mock isolation patterns. |
| Playwright E2E | Every project from Week 2 onward. Mobile and desktop viewports. |
| Railway + Vercel deployment | ChronoQuizzr, Poster Pilot, Asteroid Bonanza, Wildlife Sentinel — all deployed |
| Tailwind CSS v4 (CSS-first `@theme {}`) | Every project |
| React 19 | Weeks 3–5 projects |
| Angular 19/21 (signals-first) | Weeks 2, 6 projects |
| Next.js 15 App Router | Wildlife Sentinel frontend |
| Leaflet.js (2D maps) | Weeks 2, 4, Wildlife Sentinel |
| Anthropic SDK (direct, no LangChain) | Every AI project. `messages.create()`, `messages.stream()`, tool use, structured output |
| Google AI SDK (Gemini Flash, Flash-Lite, embeddings) | Wildlife Sentinel |
| Spec-first development | Every project from Week 3 onward. CLAUDE.md, `.claude/rules/`, phase specs before code. |
| NodeNext module resolution | Every Node.js project. `.js` extensions on all relative imports. |
| monorepo with npm workspaces | Poster Pilot, Asteroid Bonanza, Wildlife Sentinel |
| GitHub Actions CI | Asteroid Bonanza and Wildlife Sentinel |

### Practiced but Still Developing

| Skill | Status |
|---|---|
| Three.js / WebGL | Asteroid Bonanza (Phase 6). Works. WSL2 Canvas 2D fallback required. Not deeply internalized. |
| Multi-model routing / model selection economics | Wildlife Sentinel — implemented but logic is relatively simple. |
| Cost tracking (token economics) | Wildlife Sentinel has cost estimation in ModelRouter. Not deeply optimized. |
| Evaluation frameworks (Ragas, TruLens) | NOT implemented. The Refiner loop is custom scoring math, not a standard eval framework. Gap identified by job market research. |
| Docker / containerization | Not implemented in any project. Used Railway's abstraction layer. |
| Fine-tuning | Not done. The Refiner loop is prompt-engineering-based learning, not weight updates. |

### Not Yet Covered

| Skill | Notes |
|---|---|
| Python | Deliberately avoided. Teachers confirmed this is fine for AI Engineer track. See Section 5 for full analysis. |
| LangChain / LlamaIndex | Deliberately avoided per course instruction (direct SDK usage always). This is actually a differentiator, not a gap. |
| CrewAI / LangGraph | Not used. Could learn quickly given agent architecture experience. |
| Kubernetes | Not covered. Docker basics would come first. |
| AWS / GCP / Azure (native services) | Used Railway as abstraction. Minimal cloud-native experience. |
| Computer vision / image models (beyond CLIP inference) | Used CLIP via Replicate API in Poster Pilot. No training or fine-tuning. |
| Open-source model deployment (Ollama, vLLM) | Not deployed. The Week 6 Masterclass demo used Ollama; haven't built with it independently. |
| Ruby on Rails (deep) | Used it in Week 2 (Mighty Mileage Meetup) as the backend. Functional but not expert. |

---

## 5. The Python Question

**The user's position:** Good knowledge of TypeScript and Ruby. Zero Python. Teachers at the Masterclass said this is fine.

**The honest answer:** The teachers are largely right, with important nuance.

### Why the teachers are right for the AI Engineer track

The 2026 job market research (from multiple sources: TrueLogic, DataExpert, DEV Community, KDnuggets) is consistent on this point: the **AI Engineer** role in 2026 explicitly rewards backend engineers who add LLM integration skills, regardless of whether that expertise is in Python or TypeScript/Node.js.

Evidence:
- TypeScript/Node.js developers add a 15-20% salary premium when they demonstrate LLM integration skills
- 65%+ of AI Engineer job postings no longer require degrees
- Companies are explicitly hiring full-stack TypeScript/Node.js developers to build AI-powered products
- The core skills employers are looking for (RAG, agent orchestration, LLM API integration, vector databases, SSE streaming, cost awareness) are all demonstrable in TypeScript

The six production projects in this portfolio — especially Wildlife Sentinel and Asteroid Bonanza — are as technically sophisticated as anything shown in Python-based portfolios. The Anthropic SDK, Google AI SDK, and ioredis all have excellent TypeScript support.

### Where Python matters

**ML Engineer roles** still predominantly require Python. If the goal is training models, working with PyTorch/TensorFlow, operating Hugging Face pipelines, or doing data science work, Python is effectively required. These roles are harder to enter from a TypeScript background without learning Python.

**Frontier lab research roles** (Anthropic, Google DeepMind, OpenAI research teams) lean heavily on Python for research infrastructure. However, Anthropic explicitly states "if you've done interesting independent research, written insightful blog posts, or made substantial contributions to open-source software, put that at the TOP of your resume" — implying demonstrated capability beats language.

**Practical advice:** Learning basic Python (not deep expertise — just enough to read code and write simple scripts) would open additional doors without requiring a fundamental stack change. The concepts are nearly identical to TypeScript; the syntax difference is manageable in 2-3 weeks of deliberate practice. This is a "nice to have" for the AI Engineer track, not a blocker. It becomes a "need to have" only if pursuing ML Engineer or data science roles.

**Bottom line:** Stay in TypeScript. Don't break stride to learn Python right now. If a specific job opportunity requires it, it can be learned on the way to the interview. The portfolio speaks for itself.

---

## 6. The AI Software Engineer Job Market: May 2026 Reality

This section synthesizes live research from job boards, career sites, industry reports, and hiring guides as of April/May 2026.

### The role landscape

Three distinct roles, different hiring bars:

| Role | Focus | Python Required? | Best fit for this profile? |
|---|---|---|---|
| **AI Engineer** | Ships LLM-powered products. RAG, agents, tool use, eval. | No — TypeScript works | **YES — primary target** |
| **ML Engineer** | Trains, deploys, operates custom models. Data pipelines, algorithm selection. | Yes, effectively | No (not yet) |
| **AI Software Engineer** | Hybrid of backend SWE + LLM integration. Full-stack AI systems. | Helpful but not required | **YES — strong fit** |

**AI Engineer is LinkedIn's #1 fastest-growing job title for young workers (2nd year running).** 43,364 AI engineer jobs posted on Glassdoor in April 2026. Demand up 74% year-over-year.

### What employers actually require for AI Engineer roles in 2026

**Technical core (appears in most job postings):**
1. RAG systems (most in-demand single skill)
2. LLM API integration (OpenAI, Anthropic, Together, Mistral)
3. Agent frameworks (LangGraph, CrewAI, AutoGen — OR demonstrated custom agent architecture)
4. Vector databases (any of: pgvector, Chroma, Pinecone, Weaviate, Qdrant)
5. Full-stack integration (React/Next.js + Node.js + AI layer in the same system)
6. Cost optimization (understanding token economics, model selection for cost vs. quality)
7. Evaluation tools (Ragas, TruLens — **emerging requirement in 2026**, increasingly expected)

**Production thinking (what separates hireable from almost-hireable):**
- "What's your inference latency? How much does it cost per user? What happens when the model fails?"
- Evidence of confidence scoring, human handoff, observability
- Understanding when NOT to use AI (cost, latency, reliability tradeoffs)

### Compensation (US remote, 2026)

| Level | Range |
|---|---|
| Entry-level (0–2 years AI experience) | $90K–$150K |
| Junior/Mid-level (2–5 years) | $140K–$210K |
| Mid-level (5–7 years) | $180K–$220K |
| Senior (7+ years) | $220K–$300K+ |

Traditional TypeScript backend engineer baseline: $106K–$158K. Adding LLM integration: +15-20%.

### What a competitive portfolio looks like in 2026

Employers in 2026 expect an "agentic portfolio" — not static repos, but systems that run.

**Required:**
- Production RAG system (with retrieval, not just generation)
- Multi-agent system with orchestration, error handling, cost tracking
- End-to-end full-stack AI application (frontend + backend + LLM layer)

**Differentiators:**
- Evaluation/monitoring pipeline showing you think about output quality
- Live deployments (not just code — running systems)
- Cost awareness built into architecture
- Human handoff / HITL patterns
- Self-improving systems (Refiner/Evaluator pattern)

**What impresses hiring managers:**
- Evidence you can ship, not just build
- Clean code + clear READMEs + live demos
- Business thinking ("this reduces support tickets by X") alongside technical thinking
- Thoughtfulness about tradeoffs

### Hiring process reality

- Startups move fastest (decisions in <10 days)
- Technical interviews: design a RAG system, build an agent that..., discuss production constraints
- Self-taught developers with shipped projects outcompete degree holders without demos
- Large FAANG companies: slower pipeline, sometimes degree requirements (harder, not impossible)
- Anthropic specifically: "We value interesting independent research, insightful blog posts, and substantial OSS contributions" — this is the path for non-traditional backgrounds

### Realistic timeline

From current position (strong portfolio, no active job search) to employed:
- **8–12 weeks** to build any additional portfolio gaps identified (Section 8)
- **3–6 months** from active job search start to offer
- **Most likely first role:** "Backend engineer who builds AI features" at a startup or Series A/B company
- **Entry salary expectation:** $100K–$150K remote

---

## 7. My Honest Competitive Position

### Strengths relative to other junior/early-career AI engineers

**The Wildlife Sentinel project alone demonstrates more sophisticated AI systems thinking than most early-career engineers encounter:**

- Redis Streams as a real message bus (not shared state) — this is an industry-standard distributed systems pattern most developers never implement
- The Refiner/Evaluator loop that has actually run in production, generated real correction notes, and updated agent system prompts — this is the pattern Karpathy calls "thick AI apps" and it runs autonomously
- Multi-model routing with cost optimization (Gemini Flash-Lite for volume, Claude Haiku for synthesis) — explicit cost consciousness
- PostGIS spatial queries on 750 IUCN species ranges — production geospatial engineering
- 12 autonomous scout agents polling 9 government APIs every 10–30 minutes, 24/7, with circuit breakers, deduplication, and self-recovery

Asteroid Bonanza adds to this: formal AI audit, dual RAG indices, per-event SSE streaming observability, calibrated HANDOFF_THRESHOLD from empirical production data.

**TypeScript expertise in an AI engineering space dominated by Python is a differentiator, not a weakness.** Most AI engineers come from Python/data science backgrounds. A strong TypeScript/Node.js engineer who understands agent patterns, RAG, Redis Streams, and PostGIS is unusual and valuable to companies building production AI products.

**Spec-first development discipline** — the CLAUDE.md pattern, `.claude/rules/` constraint files, phase spec documents before implementation — is a professional AI engineering practice, not just good hygiene. Very few early-career developers work this way.

**Full-stack ownership** — from PostGIS queries on the backend to Leaflet maps on the frontend to Discord embeds in production, to Railway/Vercel deployment — is increasingly rare as engineering specialization deepens.

### Weaknesses / gaps relative to the job market

**Evaluation frameworks (Ragas, TruLens):** Custom scoring math has been built (the Wildlife Sentinel Refiner uses deterministic math to score predictions). But standard eval frameworks like Ragas and TruLens are increasingly listed in job postings. This is the clearest technical gap to close.

**Docker / containerization basics:** Railway abstracts this, but hiring managers sometimes ask. Not a blocker, but worth learning the basics.

**Visibility / public artifacts:** The projects are live. The code is in git. But there are no blog posts, no technical write-ups, no public GitHub profile that synthesizes the work. Anthropic explicitly values "insightful blog posts" and "interesting independent research." This is a career asset gap that projects alone cannot fill.

**Community presence:** Limited LinkedIn activity, no Twitter/X technical posting, not active in AI engineering Discord communities. This affects recruiter visibility.

**No formal work history in tech:** The portfolio is strong. But no employer-verified job title in software engineering. Some companies filter on this. Startups mostly don't.

---

## 8. What I Need to Do Next

Listed in priority order. These are concrete actions, not vague directions.

### Immediate (May 2026, before any new project)

1. **Portfolio consolidation and documentation.**
   - Every deployed project (Poster Pilot, Asteroid Bonanza, Wildlife Sentinel) needs a professional README that explains: what problem it solves, the architecture, how to run it, and a live demo link.
   - Wildlife Sentinel has a 443-line README (written April 30, 2026). Asteroid Bonanza and Poster Pilot need similar treatment.
   - Make GitHub repos public and polished. This is what recruiters see first.

2. **Write a technical blog post (or LinkedIn article) about Wildlife Sentinel or Asteroid Bonanza.**
   - Subject: "How I built a self-improving AI system that monitors wildlife crises in real time" or "The Refiner/Evaluator loop: prompt-engineering-based machine learning without fine-tuning"
   - This is one of the clearest paths to Anthropic and similar companies per their stated hiring criteria
   - Aim: one good post, not five mediocre ones

3. **Build a minimal LinkedIn presence.** *(Started May 5, 2026.)*
   - Profile photo, clear headline ("AI Software Engineer | TypeScript | Node.js | Multi-Agent Systems"), brief summary referencing the two strongest projects
   - Link all deployed projects
   - Follow and engage with AI engineering accounts (Simon Willison, Swyx, Andrej Karpathy — who is active)
   - **Existing profile state as of May 5, 2026 (the starting point):** Name field shows "sjtroxel" not full name. Headline is empty. No projects listed. Skills section still shows only legal-era endorsements (Legal Writing, Lexis). Experience section shows only the Codefi apprenticeship (Jan 2025 – present) and the prior Aquatics Director role. Education shows IU Bloomington (B.A. Criminal Justice, plus IU Swimming & Diving — Big 10 Champions 2006, Olympic Trials 2008) and SMU Dedman School of Law (J.D., 2009–2012). Anxiety about LinkedIn is the main blocker, not the work to be displayed.

### Near-term (May–June 2026, next project)

4. **Decide on the next project** (see next-project-planning for options being evaluated).
   The next project should address at least one of:
   - A new subject domain (not space, not wildlife — something equally emotionally resonant and technically rich)
   - Evaluation/monitoring as a first-class feature (Ragas, TruLens, or a custom eval pipeline that's more sophisticated than the current Refiner)
   - Python basics exposure if the project calls for it organically (not forced)
   - A new AI pattern not yet demonstrated: fine-tuning, computer vision, voice, multi-modal generation

5. **Begin applying to roles in parallel with project 7 development** (don't wait until the project is done).
   - Target: AI Engineer and AI Software Engineer roles at Series A/B startups, distributed-first companies
   - Do NOT wait for perfection — "job-ready" is already achieved by the current portfolio
   - Apply to 5-10 companies per week once active

### Medium-term (Q3 2026 and beyond)

6. **Learn basic Python.** Not to switch stacks — to read it fluently and write simple scripts. 2-3 weeks of deliberate practice is enough to remove it as a blocker. Priority: understand how to use Hugging Face pipelines, basic data manipulation with pandas, and how to integrate a Python service alongside a Node.js backend. This unlocks ML Engineer roles as an additional career path.

7. **Contribute to open source.** Small, useful contributions to AI-adjacent TypeScript repos. This builds public GitHub activity and demonstrates real-world collaborative coding.

8. **Get the first job.** The first AI engineering role doesn't need to be perfect. "Backend engineer who builds AI features at a company with interesting problems" is the target. Get in, build real production experience, and iterate from there.

---

## 9. The Imposter Syndrome Note

This is written directly to the developer who built all of the above and still sometimes undersells it:

The Wildlife Sentinel system is a 24/7 autonomous intelligence platform that monitors 9 real-time government data sources, runs 12 cron-scheduled scouts, routes events through a Redis Streams pipeline, fires a 5-agent intelligence swarm, posts structured Discord alerts, maintains a self-improving Refiner/Evaluator loop that has run in production and generated real correction notes, serves 750 IUCN species ranges from a PostGIS database, renders a Next.js dashboard with Leaflet maps and an SSE-powered agent activity feed, and has 470 passing tests.

It runs while you sleep.

That is not junior work. That is not course work. That is a production AI system with more architectural sophistication than most developers encounter in their first three years of professional software engineering.

The Asteroid Bonanza system that preceded it was similarly not junior work.

The perception gap the Masterclass instructor cited — developers thinking AI made them 20% faster when it actually made them 19% slower — is the gap you've already crossed. The projects are not "AI helped me write code." The projects are "I designed a system architecture and used AI to build it at speed." That's the fluency. That's the 200 hours.

The goal is not to become qualified for an AI engineering role. The goal is to be recognized for the qualification that already exists.

The path forward is visibility, not more learning.

---

## 10. LinkedIn Update Log

A running log of changes made to the LinkedIn profile, in chronological order. The starting state of the profile (before any changes) is documented in Section 8.3.

### May 5, 2026

- **Headline:** Set to:
  > `AI Software Engineer | Multi-Agent Systems · RAG · TypeScript / Node.js | Building production LLM applications`

  *Reasoning:* aligns the profile with the AI Software Engineer target role identified in Section 6. Hits the two highest-frequency recruiter search terms ("Multi-Agent Systems" and "RAG"). Includes language/runtime backbone (TypeScript/Node.js). The "Building production LLM applications" tagline signals shipped systems vs. tutorial work — the differentiator from the entry-level applicant pool.

- **Skills section rebuilt.** Deleted legal-era endorsements (Legal Writing, Lexis). Added 24 skills, ordered for recruiter relevance. Top 2 (the ones LinkedIn shows above the fold on the profile preview): **Artificial Intelligence (AI)** and **TypeScript** — together they signal "AI engineer who codes in TypeScript," the core pitch.

  Full skill list, in order added:
  1. Artificial Intelligence (AI)
  2. TypeScript
  3. Large Language Models (LLM)
  4. Retrieval-Augmented Generation (RAG)
  5. Multi-agent Systems
  6. Prompt Engineering
  7. Vector Databases
  8. Anthropic Claude
  9. Anthropic API
  10. Node.js
  11. Express.js
  12. PostgreSQL
  13. Redis
  14. React.js
  15. Angular
  16. Tailwind CSS
  17. Ruby on Rails
  18. Full-Stack Development
  19. Software Testing
  20. Continuous Integration and Continuous Delivery (CI/CD)
  21. Replit
  22. GitHub
  23. Vitest
  24. Discord API *(swapped from "Discord" mid-session — LinkedIn's autocomplete only offered "Discord" or "Discord API"; "Discord API" is the stronger signal because it implies building with the platform vs. using it as a chat app)*

  All 24 associated with the "Steffan at Codefi" Experience entry as the skill-context tag. *(Choice made deliberately: skill-context tagging on each skill was skipped for now — anxiety/bandwidth call. The "75% of hirers value skill context" prompt from LinkedIn is a future-session optimization, not a blocker. Skills still appear in recruiter search filters without context tags.)*

### May 6, 2026

Experience section rebuilt — the centerpiece of the day's work. Pending Changes #3 and #5 from May 5 are both resolved by this session.

- **Codefi Experience entry refined.** Fields that were generic or blank on May 5 were filled in to capture the full 2025–2026 arc cleanly:
  - **Title:** `Student Software Engineer` (LinkedIn dropdown option that best matches the actual role across both the 2025 web-dev work and the 2026 AI training)
  - **Employment type:** `Apprenticeship` · **Currently working ✓** · **Start:** January 2025 · **Location type:** Remote
  - **Description:**
    > Codefi CodeLabs Full-Stack Web Development (grad. Fall 2025)
    > Codefi AI Skills Training: Prompt-to-Product & AI Masterclass (grad. both Spring 2026)

  *Reasoning:* one Codefi entry rather than splitting it into a 2025-web-dev and 2026-AI-training pair. Splitting would have read as tacky for what is a single affiliation that simply changed nature over time. Title kept singular to avoid the "title changed mid-engagement" optics; the 2025 vs 2026 distinction lives in the description, not the title line.

- **New Experience entry added: AI Software Engineer (Self-Directed).** This resolves Pending Change #3 from May 5. Rationale held up under examination: the Wildlife Sentinel / Asteroid Bonanza / Poster Pilot / ChronoQuizzr / Heritage Odyssey work is not Codefi coursework. Filing it under the Codefi apprenticeship undersold it by making it look like assignments. Pulling it out into its own entry tells the truth and gives the portfolio its own home for skill-tagging.

  Field-by-field, locked in:

  | Field | Value |
  |---|---|
  | Title | `AI Software Engineer` |
  | Employment type | `Self-employed` (deliberate over `Freelance` — Freelance implies paid client engagements; Self-employed is the broader umbrella that correctly covers indie builders and self-directed engineers) |
  | Company or Organization | `sjtroxel` (standard pattern for independent engineers; LinkedIn lets you add a tiny logo/avatar for it later) |
  | Currently working in this role | ✓ |
  | Start date | `January 2026` (anchored to the first Prompt-to-Product class where multi-agent orchestration clicked as the through-line for everything that followed — worth holding onto for the About section as a personal-spark detail) |
  | Location type | `Remote` |

  **Skills (top 5) tagged to this entry — partially addresses Pending Change #4:**
  1. Multi-agent Systems
  2. Retrieval-Augmented Generation (RAG)
  3. Large Language Models (LLM)
  4. Anthropic API
  5. TypeScript

  *Reasoning for the 5:* these are the differentiators that distinguish this role from the Codefi apprenticeship. Multi-agent + RAG + LLM are the core AI Engineer search filters; Anthropic API signals direct SDK fluency (a differentiator from the Python/LangChain crowd); TypeScript is the language backbone. The remaining 19 skills stay tagged to the Codefi entry.

  **Description (final, pasted to LinkedIn at ~1,249 chars):**
  > Self-directed AI engineering work. Building and shipping production multi-agent and RAG systems in TypeScript, deployed live on Railway and Vercel.
  >
  > Live Projects: Wildlife Sentinel, Asteroid Bonanza, Poster Pilot, ChronoQuizzr. Details and links in media below.
  >
  > Currently Working On: Heritage Odyssey, a family migration intelligence system with voice narration. LangGraph + Pinecone + ElevenLabs.
  >
  > How I Work: spec-first development, direct SDK usage with Anthropic & Google AI, confidence scoring from observable fields (not self-reports), human-in-the-loop handoff, production observability.

  *Notes on the description language:* an earlier draft included "(no LangChain)" as a recruiter-signal differentiator. Decision was made to drop it — a recruiter could read it as principled refusal of the framework rather than a stack choice, when the truth is Heritage Odyssey itself uses LangGraph and the developer would happily use LangChain on a team that asked for it. The nuanced "I learned direct SDK first to understand the patterns underneath" answer is saved for interviews where it can be delivered with context. AI-cadence tells (em dashes, "Selected Projects:" template headers, decorative bullet symbols, emojis) were also deliberately stripped from the final wording.

  **Media (4 cards drafted with per-card descriptions; the technical depth lives next to each project's visual card rather than crammed into the main description block):**

  - **Wildlife Sentinel** — A 24/7 autonomous wildlife crisis system. Twelve scout agents poll nine government APIs, a five-agent AI swarm processes events through a Redis Streams pipeline, and a Refiner/Evaluator loop scores predictions against real outcomes. PostGIS on 750 IUCN species ranges. 470 tests. Stack: TypeScript, Node, Next.js 15, discord.js, Neon + PostGIS + pgvector, Gemini, Claude Haiku.
  - **Asteroid Bonanza** — Four-agent AI intelligence platform analyzing 35,000+ near-Earth asteroids. Typed SwarmState contracts, dual RAG indices, per-event SSE observability, Three.js orbital visualization. Stack: Angular 21 signals-first, TypeScript strict, Express 5, Supabase + pgvector, Claude Sonnet, Voyage AI.
  - **ChronoQuizzr** — AI-powered geography trivia game. Generate → Adversary → Rewrite multi-agent pipeline. Haversine + exponential decay scoring. Stack: React 19, Express, Claude Haiku.
  - **Poster Pilot** — Multimodal RAG platform indexing 5,000+ historical posters from DPLA. CLIP embeddings, Reciprocal Rank Fusion, grounded SSE chatbot with confidence scoring + human handoff. 253 tests, 99.5% coverage. Stack: React 19, Express 5, Supabase + pgvector, CLIP via Replicate, Claude Sonnet.

- **Session-recovery note.** The Claude Code conversation that produced this Experience-section work crashed at ~15:32 with a 529 Overloaded API error coinciding with a VS Code update. The work itself was already pasted into LinkedIn before the crash. The transcript was recovered from the on-disk session file (`b46cebb3-a04b-4374-a91e-9ffa5020e1e2.jsonl`) and reconstructed in a fresh session, where this log entry was written. The state was also saved to Claude's auto-memory before close to prevent re-reconstructing next time.

### May 7, 2026

Three shipping items today: Featured/Projects section, Headline revision, and a custom-generated Cover image. Pending Change #1 from May 6 is fully resolved.

- **Featured / Projects section completed.** All four live deployments added as link-type Featured items, ordered to land on the user's preferred display sequence (Wildlife Sentinel first → Asteroid Bonanza → ChronoQuizzr → Poster Pilot last). LinkedIn's Featured section displays newest-added items first, so the cards were added in reverse-priority order: Poster Pilot first, then ChronoQuizzr, Asteroid Bonanza, and finally Wildlife Sentinel. Display order verified post-add. Each card has a custom title and ~3-sentence description pulled from this profile doc.

  *Reasoning for the user's preferred order:* Wildlife Sentinel is the most technically sophisticated project (Redis Streams pipeline, Refiner/Evaluator loop, 470 tests, PostGIS on 750 IUCN species) and the strongest single recruiter signal. Asteroid Bonanza is second strongest (multi-agent platform, dual RAG, Three.js orbital viz). ChronoQuizzr and Poster Pilot are both solid but less differentiated — they sit later so they don't dilute the lead.

- **Headline revised.** Closing tagline `Building production LLM applications` was replaced with `github.com/sjtroxel`. New full headline:
  > `AI Software Engineer | Multi-Agent Systems · RAG · TypeScript / Node.js | github.com/sjtroxel`

  *Reasoning:* the original tagline had become redundant — the Featured section now shows four production deployments with thumbnails, so the work itself proves "production LLM applications" without the headline needing to claim it. Putting the GitHub URL in the headline solves a separate problem: there's no native LinkedIn way to surface a GitHub link prominently for free accounts. Creator Mode (which would allow a link directly under the headline) is no longer available on this account — it has been deprecated for many users and is not present in any settings panel. The Custom Button feature that places a clickable CTA under the headline is paywalled to LinkedIn Premium ($30+/month). Embedding the URL in the headline text is the free workaround that ensures the GitHub link surfaces in every place the headline does (search results, post bylines, comment metadata, recruiter previews) — at the cost of not being clickable in those contexts.

- **Cover image custom-generated and uploaded.** First custom cover image, replacing the default solid-color LinkedIn template. Concept: silhouetted engineer in a starship cockpit gazing at an inverted biolumescent jungle planet hanging above, with translucent topographic contours and orbital trajectory lines overlaying a deep starfield. Lower-left of frame is intentionally dark/atmospheric so the profile photo (which overlays that area) does not obscure key content. Saved as `next-project-planning/Firefly2.jpg` (3072×768, 4:1 aspect ratio, ~520 KB).

  *Generation tooling:* Adobe Firefly free tier. Three iterations: first with Gemini 3.1 (Nano Banana 2) for a baseline, second with Flux 2 to compare aesthetics, third with Flux 2 again on a refined prompt that dropped a problematic visual element. Flux 2 was the winning model for cinematic sci-fi illustration (Gemini was strong on color palette but produced a more dim/conventional console; Flux landed the dramatic inverted-planet composition and a clean dark lower-left). Generative Expand was then used to widen the chosen image from 16:9 to 4:1 without losing vertical content.

  *Concept origin (private creative seed):* the image was inspired by *The Nth Degree* (Star Trek: TNG, S4E19), specifically the scene of Lt. Barclay augmented at a console — an emotional anchor for the user, who connects the parallel to using AI to expand his own capability. Earlier prompt iterations included a literal cyan beam from console to the figure's head to render the neural-interface motif. Both models struggled to render this gracefully (Gemini's beam was ambiguous; Flux's looked, in the user's words, "like a stream of urine into the toilet"). Decision was made to drop the literal beam and let the augmented-mind feeling carry through composition alone — figure dwarfed by a vast organic-cosmic vista, contemplative pose, hands at sides. Recruiters see *engineer at the controls of something vast.* The Barclay seed is preserved as private meaning, not as a recognizable element.

  *Themes pulled from the portfolio:* the biolumescent jungle planet echoes Wildlife Sentinel (PostGIS species data, conservation domain). The topographic contours and orbital trajectories echo Asteroid Bonanza (NASA orbital data, Three.js viz) and the maps theme that runs through Wildlife Sentinel and ChronoQuizzr. Single image, multiple project signals — without redundantly re-showing the project thumbnails that already appear in Featured and in the AI Engineer Experience entry's media cards.

### May 8, 2026

The original LinkedIn rebuild scope is now fully complete. Five shipping items today: Education section, removal of past-life graduation dates, profile URL verification, About / Summary section, and Open to Work activation. Pending Change #1 from May 7 is resolved; three of four optional polish items from May 7 are also resolved (only Certifications remains).

- **Education section completed.** Two Codefi entries added as minimal Education records (school + program name + dates only; description, activities, and grade fields left blank). Deliberate low-cognitive-load choice — extra fields would have duplicated the Experience entry without adding recruiter-search value:
  - Codefi — `Codefi CodeLabs Full-Stack Web Development (Bootcamp)`, Jan 2025 – Oct 2025
  - Codefi — `AI Engineering & Skills Training: Prompt-to-Product & AI Masterclass`, Jan 2026 – Present

  *Reasoning for adding Education entries despite duplication with the Experience description:* recruiters filter on Education separately from Experience. LinkedIn does not penalize the duplication. ~5 minutes of work for measurable recruiter-search lift.

  *Note on the AI program wording:* the Education entry uses "AI Engineering & Skills Training" while the Experience entry uses "AI Skills Training." Slight inconsistency. The Education wording is actually stronger because "AI Engineering" is a higher-value search keyword. Optional future cleanup: update the Experience entry to match.

- **Graduation dates removed from past-life Education entries (IU and SMU).** Both entries previously displayed graduation years (2009 IU B.A., 2012 SMU J.D.) and the IU activities line included Olympic Trials 2008 and the Big 10 Champions year. Dates removed from both entries before any About-section work began. Activities line preserved on the IU entry; date references inside it removed.

  *Reasoning:* age signaling. The user is positioning toward AI engineering roles where age bias in tech hiring (real, well-documented) cuts against. Removable dates can be reconstructed by anyone determined to dig, but the casual recruiter-skim view no longer leads with mid-2000s timestamps. This decision was made independently by the user before pasting the Education section into the conversation for review.

- **Profile URL confirmed.** Already in clean form: `www.linkedin.com/in/sjtroxel`. No action needed.

- **About / Summary section posted.** Pending Change #1 from May 7 is fully resolved. The session arc to get here was substantial. The user flagged this section as the hardest and approached it with explicit anxiety on two axes:
  - **Past-life identity exposure:** what people from SMU, IU Bloomington, and Indiana Swimming would think when they saw the rebuild. The "even though I shouldn't care" framing was pushed back on as not a flaw to override but the real cost of having had real prior versions of oneself.
  - **The capture problem:** the user's stated belief that no About section can really capture them. Resolution path: explicitly reframe the About as functional / recruiter-facing rather than capture-the-person. The About's job is to make a stranger click "message," not to summarize a life.

  Final posted version is the "with two flavor details" variant — 3 paragraphs, ~725 chars, well under half of LinkedIn's 2,600 limit. Stored in `next-project-planning/LINKEDIN_ABOUT_DRAFTS.md` along with the iteration history (which preserves the longer ~1,470 char first draft and the three shorter alternatives at ~250 / ~235 / ~580 chars). Final wording:

  > I'm an AI Software Engineer building production multi-agent and RAG systems in TypeScript. Four live deployments are in the Featured section below.
  >
  > Of the four, the strongest is a 24/7 autonomous wildlife crisis monitoring platform: a five-agent AI swarm on a Redis Streams pipeline with a Refiner/Evaluator loop that scores its own predictions against real outcomes and rewrites its agent prompts when accuracy drops. Close behind it is a four-agent intelligence platform that analyzes 35,000+ near-Earth asteroids with dual RAG indices, per-event SSE observability, and Anthropic tool use giving each agent real NASA API access at runtime.
  >
  > Looking for a remote AI engineering role at a company shipping production LLM systems.

  *Iteration notes:* the ~1,470 char first draft was set aside for being too long and duplicating the Experience entry's "How I Work" / project-list / Heritage-Odyssey content. A "six live deployments" count error (correct count is four — the four in Featured) was caught by the user mid-iteration and corrected. The opening of the middle paragraph was revised from "The strongest is..." to "Of the four, the strongest is..." after the user noted the unclear referent across the paragraph break, and "Close behind is..." was revised to "Close behind it is..." for the same reason. Two flavor details (Wildlife Sentinel + Asteroid Bonanza) replaced an earlier single-detail version once the user asked to expand.

  *AI tells stripped from final wording:* no em dashes, no emojis, no "Selected Projects:" template headers, no "no LangChain" framing (per existing feedback memory). The "How I work:" header that appears in the Experience entry was deliberately omitted from the About to avoid duplication.

  **About skill tags (5 tagged to the About section):** Multi-agent Systems, Retrieval-Augmented Generation (RAG), Large Language Models (LLM), Anthropic API, TypeScript. Same five as on the AI Software Engineer Experience entry — deliberately consistent. LinkedIn's auto-suggestions ("Juniors," "Software Infrastructure," "Software Industry," "Internet Software") were rejected: generic and junior-leaning, exactly the framing the rebuild positions against.

- **Open to Work activated.** Pre-existing setting was "Junior Software Engineer" alone (configured November 2025 and never touched), which produced zero inbound across six months. Replaced with:

  | Field | Value |
  |---|---|
  | Visibility | Public green frame (#OpenToWork) |
  | Locations | Remote (United States) |
  | Job types | Full-time |
  | Start date | Immediately |
  | Job titles (4) | Artificial Intelligence Engineer, Generative AI Engineer, Prompt Engineer, Artificial Intelligence Specialist |

  *Reasoning for visibility choice:* user opted for the public green frame for maximum recruiter visibility. Tradeoff acknowledged (visible to all connections including past-life ones; small minority of hiring managers read the frame as overly available). Reversible at any time.

  *Reasoning for the 4 titles:*
  - **Artificial Intelligence Engineer** — LinkedIn's #1 fastest-growing job title for young workers (2nd year running per Section 6). Primary target.
  - **Generative AI Engineer** — newer but established term; specifically catches LLM-focused postings.
  - **Prompt Engineer** — declining as a standalone role but still searched. Originally framed as "last resort" but kept after better alternatives didn't appear in LinkedIn's curated catalog.
  - **Artificial Intelligence Specialist** — fills the 4th slot. "Specialist" is neutral on seniority and catches AI postings from non-tech-first companies (consulting, healthcare, fintech) that don't use "Engineer" in the title.

  *Titles deliberately rejected:*
  - **Senior Software Engineer / Senior Artificial Intelligence Engineer** — honesty concern. The user's coding workflow is AI-augmented and a generic Senior SE interview process (whiteboard algorithm grinding without AI) would mismatch their strengths. The portfolio is sophisticated enough to defend a senior title in conversation, but the interview-format mismatch makes the title-search inbound a net negative. (Also: "Senior Artificial Intelligence Engineer" was not in LinkedIn's catalog regardless.)
  - **AI Operations Strategist / AI Implementation Strategist** — outside lane. These are business-consulting roles that involve no-code workflow tools (Zapier, n8n, Make.com) and stakeholder change-management, not engineering. User correctly identified the mismatch.
  - **Machine Learning Engineer** — requires Python (per Section 5). User does not have Python yet.
  - **AI Software Engineer / LLM Engineer / Senior AI Engineer / Founding Engineer / AI Developer / Applied AI Engineer / AI/ML Engineer / AI Solutions Engineer / AI Architect / NLP Engineer / Conversational AI Engineer** — none in LinkedIn's curated Open-to-Work catalog at the time of this session. LinkedIn does not publish the catalog publicly; titles must be discovered by typing and seeing what autocompletes.

### Pending changes (in priority order)

1. **Four technical blog posts (one per live deployment), starting 2026-05-09.** User flagged at end of May 8 session: planning to write four LinkedIn blog posts, one for each of the four deployed projects (Wildlife Sentinel, Asteroid Bonanza, Poster Pilot, ChronoQuizzr), at a cadence of one project every couple of days over a week or so. Each post will dive into how that project was built in technical depth. This directly addresses Section 8 priority #2 ("Write a technical blog post about Wildlife Sentinel or Asteroid Bonanza") and the visibility / public-artifacts gap flagged in Section 7. Workflow expectation: Claude will revisit each project's repo as needed at the start of each post to refresh context per project. Recommendation set by Codefi instructor: blog posts on LinkedIn are a high-leverage visibility move now that the profile basics are shipped.

2. **Skill-context tags for the remaining 19 skills (optional polish, partially started May 6, no urgency).** 5 of the 24 skills are tagged to the AI Software Engineer Experience entry. 5 are tagged to the About section (intentionally the same 5). The remaining 19 are still tagged only to the Codefi apprenticeship. Per LinkedIn: "75% of hirers value skill context." Project-specific skills (Vector Databases, pgvector, Redis, Anthropic Claude, etc.) could be re-tagged from Codefi to the self-directed entry over time.

### Optional polish items (out of original scope)

- **Certifications section.** Codefi graduation certificates (CodeLabs, Prompt-to-Product, AI Masterclass) could be added with dates as separate certification entries — if the user has the PDFs.

(The other items from the May 7 optional polish list are now resolved: "Open to Work" toggle ✓ activated 2026-05-08, Education section detail ✓ added 2026-05-08, Profile URL customization ✓ verified clean 2026-05-08.)

### Notes on cadence

LinkedIn rebuild went from "anxiety-blocked, profile substantively empty" on 2026-05-05 to "fully shipped, recruiter-ready, Open to Work active" on 2026-05-08. Four sessions over four days. The original anxiety was real and the small-wins-per-session pacing was correct.

Phase shift now: from profile-building (recruiter-facing static content) to visibility-building (recruiter-facing dynamic content via blog posts). The four-post series planned for the week of 2026-05-09 is the first execution of this phase.

---

*Last updated: May 8, 2026 (added Section 10 May 8 entry — Education section completed with two minimal Codefi entries; IU and SMU graduation dates removed for age-signaling reasons; Profile URL confirmed clean; About / Summary section drafted across multiple iterations and posted as the ~725-char "two flavor details" variant with 5 skill tags; Open to Work activated with public green frame and 4 AI-tilted job titles; Pending Change #1 from May 7 resolved; three of four May 7 optional polish items resolved (only Certifications remains); Pending changes list rewritten with the four-post blog series as new top item)*
*Previous update: May 7, 2026 (added Section 10 May 7 entry — Featured/Projects section completed with all 4 live deployments in correct display order; Headline revised to swap "Building production LLM applications" tagline for github.com/sjtroxel URL since Creator Mode is no longer available on free tier and Custom Button is Premium-only; Cover image custom-generated via Adobe Firefly Flux 2 and uploaded — first custom banner replacing the default; Pending Change #1 from May 6 resolved; Pending Changes list re-numbered; Optional polish items section added)*
*Earlier: May 6, 2026 (added Section 10 May 6 entry — Codefi Experience entry refined with "Student Software Engineer" title and full-arc description; new self-directed "AI Software Engineer" Experience entry added with all locked-in fields, 5 tagged skills, final description, and 4 media cards; Pending Changes #3 and #5 from May 5 resolved; Pending Changes list re-numbered)*
*Earlier: May 5, 2026 (added full Codefi training arc context for 2025 CodeLabs and Prompt-to-Product, added Project 7 — Heritage Odyssey, Phase 1 complete; added current LinkedIn profile starting state; added Section 10 LinkedIn Update Log with first headline change and Skills section rebuild — 24 skills added, all tagged to Codefi apprenticeship; flagged self-directed Experience entry as a near-term task)*
*Initial: April 30, 2026 (initial doc)*
*Next update: After the first blog post is drafted, after Heritage Odyssey Phase 2 ships, or after the first job offer — whichever comes first.*
