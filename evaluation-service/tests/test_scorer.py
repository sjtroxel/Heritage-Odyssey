import pytest
from unittest.mock import AsyncMock, MagicMock
from services.scorer import (
    historical_grounding_score,
    citation_coverage_score,
    emotional_resonance_score,
    compute_overall,
)


class TestHistoricalGroundingScore:
    def test_rich_historical_text(self):
        narrative = (
            "In 1847, during the great famine, my ancestor crossed the Atlantic by ship, "
            "arriving at the port of New York in the spring of that fateful century."
        )
        assert historical_grounding_score(narrative) >= 0.75

    def test_bare_modern_text(self):
        assert historical_grounding_score("The weather was nice today.") == 0.0

    def test_score_capped_at_one(self):
        narrative = (
            "1820 century famine war ship voyage port emigrated january"
        )
        assert historical_grounding_score(narrative) == 1.0


class TestCitationCoverageScore:
    def test_high_overlap(self):
        narrative = "The Irish famine caused mass emigration to America."
        docs = ["The Irish famine caused mass emigration across the Atlantic to America."]
        assert citation_coverage_score(narrative, docs) >= 0.5

    def test_no_overlap(self):
        narrative = "Sunshine and rainbows filled the valley."
        docs = ["Ancient Rome conquered Gaul in 58 BC."]
        assert citation_coverage_score(narrative, docs) == 0.0

    def test_empty_docs_returns_zero(self):
        assert citation_coverage_score("any narrative text here", []) == 0.0


async def test_emotional_resonance_parses_response():
    mock_client = MagicMock()
    mock_completion = MagicMock()
    mock_completion.choices[0].message.content = '{"score": 4, "reason": "Vivid and engaging."}'
    mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)

    score = await emotional_resonance_score("Some narrative.", mock_client)
    assert score == pytest.approx(0.75)  # (4-1)/4


def test_compute_overall_excludes_none():
    scores = {
        "faithfulness": 0.8,
        "answer_relevancy": 0.6,
        "context_recall": None,
        "historical_grounding": 1.0,
        "emotional_resonance": 0.5,
        "citation_coverage": 0.4,
    }
    overall = compute_overall(scores)
    assert 0.0 < overall <= 1.0


def test_compute_overall_all_none_returns_zero():
    scores = {k: None for k in ["faithfulness", "answer_relevancy", "context_recall",
                                 "historical_grounding", "emotional_resonance", "citation_coverage"]}
    assert compute_overall(scores) == 0.0
