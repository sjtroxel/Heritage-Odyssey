# Phase 12A Implementation: Python FastAPI Evaluation Microservice (Depth Path)

> **Status: NOT STARTED.** Companion to the spec [`PHASE_12A_PYTHON_EVAL_SERVICE_DEPTH.md`](PHASE_12A_PYTHON_EVAL_SERVICE_DEPTH.md). The spec says *what* and *why*; this doc says *how*, in build order, grounded in the actual code as of 2026-05-29 (end of Phase 11A).
>
> **How to use this doc:** Work top to bottom. Each step lists the real files to touch, the actual current signatures, the exact change, and a **"What you're learning"** note (this doc doubles as the user's reading material — see the Learning note at the end). Run the existing CI gate (`npm run typecheck && npm run lint && npm run test`) after each step that touches the Node side. The Python side has its own gate (`pytest`).
>
> **Scope discipline (lock condition):** Steps marked **[CORE]** ship Phase 12A. Steps marked **[STRETCH — droppable]** are cut the moment they threaten the timeline. The eval suite is fully functional as a local + CI tool without the stretch steps.

---

## ⚠️ Read first: inconsistencies between the design spec and the live code

The design spec was written before 11A landed and contains several details that **do not match the actual code**. Do not copy the spec's snippets verbatim. These are the corrections, verified against the code on 2026-05-29:

1. **The SSE `complete` event field is `text`, not `finalScript`.**
   Spec § 4.2 promptfoo `responseParser` reads `output.finalScript`. The actual event (`narrativeService.ts:117`) is:
   ```ts
   type CompleteEvent = { type: 'complete'; text: string };
   type HandoffEvent  = { type: 'handoff'; package: HandoffPackage };
   ```
   The promptfoo provider must consume the **SSE stream** and return the `complete` event's `.text`. There is no `finalScript` on the wire.

2. **`/api/narrative/generate` returns an SSE stream, not JSON.** promptfoo's stock `http` provider expects a parseable body. A plain `responseParser` will not work against `text/event-stream`. **You must write a custom provider** (a small JS or Python script promptfoo calls) that opens the stream, accumulates events, and returns `{ output: <complete.text> }` — or, for the handoff test case, `{ output: { type: 'handoff' } }`. See Step 8.

3. **The rate limiter is GLOBAL, not per-AI-endpoint.** `server/src/app.ts:29` does `app.use(limiter)` across the whole app (`windowMs`/`max` defined at `app.ts:23`; a second limiter lives in `voiceRoutes.ts:15` at 10/10min). A 15+ case promptfoo run **will exhaust the limit and start getting 429s mid-suite.** This is the single most likely thing to silently wreck the eval run. Fix in Step 8 (eval bypass via a `skip` predicate keyed on a secret header, or run promptfoo against a local instance).

4. **`requirements.txt` versions in the spec are wrong/incompatible.** Spec § 8 lists `ragas==0.1.21`, `langchain==0.3.0`, `langchain-openai==0.2.0`, `langsmith==0.1.98`. The **working Phase 6 stack** (`evaluation/requirements.txt`, proven against the golden set) is:
   ```
   ragas==0.1.9
   langchain==0.1.20
   langchain-core==0.1.53
   langchain-community==0.0.38
   langchain-openai==0.1.7
   langsmith==0.1.147
   trulens-eval==2.8.0
   trulens-providers-openai==2.8.0
   ```
   `langchain` 0.1.x → 0.3.x is a breaking major. **Reuse the proven 0.1.x pins** for anything that touches Ragas scoring. Do not adopt the spec's aspirational pins or the Phase 6 scorers break. (FastAPI/Pydantic/uvicorn can be current — they don't interact with the langchain line.)

---

## Current State Baseline (verified 2026-05-29)

