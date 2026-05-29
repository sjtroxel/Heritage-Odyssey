# Phase 12B Plan: Evaluation Infrastructure (Velocity Path / Lean Cut)

> **Status: PLANNED — alternative to [Phase 12A Depth](PHASE_12A_PYTHON_EVAL_SERVICE_DEPTH.md). Choose one path after Phase 10.**
>
> This is the **Velocity Path** for Phase 12. Promptfoo for prompt regression in CI, LangSmith for production tracing via env vars (zero code), and an extended Python eval script in the existing `evaluation/` directory with LLM-as-judge and citation coverage scorers. Estimated ~1.5-2 weeks (vs ~3-4 weeks for the Path A FastAPI microservice). Pair with [Phase 11B](PHASE_11B_GENEALOGY_IMPORT_VELOCITY.md) for the full velocity-to-applying strategy. See [ROADMAP.md § Strategic Fork After Phase 10](ROADMAP.md) for the trade-off analysis.

## 1. Objective

Close the Python + Evals Tier 1 gap (from `project_next_steps_ai_engineer`) with the minimum work that gives interview-grade credibility on:

1. *"How do you know your prompts didn't regress when you updated them?"* — Promptfoo golden dataset, runs in CI.
2. *"How do you monitor cost and latency in production?"* — LangSmith dashboard, populated by env vars alone.
3. *"Can you work in Python?"* — Yes: extend the existing `evaluation/` Python suite with LLM-as-judge and custom scorers.

What's deliberately **not** built in Path B: a Python FastAPI microservice, a second Railway service, an `eval_scores` PostgreSQL table, HTTP API endpoints, or a 30-day trend dashboard. Those exist in Path A. The Velocity Path keeps the interview answers; it skips the infrastructure cost.

If the Python-microservice depth is desired, build it as its own separate portfolio project (the original Tier 1 advice: a new Python LangChain/LlamaIndex + FastAPI app with a Promptfoo eval suite, ~2-3 week sprint). That keeps the two-strong-projects portfolio shape rather than collapsing everything into HO.

---

## 2. What's kept vs cut from Path A

| Component | Path A (Depth) | Path B (Velocity) | Why |
| :--- | :--- | :--- | :--- |
| Promptfoo CI regression suite (~15 cases) | Yes | **Yes — kept** | The single highest-leverage interview answer |
| LangSmith production tracing | Yes (with feedback push from eval service) | **Yes — env vars only** | 90% of the value from 0% of the code |
| LLM-as-judge emotional resonance scorer | Inside FastAPI service | **In existing `evaluation/`** | Same Python skill demonstrated, no service overhead |
| Historical grounding scorer | Inside FastAPI service | **In existing `evaluation/`** | Same |
| Citation coverage scorer | Inside FastAPI service | **In existing `evaluation/`** | Same |
| Ragas (faithfulness, answer_relevancy, context_recall) | Yes | **Yes — already exists from Phase 6** | Already done |
| **FastAPI microservice** | Full app, routers, Pydantic schemas | **CUT** | A separate Python project gets more portfolio mileage than a service crammed into HO |
| **Second Railway service deployment** | Yes | **CUT** | Service overhead with no recruiter signal beyond "it runs" |
| **`eval_scores` PostgreSQL table** | Yes | **CUT** | LangSmith already stores per-run scores via the feedback API — duplicate work |
| **HTTP eval API (POST /evaluate/narrative etc.)** | Yes | **CUT** | The eval script is a CLI tool; no other system calls it |
| **30-day trend endpoint** | Yes | **CUT** | LangSmith dashboard shows trends |
| **pytest suite for the eval service** | Yes | **Tests for the new scorers** | Scaled down to match the scope |

---

## 3. Promptfoo CI Regression Suite

This is the most important deliverable in Path B. It's the answer to the interview question "how do you prevent prompt regressions?"

### 3.1 Setup

```bash
npm install --save-dev promptfoo
```

Add `promptfoo.yaml` at repo root with 15+ test cases covering happy path, edge cases, and handoff path. Schema and example test cases are identical to Phase 12A § 4.2 — that design carries over without change.

### 3.2 CI Gate

Identical to Phase 12A § 4.3 — gated by `E2E_LIVE=true`:

