import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta


def _get_connection():
    url = os.environ["DATABASE_URL"]
    # psycopg2 rejects channel_binding=require; strip it if present
    url = url.replace("?channel_binding=require", "").replace("&channel_binding=require", "")
    return psycopg2.connect(url)


def insert_eval_score(
    query: str,
    narrative_text: str,
    scores: dict,
    model_used: str | None = None,
    run_id: str | None = None,
) -> str:
    row_id = str(uuid.uuid4())
    sql = """
        INSERT INTO eval_scores (
            id, run_id, query, narrative_text,
            faithfulness, answer_relevancy, context_recall,
            historical_grounding, emotional_resonance, citation_coverage,
            overall, model_used
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    with _get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (
                row_id, run_id, query, narrative_text,
                scores.get("faithfulness"),
                scores.get("answer_relevancy"),
                scores.get("context_recall"),
                scores.get("historical_grounding"),
                scores.get("emotional_resonance"),
                scores.get("citation_coverage"),
                scores.get("overall"),
                model_used,
            ))
        conn.commit()
    return row_id


def get_score_history(days: int = 30) -> list[dict]:
    since = datetime.utcnow() - timedelta(days=days)
    sql = """
        SELECT id, run_id, query, narrative_text,
               faithfulness, answer_relevancy, context_recall,
               historical_grounding, emotional_resonance, citation_coverage,
               overall, model_used, evaluated_at
        FROM eval_scores
        WHERE evaluated_at >= %s
        ORDER BY evaluated_at DESC
    """
    with _get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, (since,))
            rows = cur.fetchall()
    return [dict(r) for r in rows]