| Item | Current State | Phase 12A touches it? |
| :--- | :--- | :--- |
| `evaluation/` Python venv | Exists (Phase 6): Ragas + TruLens against golden set; `main.py` loads env via `load_dotenv(dotenv_path=env_path, override=True)` | Reuse pins + port scorers — Step 4 |
| `eval_scores` table | **Does not exist** | Add via Drizzle — Step 1 |
| DB schema source of truth | Drizzle (`server/src/db/schema.ts`), migrations in `server/drizzle/` | Add table here — Step 1 |
| `env.ts` validation | `z.object({...}).safeParse(process.env)` — **non-strict** (unknown keys stripped, not rejected) | LangSmith vars need NO change here — Step 7 |
| Rate limiter | **Global** `app.use(limiter)` at `app.ts:29` + a second limiter in `voiceRoutes.ts` | Add eval bypass — Step 8 |
| SSE events | `agent_step` / `complete {text}` / `handoff {package}` — `narrativeService.ts:108-120` | Parse in provider — Step 8 |
| CI | Node-only (`.github/workflows/ci.yml`): typecheck → lint → test → coverage; secret scan; `npm ci` | Add Python job + Promptfoo gate — Steps 8-9 |
| `DATABASE_URL` | Neon; may carry `channel_binding=require` | psycopg2 trap — Step 6 |
| `evaluation-service/` | **Does not exist** | Create — Step 2 |
| Root `package.json` scripts | `eval`, `eval:dashboard`, `eval:trace` exist; **no** `eval:prompts`, **no** `eval:service` | Add — Steps 5, 8 |

---

## Step 0 — Pre-flight: account, venv, env [CORE]