```yaml
- name: Run Promptfoo evaluation
  if: env.E2E_LIVE == 'true'
  run: npx promptfoo eval --config promptfoo.yaml --ci
  env:
    E2E_API_URL: ${{ secrets.E2E_API_URL }}
    EVAL_JWT_TOKEN: ${{ secrets.EVAL_JWT_TOKEN }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

`--ci` fails the build on any failed assert. This is the regression gate.

---

## 4. LangSmith Production Tracing

Zero code change. Three Railway environment variables:

```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<your LangSmith key>
LANGCHAIN_PROJECT=heritage-odyssey-production
```

With these set, every `graph.invoke()` call automatically traces to LangSmith via the LangChain callback system. The dashboard then shows:

- Token cost per narrative generation, broken down per LangGraph node
- Latency percentiles per node
- Error rate and handoff rate
- Full input/output for each run

This is the production-observability answer in interviews. It is also genuinely useful for debugging poor narrative outputs.

**This can be done at any time** — it does not need to wait for the rest of Phase 12B. Consider adding it during Phase 9 as a free upgrade once Phase 9 features are stable.

---

## 5. Extended Python Eval Suite in `evaluation/`

The existing `evaluation/main.py` (Phase 6, with Ragas + TruLens against the golden dataset) gets extended in place rather than rebuilt as a service. The skill demonstrated is identical; the infrastructure is much less.

### 5.1 New files in `evaluation/`

```
evaluation/
├── main.py                    (existing — extended)
├── dataset/                   (existing)
├── reports/                   (existing)
├── traces/                    (existing)
├── requirements.txt           (extended)
└── scorers/                   (new)
    ├── __init__.py
    ├── grounding.py           (historical_grounding_score)
    ├── resonance.py           (emotional_resonance_score via GPT-4o-mini)
    └── citation.py            (citation_coverage_score)
```

The scoring functions (`historical_grounding_score`, `emotional_resonance_score`, `citation_coverage_score`) are the same Python code from Phase 12A § 6.1-6.3 — they are extracted into modules in `evaluation/scorers/` rather than inside a FastAPI service.

### 5.2 Updated `main.py`

`main.py` is extended to call all six scorers (3 Ragas existing + 3 new) for each trace in `traces/` and emit a combined report in `reports/summary.json`. Run via the existing npm script:

```bash
npm run eval     # already wired to cd evaluation && venv/bin/python main.py
```

### 5.3 LangSmith Feedback Loop (optional, simpler than Path A)

Optionally, `main.py` writes scores back to LangSmith runs via the LangSmith Python SDK after computing them:

```python
from langsmith import Client
client = Client()
client.create_feedback(run_id=run_id, key="overall_quality", score=overall)
```

That's ~10 lines. No FastAPI service required. LangSmith then shows the scores in its existing UI; no `eval_scores` table needed.

---

## 6. What Path B Does Not Build (And Why That's OK)

**No FastAPI microservice.** If the "I built a Python web service" interview answer is needed, the better play is a separate small portfolio project — for example, a Python RAG-over-personal-documents app with FastAPI. That gives two distinct projects on the resume rather than one mega-project. See `project_next_steps_ai_engineer` Tier 1 for the original framing.

**No second Railway service.** Deployment overhead without recruiter signal. The CLI eval script in `evaluation/` is sufficient; Promptfoo handles the CI regression gate.

**No `eval_scores` PostgreSQL table.** LangSmith already persists per-run scores via the feedback API. Building a parallel table in HO's database is duplicate work.

**No HTTP eval API.** No other system calls it. The Node.js server does not need to talk to a Python eval service in production — production-quality scoring runs against captured traces, not in the hot path.

---

## 7. Verification (Done Criteria)

- [ ] `promptfoo.yaml` committed at repo root with 15+ test cases (happy path, edge cases, handoff)
- [ ] GitHub Actions CI runs Promptfoo with `E2E_LIVE=true` gate; build fails on regression
- [ ] LangSmith env vars set in Railway; traces appear in LangSmith dashboard within 5 minutes of next deploy
- [ ] `evaluation/scorers/grounding.py`, `resonance.py`, `citation.py` implemented and unit-tested
- [ ] `evaluation/main.py` extended to compute all six dimensions and write a combined report
- [ ] LangSmith feedback push from `main.py` working (scores visible in LangSmith UI per run)
- [ ] `npm run eval` runs end-to-end successfully against captured traces
- [ ] README updated to document the eval suite and how to run it

---

## 8. Time and Trade-Off Summary

| Dimension | Path A (Depth) | Path B (Velocity) |
| :--- | :--- | :--- |
| Estimated solo time | 3-4 weeks | 1.5-2 weeks |
| Promptfoo CI gate | Yes | Yes |
| LangSmith production tracing | Yes | Yes |
| LLM-as-judge scoring | Yes | Yes |
| Custom historical/citation/grounding scorers | Yes | Yes |
| FastAPI service + second Railway deployment | Yes | **No** |
| `eval_scores` table + 30-day trends | Yes | **No** (LangSmith covers it) |
| Recruiter-visible eval credibility | Maximum | ~90% of Path A |
| Frees time for a separate Python project | No | **Yes — ~1.5-2 weeks** |

The Path B trade: you give up the "two-language production system inside one repo" story but you can immediately invest the freed weeks into a separate Python + FastAPI project. That separate project demonstrates the same Python+FastAPI skill *and* gives you two strong portfolio entries instead of one. The original May 26 strategy advice favored this shape.
