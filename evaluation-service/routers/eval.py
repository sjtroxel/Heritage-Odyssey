import os
from fastapi import APIRouter
from openai import AsyncOpenAI
from models.schemas import EvaluateRequest, EvaluationResult, NarrativeScores
from services import scorer, db

router = APIRouter()

_openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


async def _run_evaluation(req: EvaluateRequest) -> EvaluationResult:
    hist = scorer.historical_grounding_score(req.narrative_text)
    cite = scorer.citation_coverage_score(req.narrative_text, req.retrieved_documents)
    resonance = await scorer.emotional_resonance_score(req.narrative_text, _openai_client)
    ragas = scorer.ragas_scores(req.query, req.narrative_text, req.retrieved_documents)

    all_scores = {
        "faithfulness": ragas["faithfulness"],
        "answer_relevancy": ragas["answer_relevancy"],
        "context_recall": ragas["context_recall"],
        "historical_grounding": hist,
        "emotional_resonance": resonance,
        "citation_coverage": cite,
    }
    all_scores["overall"] = scorer.compute_overall(all_scores)

    row_id = db.insert_eval_score(
        query=req.query,
        narrative_text=req.narrative_text,
        scores=all_scores,
        model_used="gpt-4o",
        run_id=req.run_id,
    )

    return EvaluationResult(
        id=row_id,
        query=req.query,
        narrative_text=req.narrative_text,
        scores=NarrativeScores(**all_scores),
        model_used="gpt-4o",
        run_id=req.run_id,
    )


@router.post("/evaluate/narrative", response_model=EvaluationResult)
async def evaluate_narrative(req: EvaluateRequest):
    return await _run_evaluation(req)


@router.post("/evaluate/batch")
async def evaluate_batch(requests: list[EvaluateRequest]):
    results = [await _run_evaluation(req) for req in requests]

    score_keys = [
        "faithfulness", "answer_relevancy", "context_recall",
        "historical_grounding", "emotional_resonance", "citation_coverage", "overall",
    ]
    aggregate = {}
    for key in score_keys:
        vals = [v for r in results if (v := getattr(r.scores, key)) is not None]
        aggregate[key] = sum(vals) / len(vals) if vals else None

    return {"results": results, "aggregate": aggregate, "count": len(results)}


@router.get("/scores/history")
def scores_history(days: int = 30):
    rows = db.get_score_history(days=days)
    for row in rows:
        if row.get("evaluated_at"):
            row["evaluated_at"] = row["evaluated_at"].isoformat()
    return {"scores": rows, "count": len(rows)}