**Human task (do now — instant, no approval wait):**
Create a LangSmith account at [smith.langchain.com](https://smith.langchain.com) → Settings → API Keys → create key. Copy it.

**Python environment** — the new service gets its **own venv** (do not reuse `evaluation/venv`; different dependency surface):
```bash
cd evaluation-service          # after Step 2 creates the dir
python3.12 -m venv venv
venv/bin/pip install -r requirements.txt
```

**Env vars** — real keys live in `server/.env` (per the "Multiple .env files" trap in `CLAUDE.md`). The Python service must load them with an **explicit path + `override=True`**, exactly like `evaluation/main.py:13`:
```python
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / "server" / ".env", override=True)
```
Add to `server/.env` (and Railway Node service env, Step 7):
```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<your LangSmith key>
LANGCHAIN_PROJECT=heritage-odyssey-production
EVAL_BYPASS_TOKEN=<random 32+ char string>     # used by Step 8 rate-limit bypass
```

> **What you're learning:** Python venvs are per-project dependency sandboxes (like `node_modules` but activated, not auto-resolved). The `load_dotenv` explicit-path pattern is here because Python's CWD-relative `.env` discovery silently finds nothing when run from a different directory — the documented HO trap.

> **No `env.ts` change needed for LangSmith.** `env.ts` uses a non-strict `z.object`, so extra keys in `.env` are ignored, and the LangChain SDK reads `LANGCHAIN_*` straight from `process.env`. Adding them to the Zod schema is optional polish, not required for tracing to work.

---

## Step 1 — `eval_scores` table via Drizzle (NOT Python) [CORE]

**Decision locked:** the DB schema has **one** source of truth — Drizzle. The Python service reads/writes this table but must **never** create or migrate it. Two migration systems against one Neon DB = drift and pain.

Add to `server/src/db/schema.ts` (match the existing `uuid().primaryKey().defaultRandom()` + `doublePrecision` style):
```ts
import { pgTable, text, timestamp, uuid, doublePrecision } from 'drizzle-orm/pg-core';

export const evalScores = pgTable('eval_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: text('run_id'),                       // LangSmith run id, nullable
  query: text('query').notNull(),
  narrativeText: text('narrative_text').notNull(),
  faithfulness: doublePrecision('faithfulness'),
  answerRelevancy: doublePrecision('answer_relevancy'),
  contextRecall: doublePrecision('context_recall'),
  historicalGrounding: doublePrecision('historical_grounding'),
  emotionalResonance: doublePrecision('emotional_resonance'),
  citationCoverage: doublePrecision('citation_coverage'),
  overall: doublePrecision('overall'),
  modelUsed: text('model_used'),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
});
```
Then:
```bash
cd server && npx drizzle-kit generate    # inspect the generated SQL before applying
cd server && npx drizzle-kit push        # apply to Neon
```

> **What you're learning:** Drizzle floats are `doublePrecision`, not a `float` helper. `drizzle-kit generate` writes a migration file; `push` applies it. Always read the SQL between the two — a stray column rename can generate a destructive `DROP`.

---

## Step 2 — Scaffold `evaluation-service/` (FastAPI skeleton) [CORE]

```
evaluation-service/
├── main.py                 # FastAPI app + load_dotenv + router includes
├── routers/
│   ├── __init__.py
│   ├── health.py           # GET /health → {"status": "ok"}
│   └── eval.py             # (Step 5)
├── models/
│   ├── __init__.py
│   └── schemas.py          # (Step 3)
├── services/
│   ├── __init__.py
│   ├── scorer.py           # (Step 4)
│   ├── db.py               # (Step 6)
│   └── langsmith.py        # (Step 7, optional feedback push)
├── tests/
│   └── test_health.py
├── requirements.txt        # see corrected pins below
├── .env.example
└── Dockerfile              # (Step 10, stretch)
```

`requirements.txt` (FastAPI current; langchain line pinned to the proven Phase 6 versions):
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.8.0
pydantic-settings==2.4.0
httpx==0.27.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
openai==1.45.0
ragas==0.1.9
langchain==0.1.20
langchain-core==0.1.53
langchain-community==0.0.38
langchain-openai==0.1.7
langsmith==0.1.147
pytest==8.3.0
pytest-asyncio==0.24.0
```
**Done when:** `venv/bin/uvicorn main:app --reload --port 8000` serves `GET /health → 200`.

> **What you're learning:** FastAPI apps are an `app = FastAPI()` instance with routers mounted via `app.include_router()`. `uvicorn` is the ASGI server (the `node server.ts` equivalent). `__init__.py` files mark directories as importable packages.

---

## Step 3 — Pydantic schemas [CORE]

`models/schemas.py` — `NarrativeScores` (6 dimensions + `overall`) and `EvaluationResult`, per spec § 5.2. Use Pydantic v2 (`BaseModel`, typed fields). Add a request model:
```python
class EvaluateRequest(BaseModel):
    query: str
    narrative_text: str
    retrieved_documents: list[str] = []
    ancestor_profile_id: str | None = None
    run_id: str | None = None
```

> **What you're learning:** Pydantic is runtime-validated typing — the Zod of Python. FastAPI auto-validates request bodies against these models and auto-generates OpenAPI docs at `/docs`. This is the closest Python analog to the `shared/` TS types you already use.

---

## Step 4 — Scorers [CORE]

`services/scorer.py`. Three custom scorers (spec § 6) + the three Ragas metrics.

- `historical_grounding_score(narrative)` — pure regex/heuristic (deterministic; easy to unit-test).
- `citation_coverage_score(narrative, retrieved_docs)` — pure Python n-gram overlap (deterministic).
- `emotional_resonance_score(narrative, client)` — **async** GPT-4o-mini LLM-as-judge.
- Ragas `faithfulness`, `answer_relevancy`, `context_recall` — **reuse the Phase 6 invocation pattern from `evaluation/main.py`** (same 0.1.x API). Use `Dataset.from_list(...)` not `from_pandas` — that's a recorded Phase 6 gotcha.

`overall` = weighted average (document the weights in a comment).

**Unit tests now** (`tests/test_scorer.py`): cover the two deterministic scorers with fixed inputs/expected outputs. Mock the OpenAI client for the resonance scorer (assert it parses a `{"score": N}` JSON response and normalizes to 0-1).

> **What you're learning:** `async def` + `await` is Python's async model; the OpenAI SDK exposes `AsyncOpenAI`. Deterministic-vs-LLM scorer split is a real eval-engineering pattern: cheap deterministic gates run on every case, expensive LLM-judge scores run where nuance matters.

---

## Step 5 — Eval endpoints [CORE for /narrative + /batch; /golden-dataset is STRETCH]

`routers/eval.py`:
- `POST /evaluate/narrative` → runs all 6 scorers, persists via Step 6, returns `EvaluationResult`. **[CORE]**
- `POST /evaluate/batch` → list in, list + aggregate out. **[CORE]**
- `GET /scores/history?days=30` → reads `eval_scores`. **[CORE]** (this is the trend data; the *endpoint* is core, a UI for it is Step 11 stretch.)
- `GET /golden-dataset`, `POST /golden-dataset` → **[STRETCH — droppable].** The golden set already lives as a file in `evaluation/dataset/`; an HTTP CRUD over it earns no signal.

Add root script: `"eval:service": "cd evaluation-service && venv/bin/uvicorn main:app --port 8000"`.

---

## Step 6 — DB persistence [CORE]

`services/db.py` — psycopg2 connection to `DATABASE_URL`, INSERT into `eval_scores`, SELECT for history.

> **⚠️ Neon trap (from `CLAUDE.md`):** `DATABASE_URL` may include `channel_binding=require`. psycopg2 can fail auth on it. If you get auth errors, strip that parameter from the URL the Python service uses (the Node/Drizzle side handles it fine; psycopg2 is the fussy one). Do **not** create the table here — it already exists from Step 1.

> **What you're learning:** parameterized queries (`cur.execute(sql, (a, b))`) — never f-string SQL (injection). `RETURNING id` gets the new row's id back in one round-trip.

---

## Step 7 — LangSmith integration [CORE — env vars; feedback push is STRETCH]

**Node side (zero code) [CORE]:** set on the **Railway Node service** (not the eval service):
```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<key>
LANGCHAIN_PROJECT=heritage-odyssey-production
```
Every `graph.invoke()` / `graph.stream()` then traces automatically via the LangChain callback system. **Done when:** a narrative generation in prod appears as a run in the LangSmith dashboard within ~5 min, with per-node latency and token cost.

**Eval-service side [STRETCH — droppable]:** `services/langsmith.py` pushes computed scores back onto runs via `client.create_feedback(run_id=..., key="overall_quality", score=...)`. Nice-to-have; the scores already persist in `eval_scores` regardless.

> **What you're learning:** LangChain's tracing is callback-based — set three env vars and instrumentation activates with no code change. This is the cleanest "production observability" interview answer you have; make sure you can explain *why* it needs no code (the callback handler reads `LANGCHAIN_*` at import).

---

## Step 8 — Promptfoo CI regression suite [CORE] — highest-risk step

Install: `npm install --save-dev promptfoo`. Add root script `"eval:prompts": "promptfoo eval --config promptfoo.yaml"`.

**Three things the spec gets wrong here — handle all three:**

1. **Custom provider, not stock `http`.** `/api/narrative/generate` is SSE. Write `promptfoo-provider.mjs` (or `.py`) that POSTs the query, reads the `text/event-stream`, accumulates events, and returns:
   - normal case: `{ output: <the 'complete' event's .text> }`
   - handoff case: `{ output: { type: 'handoff' } }` (so the handoff assert can match)
   Reference `promptfoo-provider.mjs` from `promptfoo.yaml` as the provider. Do **not** use `output.finalScript` — that field does not exist on the wire (`complete` carries `text`).

2. **Rate-limit bypass.** The global limiter (`app.ts:29`) will 429 the suite partway through. Add a `skip` predicate to the limiter that returns `true` when `req.header('x-eval-bypass') === process.env.EVAL_BYPASS_TOKEN`. Have the provider send that header. Keep the token a CI secret. (Alternative if you'd rather not touch prod middleware: run promptfoo against a **local** server instance — but that needs all API keys locally and still spends OpenAI/ElevenLabs credits.)

3. **`E2E_LIVE` gate.** This suite spends OpenAI credits and hits prod. Gate it exactly like Playwright (`if: env.E2E_LIVE == 'true'`), never on the default push path.

`promptfoo.yaml`: 15+ cases (happy path, obscure-era edge cases, the handoff case). Assertions: `contains-any` for keyword grounding, `llm-rubric` (threshold 3.5) for quality, `javascript` for length bounds. CI step (`.github/workflows/ci.yml`, mirror the existing test env block for secrets):
```yaml
- name: Promptfoo eval
  if: env.E2E_LIVE == 'true'
  run: npx promptfoo eval --config promptfoo.yaml --ci
  env:
    E2E_API_URL: ${{ secrets.E2E_API_URL }}
    EVAL_BYPASS_TOKEN: ${{ secrets.EVAL_BYPASS_TOKEN }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```
`--ci` exits non-zero on any failed assert → fails the build. That's the regression gate.

> **What you're learning:** an LLM eval harness is just: prompt → provider call → assertions. The hard part is never the assertions; it's faithfully capturing the system's real output (here: parsing SSE) and not letting infra (rate limits, credits) corrupt the run.

---

## Step 9 — pytest suite + Python in CI [CORE]

- `tests/test_health.py`, `tests/test_scorer.py` (Step 4), `tests/test_eval_endpoints.py` (use FastAPI `TestClient`; mock OpenAI + DB).
- Add a **separate CI job** (`.github/workflows/ci.yml`) — CI is Node-only today, so this is net-new surface:
  ```yaml
  python-eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r evaluation-service/requirements.txt
      - run: cd evaluation-service && python -m pytest
  ```
  Keep it on the default push path (it's fast and spends no credits — DB and OpenAI are mocked). The Promptfoo job (Step 8) stays `E2E_LIVE`-gated.

---

## Step 10 — Dockerfile + second Railway service [STRETCH — droppable]

Dockerfile per spec § 8. Railway: add a second service rooted at `evaluation-service/`.

> The Node `--ignore-scripts` / husky trap does **not** apply (Python service, no `npm ci`). But Railway monorepo multi-service config is fiddly. **Fallback if it eats more than ~half a day:** skip the standing service entirely. The eval suite runs fine as the CI `python-eval` job + local `eval:service`. Nothing in the production hot path calls this service, so "it's deployed" earns little signal beyond "it runs." Drop without guilt.

---

## Step 11 — 30-day trend view [STRETCH — droppable]

The `GET /scores/history` endpoint (Step 5) already returns the data. A rendered dashboard is pure polish. If built, a single static page reading the endpoint is plenty; do not build admin auth, charts libraries, etc. for this.

---

## Done Criteria (Phase 12A ships when all CORE items are green)

- [ ] `eval_scores` table live on Neon via Drizzle migration (Step 1).
- [ ] `evaluation-service/` FastAPI app: `/health`, `POST /evaluate/narrative`, `POST /evaluate/batch`, `GET /scores/history` all working locally.
- [ ] All 6 scorers implemented; 3 deterministic ones unit-tested; Ragas 3 reuse Phase 6 pins.
- [ ] Scores persist to `eval_scores`; `/scores/history` reads them back.
- [ ] LangSmith tracing live in prod (runs visible in dashboard).
- [ ] `promptfoo.yaml` (15+ cases) + custom SSE provider + rate-limit bypass; CI gate `E2E_LIVE`-gated and red-on-regression.
- [ ] `python-eval` pytest job in CI, green on default push path.
- [ ] Existing Node CI gate still green (`typecheck && lint && test && coverage`).
- [ ] README updated: eval service, how to run it, the honest framing (offline trace eval, not a prod hot-path dependency).

**Stretch (drop if timeline pressured):** golden-dataset CRUD endpoints, LangSmith feedback push, Dockerfile + second Railway deploy, trend dashboard.

---

## Learning note (for the user, not Sonnet)

This doc is written so you can **read** the build as it lands, not so you have to hand-type it. The proven loop is the articulation pass you've already been doing on `graph.ts`: Sonnet builds a step, you read the resulting file, explain it back, I correct at a light dose. The "What you're learning" notes are the spotlight for each step. Python *fundamentals* (syntax, data structures, async, typing) come from the independent course track, not from typing into this codebase — see the chat for the three-track split. Hands-on-keyboard Python is the *next* project, after this one has given you a real FastAPI service to have read end-to-end.
