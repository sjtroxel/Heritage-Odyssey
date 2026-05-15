# Heritage Odyssey — Return Brief (May 2026)

Written 2026-05-14 at end of Phase 7. User away 7-10 days.
Paste this into a fresh Gemini or Claude session to restore full context.

---

## Project

Heritage Odyssey — a voice-activated genealogy research app. User speaks a family-history question, the system retrieves context from Pinecone (vector DB of Gutenberg books and OWID CSVs), an LangGraph agent swarm (Researcher → Narrator → Synthesizer nodes) generates a narrative, and ElevenLabs TTS reads it back.

Stack: TypeScript monorepo (client: Vite/React, server: Fastify/tsx), Pinecone, OpenAI (gpt-4o for agents, text-embedding-3-small for ingest), ElevenLabs TTS, Neon (PostgreSQL), Railway (deployment target).

---

## Where Things Stand

### Phase 7 — COMPLETE

All 14 steps of the Victorian UI overhaul and bug-fix phase are done:

- Bug fixes: index.css, Vite proxy, apiUrl utility, DB seed, useAuth hook (JWT storage + refresh-on-401), login screen
- Visual: Spectral font, cast-iron header, brass wordmark, CSS-only noise hero, interaction bar, AudioVisualizer, footer — all Victorian-themed
- Pipeline: Pinecone retrieval confirmed working; researcher.ts threshold lowered 0.65 → 0.5; Pinecone scores now log at INFO

Test suite: 51/51 passing (36 server + client).

### One open E2E issue (API account, not code)

After Pinecone retrieval succeeds, the pipeline returns HTTP 500. The server logs show `Narrative streaming error:` with no further detail. This is an OpenAI or ElevenLabs API credit/quota problem — retrieval worked, generation or TTS failed. Check both dashboards before touching any code.

### 8 uncommitted files

Everything in Phase 7 is uncommitted. First task on return:

```bash
git add client/src/App.tsx \
        client/src/components/AudioVisualizer.tsx \
        client/src/components/InteractionLayer.tsx \
        client/src/hooks/useAudioStream.ts \
        client/tests/hooks/useAudioStream.test.ts \
        server/src/agents/nodes/researcher.ts \
        server/tests/agents/graph.test.ts

git commit -m "Phase 7 complete: Victorian UI overhaul + pipeline fixes (Pinecone retrieval working)"

git add next-project-planning/prior-project-blog-posts/WILDLIFE_SENTINEL_BLOG.md
git commit -m "Wildlife Sentinel blog post draft"

git push
```

Then run `npm run ci` locally to confirm the CI gate passes before pushing to main.

### Known non-issues (do not debug)

- Nav links "Our Story", "Methodology", "Explore the Map", "Start My Odyssey" all go to href="#". These are Phase 8 scope and were never implemented. Not regressions.

---

## What's Next — Phase 8 (Deployment)

Phase 8 = Railway deployment. Key watchpoint from prior work:

**NODE_ENV=production on Railway cascades into npm ci skipping devDependencies**, which breaks husky/tsc/eslint. Fix is an installCommand override in railway.toml — audit ahead, don't whack-a-mole.

Also: channel_binding=require in the Neon connection URL may cause auth errors. If DB connection fails in prod, remove that parameter first.

---

## Blog Series Status

Posts 1-3 shipped to LinkedIn (ChronoQuizzr, Poster Pilot, Asteroid Bonanza). Post #4 (Wildlife Sentinel, series finale) is drafted in `next-project-planning/prior-project-blog-posts/WILDLIFE_SENTINEL_BLOG.md` but not yet published.

---

## Agent Setup

Gemini CLI is the primary coding agent. Claude Code is advisory/planning only — no codebase edits except `/next-project-planning/` (LinkedIn blog work) and `/project-specs/` docs. Both have memory of this project.
