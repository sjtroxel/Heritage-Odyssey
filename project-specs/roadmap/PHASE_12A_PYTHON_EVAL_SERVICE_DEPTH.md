# Phase 12A Plan: Python FastAPI Evaluation Microservice (Depth Path)

> **Status: PLANNED — alternative to [Phase 12B Velocity](PHASE_12B_EVAL_INFRA_VELOCITY.md). Choose one path after Phase 10.**
>
> This is the **Depth Path** for Phase 12. Full Python FastAPI evaluation microservice, deployed as a second Railway service, with its own `eval_scores` PostgreSQL table, six scoring dimensions, and HTTP API. Estimated ~3-4 weeks. Pair with [Phase 11A](PHASE_11A_GENEALOGY_IMPORT_DEPTH.md) for the full single-mega-project strategy. See [ROADMAP.md § Strategic Fork After Phase 10](ROADMAP.md) for the trade-off analysis.
>
> This phase closes the Python + Evals gap identified as Tier 1 in the May 2026 career strategy audit — but does it *inside* Heritage Odyssey rather than requiring a separate project. By Phase 12A, the portfolio story is: multi-agent LangGraph orchestration, per-user GEDCOM record retrieval, and a Python FastAPI evaluation layer that runs automated narrative quality regression on every deploy.

## 1. Objective

Heritage Odyssey already has a Python evaluation environment (Ragas + TruLens, Phase 6). Phase 12 makes it production-grade: a proper standalone Python FastAPI microservice for evaluation, Promptfoo for prompt regression testing, LangSmith for production tracing and cost monitoring, and a CI gate that fails the build if narrative quality drops below threshold.

This is the layer that separates "I built an AI app" from "I built a production AI system." It is also the deliberate answer to the Python gap: by Phase 12, Heritage Odyssey's stack spans TypeScript (Node/Express + React) and Python (FastAPI + LangChain eval tooling), and the interview answer to "do you work in Python?" is "yes — the evaluation and observability layer of Heritage Odyssey."

---

## 2. Why This Matters for Interviews

The standard junior-to-mid AI portfolio demonstrates: RAG, an agent pipeline, and some form of deployment. Evaluation infrastructure — specifically automated regression testing of AI outputs — is what distinguishes production AI engineering from demo building.

Interview differentiators this phase provides:

- **"How do you know your prompts didn't regress when you updated them?"** — Promptfoo golden dataset, ran on every commit.
- **"How do you monitor cost and latency in production?"** — LangSmith dashboard with token cost per trace, latency percentiles per node, error rate by agent.
- **"Can you work in Python?"** — Yes: FastAPI eval service, LangChain eval utilities, async Python patterns.
- **"How would you evaluate a generative system where there's no single right answer?"** — Human preference scores, semantic similarity against golden narratives, factual grounding score (does the narrative reference only documents actually retrieved?), citation coverage.

---

## 3. Architecture Overview

Phase 12 adds one new service to the monorepo: `evaluation-service/` — a Python FastAPI application.

```
heritage-odyssey/
├── server/          (Node.js/Express — existing)
├── client/          (React/Vite — existing)
├── shared/          (TypeScript types — existing)
├── evaluation/      (Python scripts — existing Phase 6, kept)
└── evaluation-service/   (NEW — Python FastAPI microservice)
    ├── main.py
    ├── routers/
    │   ├── eval.py       (evaluation endpoints)
    │   └── health.py
    ├── services/
    │   ├── promptfoo.py  (Promptfoo runner)
    │   ├── langsmith.py  (LangSmith client)
    │   ├── scorer.py     (custom scoring functions)
    │   └── golden.py     (golden dataset management)
    ├── models/
    │   └── schemas.py    (Pydantic models)
    ├── requirements.txt
    ├── Dockerfile
    └── .env.example
```

The evaluation service runs as a separate Railway service (or as a GitHub Actions job on push). The Node.js server optionally calls it post-generation to log quality scores.

---

## 4. Promptfoo: Prompt Regression Testing

**Promptfoo** is an open-source CLI and library for evaluating LLM outputs against a golden dataset. It supports running eval suites in CI and asserting that quality scores stay above threshold.

### 4.1 Installation and Setup

```bash
npm install -g promptfoo   # or as dev dependency in root package.json
```

Promptfoo configuration lives at `promptfoo.yaml` in the project root. It is run as part of the CI pipeline (`npm run eval:prompts`) and also callable manually.

