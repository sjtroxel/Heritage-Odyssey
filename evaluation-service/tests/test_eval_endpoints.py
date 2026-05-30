from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

FAKE_UUID = "11111111-1111-1111-1111-111111111111"

FAKE_RAGAS = {
    "faithfulness": 0.9,
    "answer_relevancy": 0.8,
    "context_recall": None,
}

SAMPLE_REQUEST = {
    "query": "Tell me about German immigrants in 1880",
    "narrative_text": "In 1880, thousands of German emigrants crossed the Atlantic by ship.",
    "retrieved_documents": ["German emigration peaked in the 1880s due to economic hardship."],
}


def _mock_all(mock_resonance, mock_ragas, mock_insert):
    mock_resonance.return_value = 0.75
    mock_ragas.return_value = FAKE_RAGAS
    mock_insert.return_value = FAKE_UUID


@patch("routers.eval.db.insert_eval_score")
@patch("routers.eval.scorer.ragas_scores")
@patch("routers.eval.scorer.emotional_resonance_score", new_callable=AsyncMock)
def test_evaluate_narrative_returns_result(mock_resonance, mock_ragas, mock_insert):
    _mock_all(mock_resonance, mock_ragas, mock_insert)

    response = client.post("/evaluate/narrative", json=SAMPLE_REQUEST)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == FAKE_UUID
    assert data["query"] == SAMPLE_REQUEST["query"]
    assert "scores" in data
    assert data["scores"]["historical_grounding"] is not None
    assert data["scores"]["emotional_resonance"] == 0.75
    assert data["scores"]["overall"] is not None


@patch("routers.eval.db.insert_eval_score")
@patch("routers.eval.scorer.ragas_scores")
@patch("routers.eval.scorer.emotional_resonance_score", new_callable=AsyncMock)
def test_evaluate_narrative_persists_to_db(mock_resonance, mock_ragas, mock_insert):
    _mock_all(mock_resonance, mock_ragas, mock_insert)

    client.post("/evaluate/narrative", json=SAMPLE_REQUEST)

    mock_insert.assert_called_once()
    call_kwargs = mock_insert.call_args.kwargs
    assert call_kwargs["query"] == SAMPLE_REQUEST["query"]
    assert call_kwargs["model_used"] == "gpt-4o"


@patch("routers.eval.db.insert_eval_score")
@patch("routers.eval.scorer.ragas_scores")
@patch("routers.eval.scorer.emotional_resonance_score", new_callable=AsyncMock)
def test_evaluate_batch_returns_aggregate(mock_resonance, mock_ragas, mock_insert):
    _mock_all(mock_resonance, mock_ragas, mock_insert)

    response = client.post("/evaluate/batch", json=[SAMPLE_REQUEST, SAMPLE_REQUEST])

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert len(data["results"]) == 2
    assert "aggregate" in data
    assert data["aggregate"]["overall"] is not None


@patch("routers.eval.db.get_score_history")
def test_scores_history_returns_list(mock_history):
    mock_history.return_value = [
        {
            "id": FAKE_UUID,
            "query": "test query",
            "narrative_text": "test narrative",
            "overall": 0.82,
            "evaluated_at": None,
            "faithfulness": 0.9,
            "answer_relevancy": 0.8,
            "context_recall": None,
            "historical_grounding": 1.0,
            "emotional_resonance": 0.75,
            "citation_coverage": 0.5,
            "model_used": "gpt-4o",
            "run_id": None,
        }
    ]

    response = client.get("/scores/history?days=7")

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["scores"][0]["id"] == FAKE_UUID
