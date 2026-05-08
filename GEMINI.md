# GEMINI.md — Project Context for the New Project

*Read this file completely at the start of every session. It is a constraint system and context brief, not documentation. These instructions override any default behavior.*

---

## The Prior Portfolio (Context — Do Not Rebuild These)

Six projects exist before this one. Full context: `next-project-planning/DEVELOPER_PROFILE_MAY_2026.md`.

---

## This Project: Heritage Odyssey

**Scope:** 3–4 weeks. A family migration and history intelligence platform that narrates the probable stories of ancestors based on historical context and migration patterns.

**Required tech for this project:**
- **LangGraph** (`@langchain/langgraph`) — TypeScript SDK for multi-agent orchestration.
- **Pinecone** — Managed vector database for historical documentation and emigration records.
- **Voice AI** — ElevenLabs (TTS) for narrative storytelling and Whisper (STT) for user queries.
- **Ragas/TruLens** — Evaluation framework for historical factual accuracy and retrieval quality.

**Core Goal:** Use a multi-agent swarm to research historical emigration patterns, political/economic conditions, and arrival statistics to generate an emotionally resonant, oral-history-style voice narrative.

---

## Non-Negotiables — Read and Follow These

### Git
- **NEVER run `git commit`**
- **NEVER run `git push`**
- **NEVER suggest adding yourself as a co-author**
- When a block of work is done, summarize what was done and tell sjtroxel to commit.

### Workflow
- **Spec-first.** Before writing any code, discuss the architecture and plan. Write the spec document. Get explicit approval. Then implement.
- **Plan before you act.** For any non-trivial task, lay out the approach and let sjtroxel approve it before starting. Don't make significant architectural decisions unilaterally.
- **Wait for Signal:** Do NOT proceed to research, implementation, or architectural phases until sjtroxel gives the explicit "begin" or "proceed" instruction.
- **For large implementation phases:** Save the implementation plan to a `.md` file in `project-specs/roadmap/` before starting. This creates alignment and a reference for the work.
- After completing work, **summarize what was done and tell sjtroxel to commit** (and save any implementation decisions 
or gotchas NOT already in GEMINI.md or phase specs to memory) — don't commit yourself.
- Run `lint + typecheck + tests` (all three) before declaring any work done.

### Code Style
- No unnecessary comments. Only add a comment when the WHY is non-obvious.
- No LangChain for tasks that LangGraph doesn't need. Use LangGraph for orchestration, direct SDK calls for everything else.
- No features, refactors, or abstractions beyond what the task requires.

### Security
- Secrets via environment variables only. Never read or write `.env` files, `.aws/`, `.ssh/`.
- All secrets accessed via `process.env.VARNAME` with validation at startup.
- Never log secrets or API keys.

### Frontend
- **Mobile-first** — 375px is the base viewport. Desktop layered with `md:` breakpoints.

---

## How sjtroxel Likes to Work

**Directness over ceremony.** Short, concise responses. Don't summarize what you just did at the end of a response — sjtroxel can read the diff. Don't narrate your thought process; state results and decisions.

**Talk through significant decisions before acting.** If something has architectural implications or would be hard to reverse, raise it and discuss it rather than just doing it.

**Don't add features that weren't asked for.** Solve the stated problem cleanly. Don't design for hypothetical future requirements.

**Emotional investment matters.** Projects built on genuine interest get finished. The subject of this project should be something worth caring about, not just a technical exercise.

**When stuck or uncertain, ask.** Don't resolve ambiguity unilaterally and hope it was right. A quick question is faster than a backtrack.

---

## Project Structure Convention (Use This)

```
new-project/
├── GEMINI.md                    ← this file
├── .gemini/
│   └── rules/                   ← domain behavioral rules (agents, testing, etc.)
├── project-specs/
│   ├── ROADMAP.md               ← master checklist, updated as phases complete
│   └── roadmap/                 ← per-phase detailed specs
├── server/                      ← npm workspace (Express 5 backend)
│   ├── src/
│   │   ├── app.ts               ← Express app, no listen()
│   │   ├── server.ts            ← calls listen()
│   │   └── ...
│   └── tests/
├── client/                      ← npm workspace (React frontend)
├── shared/                      ← npm workspace
│   ├── types.d.ts               ← shared types (.d.ts not .ts)
│   └── models.ts                ← AI model constants
└── next-project-planning/       ← (copied from Wildlife Sentinel — context only, not part of the build)
```

Monorepo with npm workspaces. Same pattern as Asteroid Bonanza and Wildlife Sentinel.

---

## Tech Stack Defaults for This Project

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript strict | `strict: true`, `noUncheckedIndexedAccess: true` |
| Module resolution | NodeNext | `.js` extensions on all relative imports |
| Backend | Express 5 | app.ts/server.ts split |
| Orchestration | LangGraph (`@langchain/langgraph`) | First use in this portfolio |
| Vector DB | Pinecone | `@pinecone-database/pinecone` |
| Voice (STT) | OpenAI Whisper | `openai` SDK, `audio.transcriptions.create()` |
| Voice (TTS) | ElevenLabs | `elevenlabs` SDK or direct HTTP |
| LLM | GPT-4o (Researcher + Narrator) / GPT-4o-mini (Synthesizer) | Via @langchain/openai, model strings in shared/models.ts |
| Embeddings | text-embedding-3-small | Via @langchain/openai, 1536 dimensions, same OPENAI_API_KEY |
| Evaluation | Ragas and/or TruLens | Standard eval tooling, not custom scoring math |
| Frontend | React 19 + Vite | Same patterns as prior projects |
| Styling | Tailwind CSS v4 (CSS-first `@theme {}`) | No `tailwind.config.js` |
| Testing | Vitest + Playwright | Same patterns as prior projects |
| Deployment | Railway (backend) + Vercel (frontend) | Same as prior projects |

---

## Secondary Goal: LinkedIn Presence & Portfolio Blog Posts

Building the project is the primary work, but there is a parallel career goal running alongside it: establishing a professional LinkedIn presence and writing technical blog posts for the four strongest prior projects.

---

## Session Start Checklist

At the start of every session, mentally confirm:
- [ ] Have you read GEMINI.md?
- [ ] Have you read the relevant phase spec before starting implementation?
- [ ] Is there a plan document for this phase, and has it been approved?
- [ ] Are you about to run `git commit` or `git push`? → Stop. sjtroxel does all git operations.

---

---
*This is a working document. Update it as the project evolves: add rules, correct things that turn out to be wrong, note important decisions made. The goal is that any future session — whether continuing with you or switching to a different AI tool — can pick up with complete context from reading this file.*

---
*Session verification note: Tooling test performed on May 3, 2026. Successfully confirmed file modification capabilities.*