### 4.2 Heritage Odyssey Promptfoo Configuration

```yaml
# promptfoo.yaml
description: Heritage Odyssey narrative quality regression suite

providers:
  - id: heritage-odyssey-narrative
    config:
      # Custom provider calls our /api/narrative/generate endpoint
      # and collects the narrative text output
      type: http
      url: ${E2E_API_URL}/api/narrative/generate
      method: POST
      body:
        query: "{{query}}"
      headers:
        Authorization: "Bearer ${EVAL_JWT_TOKEN}"
        Content-Type: application/json
      responseParser: |
        # Parse SSE stream and collect the 'complete' event's finalScript
        # (custom parser implemented in Python helper)
        output.finalScript

prompts:
  - id: current-prompt
    # The prompts ARE the researcher/synthesizer/narrator node prompts.
    # Promptfoo tests end-to-end output quality, not individual prompt isolation.
    label: Heritage Odyssey Narrative Pipeline v{{version}}

tests:
  - description: Polish immigrant 1880s
    vars:
      query: "Tell me about Polish immigrants arriving in Chicago during the 1880s"
    assert:
      - type: contains-any
        value: ["Polish", "Chicago", "1880"]
      - type: llm-rubric
        value: >
          The narrative should describe historical context of Polish immigration
          to Chicago in the 1880s. It should be emotionally resonant and
          historically grounded, not generic. Score 1-5.
        threshold: 3.5
      - type: javascript
        value: output.length > 200 && output.length < 3000

  - description: Irish famine emigration
    vars:
      query: "Describe the journey of an Irish family emigrating to New York during the 1840s famine"
    assert:
      - type: contains-any
        value: ["Ireland", "famine", "New York", "1840"]
      - type: llm-rubric
        value: >
          The narrative should reference the Great Famine (An Gorta Mór), the
          conditions of emigrant ships (coffin ships), and the experience of
          arriving in New York. Score 1-5.
        threshold: 3.5

  - description: Handoff path (vague query)
    vars:
      query: "Tell me about my family"
    assert:
      - type: javascript
        # Should receive a handoff response, not a narrative
        value: output.type === 'handoff' || output.includes('more specific')

  - description: Ellis Island period
    vars:
      query: "What was the experience of arriving at Ellis Island around 1900?"
    assert:
      - type: contains-any
        value: ["Ellis Island", "1890", "1900", "immigrant", "inspection"]
      - type: llm-rubric
        value: >
          Should describe the inspection process, the Great Hall,
          medical examination, and the emotional experience of arrival.
          Score 1-5.
        threshold: 3.5
```

Golden dataset: start with 10-15 test cases, expand to 30-50 over time. Cases should cover the full range: well-supported queries (strong Pinecone retrieval), edge cases (obscure eras/regions), handoff cases (too vague to answer), and personalized queries with ancestor profile data.

