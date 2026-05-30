import re
import json
from openai import AsyncOpenAI
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# Weights for overall score (renormalized over non-None scores at runtime)
_WEIGHTS = {
    "faithfulness": 0.25,
    "answer_relevancy": 0.25,
    "context_recall": 0.15,
    "historical_grounding": 0.20,
    "emotional_resonance": 0.10,
    "citation_coverage": 0.05,
}

_HISTORICAL_PATTERNS = [
    r"\b1[0-9]{3}\b",
    r"\b20[0-1][0-9]\b",
    r"\b(century|decade|era|period|age)\b",
    r"\b(emigrat|immigrat|migrat|journey|voyage|passage|crossing)\w*\b",
    r"\b(ship|vessel|port|harbor|haven)\b",
    r"\b(famine|plague|war|revolution|independence)\b",
    r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\b",
]

_RESONANCE_PROMPT = """Rate the emotional resonance of this historical narrative on a scale of 1 to 5.

1 = dry, purely factual, no emotional engagement
2 = minimal emotion, mostly factual
3 = moderate emotional engagement
4 = emotionally engaging, vivid, humanizing
5 = deeply resonant, transporting, powerfully humanizing

Narrative:
{narrative}

Respond with JSON only: {{"score": <integer 1-5>, "reason": "<one sentence>"}}"""


def historical_grounding_score(narrative: str) -> float:
    """Counts historical marker density as a 0-1 proxy for grounding (4+ hits = 1.0)."""
    hits = sum(
        1 for p in _HISTORICAL_PATTERNS if re.search(p, narrative, re.IGNORECASE)
    )
    return min(hits / 4.0, 1.0)


def citation_coverage_score(narrative: str, retrieved_docs: list[str]) -> float:
    """Bigram overlap between narrative and retrieved documents, normalized 0-1."""
    if not retrieved_docs:
        return 0.0

    def bigrams(text: str) -> set[str]:
        words = re.findall(r"\b\w+\b", text.lower())
        return {f"{words[i]} {words[i + 1]}" for i in range(len(words) - 1)}

    narrative_bg = bigrams(narrative)
    if not narrative_bg:
        return 0.0

    doc_bg: set[str] = set()
    for doc in retrieved_docs:
        doc_bg |= bigrams(doc)

    return len(narrative_bg & doc_bg) / len(narrative_bg)


async def emotional_resonance_score(narrative: str, client: AsyncOpenAI) -> float:
    """GPT-4o-mini LLM-as-judge: rates resonance 1-5, normalized to 0-1."""
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": _RESONANCE_PROMPT.format(narrative=narrative)}],
        temperature=0,
        max_tokens=100,
    )
    raw = response.choices[0].message.content or "{}"
    parsed = json.loads(raw)
    score = float(parsed["score"])
    return (score - 1) / 4.0  # normalize 1-5 → 0-1


def ragas_scores(
    query: str, narrative: str, retrieved_docs: list[str]
) -> dict[str, float | None]:
    """
    Runs Ragas faithfulness + answer_relevancy.
    context_recall requires ground_truth (not available at runtime) — always None.
    """
    if not retrieved_docs:
        return {"faithfulness": None, "answer_relevancy": None, "context_recall": None}

    dataset = Dataset.from_list(
        [{"question": query, "answer": narrative, "contexts": retrieved_docs}]
    )
    result = evaluate(dataset, metrics=[faithfulness, answer_relevancy])
    scores = dict(result)
    return {
        "faithfulness": scores.get("faithfulness"),
        "answer_relevancy": scores.get("answer_relevancy"),
        "context_recall": None,
    }


def compute_overall(scores: dict[str, float | None]) -> float:
    """Weighted average over non-None scores, renormalized to available weight."""
    weighted_sum = 0.0
    total_weight = 0.0
    for key, weight in _WEIGHTS.items():
        val = scores.get(key)
        if val is not None:
            weighted_sum += val * weight
            total_weight += weight
    return weighted_sum / total_weight if total_weight > 0 else 0.0
