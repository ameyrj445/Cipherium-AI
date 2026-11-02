"""Repeatable API latency checks for Cipherium's most-used non-LLM endpoints.

Run with ``pytest tests/perf -m perf``.  The report intentionally measures the
in-process API and database work, not network transport overhead.
"""

import json
import math
import time
from pathlib import Path
from uuid import uuid4

import pytest

from app.models import Question


pytestmark = pytest.mark.perf
REPORT_FILE = Path(__file__).resolve().parents[2] / "data" / "perf_report.json"
ITERATIONS = 20


def _p95(values: list[float]) -> float:
    ordered = sorted(values)
    return ordered[math.ceil(len(ordered) * 0.95) - 1]


def _benchmark(name: str, request, threshold_ms: float) -> None:
    # Warm application caches and lazy model loading before sampling requests.
    warmup = request()
    assert warmup.status_code < 400, warmup.text

    elapsed_ms = []
    for _ in range(ITERATIONS):
        started = time.perf_counter()
        response = request()
        elapsed_ms.append((time.perf_counter() - started) * 1000)
        assert response.status_code < 400, response.text

    p95 = _p95(elapsed_ms)
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        report = json.loads(REPORT_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        report = {"iterations": ITERATIONS, "endpoints": {}}
    report["endpoints"][name] = {
        "p95_ms": round(p95, 3),
        "mean_ms": round(sum(elapsed_ms) / len(elapsed_ms), 3),
        "threshold_ms": threshold_ms,
        "passed": p95 < threshold_ms,
    }
    REPORT_FILE.write_text(json.dumps(report, indent=2), encoding="utf-8")
    assert p95 < threshold_ms, f"{name} p95 was {p95:.2f}ms (target < {threshold_ms:.0f}ms)"


def test_mastery_analytics_p95(client, auth_headers):
    _benchmark("GET /analytics/mastery", lambda: client.get("/analytics/mastery", headers=auth_headers), 400)


def test_recommendations_p95(client, auth_headers):
    _benchmark("GET /recommendations", lambda: client.get("/recommendations", headers=auth_headers), 400)


def test_todays_tasks_p95(client, auth_headers):
    _benchmark("GET /tasks/today", lambda: client.get("/tasks/today", headers=auth_headers), 200)


def test_quiz_attempt_p95(client, auth_headers, db_session):
    question = db_session.query(Question).first()

    def submit_attempt():
        return client.post(
            "/quizzes/attempts",
            headers={**auth_headers, "Idempotency-Key": str(uuid4())},
            json={"question_id": question.id, "selected_answer": question.correct_answer, "time_taken_seconds": 10},
        )

    _benchmark("POST /quizzes/attempts", submit_attempt, 300)


def test_activity_heatmap_p95(client, auth_headers):
    _benchmark("GET /analytics/activity-heatmap", lambda: client.get("/analytics/activity-heatmap", headers=auth_headers), 400)