### 4.3 CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run Promptfoo evaluation
  if: env.E2E_LIVE == 'true'
  run: npx promptfoo eval --config promptfoo.yaml --ci
  env:
    E2E_API_URL: ${{ secrets.E2E_API_URL }}
    EVAL_JWT_TOKEN: ${{ secrets.EVAL_JWT_TOKEN }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

Gate: `--ci` flag makes Promptfoo exit non-zero if any assert fails. This fails the build. Use the `E2E_LIVE=true` env gate so it's opt-in (same pattern as Playwright E2E).

---

## 5. Python FastAPI Evaluation Service

The `evaluation-service/` microservice provides HTTP endpoints for running structured evaluations and returning scores. This is the Python component.

### 5.1 Core Endpoints

```python
# evaluation-service/routers/eval.py

POST /evaluate/narrative
  # Accepts: { query, narrativeText, retrievedDocuments, ancestorProfileId? }
  # Returns: EvaluationResult with per-dimension scores

POST /evaluate/batch
  # Accepts: list of narrative evaluation requests
  # Returns: list of EvaluationResult + aggregate stats

GET /golden-dataset
  # Returns the current golden dataset (test cases + expected quality thresholds)

POST /golden-dataset
  # Adds a new golden test case (admin only, JWT-gated)

GET /scores/history
  # Returns historical score trends (stored in PostgreSQL)
```

### 5.2 Scoring Dimensions

Each narrative evaluation produces a structured score object:

```python
class EvaluationResult(BaseModel):
    query: str
    narrative_text: str
    scores: NarrativeScores
    timestamp: datetime
    model_used: str

class NarrativeScores(BaseModel):
    # Ragas-style scores (reuse Phase 6 infrastructure)
    faithfulness: float          # 0-1: Does the narrative stick to retrieved docs?
    answer_relevancy: float      # 0-1: Does it address the query?
    context_recall: float        # 0-1: Are key retrieved facts used?
    
    # Custom scores
    historical_grounding: float  # 0-1: Contains specific dates, places, names?
    emotional_resonance: float   # 0-1: LLM-as-judge rubric for narrative quality
    citation_coverage: float     # 0-1: % of retrieved docs referenced in narrative
    
    # Aggregate
    overall: float               # Weighted average
```

### 5.3 LangSmith Integration

```python
# evaluation-service/services/langsmith.py
from langsmith import Client
from langsmith.evaluation import evaluate

class LangSmithService:
    def __init__(self):
        self.client = Client(api_key=settings.LANGSMITH_API_KEY)
    
    def log_evaluation(self, run_id: str, scores: NarrativeScores):
        """Push evaluation scores back to the LangSmith run as feedback."""
        self.client.create_feedback(
            run_id=run_id,
            key="overall_quality",
            score=scores.overall,
            comment=f"faithfulness={scores.faithfulness:.2f}, relevancy={scores.answer_relevancy:.2f}"
        )
    
    def fetch_recent_runs(self, project_name: str, limit: int = 50):
        """Retrieve recent production traces for offline eval."""
        return list(self.client.list_runs(
            project_name=project_name,
            limit=limit,
            filter="has_feedback = false"  # Only unevaluated runs
        ))
```

### 5.4 LangSmith in the Node.js Server

Add LangSmith tracing to the Node.js side. Set in Railway environment variables:

```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<your LangSmith key>
LANGCHAIN_PROJECT=heritage-odyssey-production
```

With these set, every `graph.invoke()` call automatically sends a trace to LangSmith. No code changes required beyond setting the env vars — LangGraph uses the LangChain tracing callback system.

The LangSmith dashboard then shows:
- Token cost per narrative generation (broken down by node)
- Latency percentiles per LangGraph node
- Error rate and handoff rate
- Full input/output for each run (useful for debugging poor narratives)

---

## 6. Custom Scoring Functions

Beyond Ragas metrics, implement domain-specific scores in Python:

### 6.1 Historical Grounding Score

```python
def historical_grounding_score(narrative: str) -> float:
    """
    Measures whether the narrative contains specific historical facts
    rather than generic statements. Proxied by presence of:
    - 4-digit years (1870-1920 range)
    - Named locations (detected via simple regex + known-places list)
    - Proper nouns (capitalized multi-word sequences)
    Higher specificity = higher score.
    """
    import re
    year_pattern = r'\b(18[6-9]\d|19[0-2]\d)\b'
    years = re.findall(year_pattern, narrative)
    
    # More than 2 specific years = well-grounded
    year_score = min(len(years) / 2, 1.0)
    
    # Named entity density (simple proxy: capitalized word pairs)
    words = narrative.split()
    cap_pairs = sum(1 for i in range(len(words)-1) 
                    if words[i][0].isupper() and words[i+1][0].isupper())
    entity_score = min(cap_pairs / 5, 1.0)
    
    return (year_score + entity_score) / 2
```

### 6.2 LLM-as-Judge Emotional Resonance Score

```python
async def emotional_resonance_score(narrative: str, client: AsyncOpenAI) -> float:
    """
    Uses GPT-4o-mini as a judge to score narrative quality on a 1-5 scale.
    Cheaper than GPT-4o for bulk eval; consistent rubric applied across all runs.
    """
    prompt = f"""
    You are evaluating an AI-generated historical narrative for quality.
    Score the following narrative on a scale of 1-5:
    
    1 = Generic, could describe any immigrant. No emotional depth.
    2 = Some historical detail but reads like an encyclopedia entry.
    3 = Reasonably evocative, some specific detail, moderately engaging.
    4 = Specific, emotionally resonant, grounded in historical context.
    5 = Exceptional — reads like literary historical fiction grounded in real records.
    
    Narrative:
    ---
    {narrative}
    ---
    
    Respond with ONLY a JSON object: {{"score": <1-5>, "reasoning": "<one sentence>"}}
    """
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0
    )
    result = json.loads(response.choices[0].message.content)
    return result["score"] / 5.0  # Normalize to 0-1
```

### 6.3 Citation Coverage Score

```python
def citation_coverage_score(narrative: str, retrieved_docs: list[str]) -> float:
    """
    Measures what fraction of retrieved documents contributed something
    to the narrative (loose: any 4+ character substring match).
    Prevents hallucination by penalizing narratives that ignore retrieved context.
    """
    if not retrieved_docs:
        return 0.0
    
    used = 0
    for doc in retrieved_docs:
        # Extract key phrases (4+ word n-grams) from the retrieved doc
        words = doc.lower().split()
        ngrams = [' '.join(words[i:i+4]) for i in range(len(words)-3)]
        if any(ngram in narrative.lower() for ngram in ngrams[:20]):
            used += 1
    
    return used / len(retrieved_docs)
```

---

## 7. Score History & Regression Tracking

Evaluation scores should be persisted so trends are visible over time. Add a `eval_scores` table to the existing schema:

```sql
eval_scores (
  id uuid PRIMARY KEY,
  run_id text,                    -- LangSmith run ID (if available)
  query text NOT NULL,
  narrative_text text NOT NULL,
  faithfulness float,
  answer_relevancy float,
  context_recall float,
  historical_grounding float,
  emotional_resonance float,
  citation_coverage float,
  overall float,
  model_used text,
  evaluated_at timestamp NOT NULL
)
```

The evaluation service writes to this table after every evaluation. A `GET /scores/history?days=30` endpoint returns trend data that can feed a simple admin dashboard.

---

## 8. Dockerfile for Evaluation Service

```dockerfile
# evaluation-service/Dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```python
# requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.8.0
pydantic-settings==2.4.0
langsmith==0.1.98
langchain==0.3.0
langchain-openai==0.2.0
ragas==0.1.21
openai==1.45.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
httpx==0.27.0
```

Railway deployment: add a second service in `railway.toml` pointing to the `evaluation-service/` directory.

---

## 9. Portfolio Presentation Value

By the end of Phase 12, the Heritage Odyssey stack spans two languages and three major technical domains:

**TypeScript (Node/Express + React):**
- Multi-agent LangGraph orchestration
- GEDCOM genealogy import + Google OAuth2 (third-party auth)
- Per-user Pinecone namespace management
- JWT auth + rate limiting + SSE streaming

**Python (FastAPI + LangChain eval tooling):**
- FastAPI microservice with async patterns
- Promptfoo golden-dataset regression suite in CI
- LangSmith production tracing (cost, latency, token usage per agent node)
- LLM-as-judge scoring (GPT-4o-mini evaluating GPT-4o outputs)
- Ragas metrics on genealogy-domain RAG outputs

**Infrastructure:**
- Monorepo with two deployment targets (Railway Node + Railway Python)
- GitHub Actions CI: typecheck → lint → tests → Playwright E2E (gated) → Promptfoo eval (gated)
- Pinecone with user-namespaced dynamic embeddings

This is the portfolio story: not "I built a RAG chatbot" but "I built a genealogy intelligence platform with production-grade evaluation infrastructure and real third-party record data."

---

## 10. Verification (Done Criteria)

- [ ] `evaluation-service/` FastAPI application created and running locally.
- [ ] `POST /evaluate/narrative` returns structured `EvaluationResult` with all 6 score dimensions.
- [ ] Faithfulness, answer relevancy, and context recall scores from Ragas ported into the service.
- [ ] Historical grounding, emotional resonance (LLM-as-judge), and citation coverage custom scorers implemented.
- [ ] LangSmith tracing active in production (Railway env vars set; runs appearing in LangSmith dashboard).
- [ ] LangSmith feedback logging: evaluation service pushes scores back to production traces.
- [ ] `eval_scores` table added to PostgreSQL; evaluation service writes scores after each eval.
- [ ] Promptfoo config (`promptfoo.yaml`) with 15+ test cases covering happy path, edge cases, and handoff path.
- [ ] Promptfoo CI gate: runs with `E2E_LIVE=true`, fails build if any assert fails.
- [ ] Evaluation service Dockerized and deployed as a second Railway service.
- [ ] `GET /scores/history` endpoint returns 30-day score trend data.
- [ ] Python service has its own pytest suite (minimum: endpoint integration tests + scorer unit tests).
