from pydantic import BaseModel


class EvaluateRequest(BaseModel):
    query: str
    narrative_text: str
    retrieved_documents: list[str] = []
    ancestor_profile_id: str | None = None
    run_id: str | None = None


class NarrativeScores(BaseModel):
    faithfulness: float | None = None
    answer_relevancy: float | None = None
    context_recall: float | None = None
    historical_grounding: float | None = None
    emotional_resonance: float | None = None
    citation_coverage: float | None = None
    overall: float | None = None


class EvaluationResult(BaseModel):
    id: str
    query: str
    narrative_text: str
    scores: NarrativeScores
    model_used: str | None = None
    run_id: str | None = None
