import pytest
from datetime import datetime, timedelta, timezone
from app.services.bkt_service import evaluate_bkt_and_retention, SpacedRepetitionScheduler
from app.services.knowledge_graph import calculate_topological_depths, evaluate_node_states, build_curriculum_dag

def test_bkt_with_mixed_timezones_and_large_consecutive():
    # Mix timezone-aware and timezone-naive datetimes
    now_aware = datetime.now(timezone.utc)
    past_naive = datetime.utcnow() - timedelta(days=2)

    attempts = [
        {"is_correct": True, "timestamp": past_naive},
        {"is_correct": True, "timestamp": now_aware},
    ]

    # Should not raise TypeError: can't subtract offset-naive and offset-aware datetimes
    res = evaluate_bkt_and_retention(attempts, current_time=now_aware)
    assert res["bkt_probability"] > 0.20
    assert 0.0 <= res["retention_rate"] <= 1.0

    # Test extreme consecutive correct (overflow prevention)
    review = SpacedRepetitionScheduler.calculate_next_review(
        consecutive_correct=100,
        is_last_correct=True,
        base_time=past_naive
    )
    assert review["stability_days"] <= 365.0
    assert review["urgency"] == "optimal"

def test_knowledge_graph_missing_prereq_and_self_dependency():
    topics = [
        {
            "id": 101,
            "code": "SELF_DEP",
            "name": "Self Dependent Topic",
            "prerequisites": ["SELF_DEP", "NON_EXISTENT_PREREQ"],
            "category": "Testing"
        },
        {
            "id": 102,
            "code": "CHILD_TOPIC",
            "name": "Child Topic",
            "prerequisites": ["SELF_DEP"],
            "category": "Testing"
        }
    ]

    # 1. Topological depth must not loop infinitely
    depths = calculate_topological_depths(topics)
    assert "SELF_DEP" in depths
    assert "CHILD_TOPIC" in depths

    # 2. evaluate_node_states must not raise AttributeError on missing prerequisite
    nodes = evaluate_node_states(
        topics=topics,
        user_mastery_map={},
        bkt_map={}
    )
    assert len(nodes) == 2
    self_node = next(n for n in nodes if n["code"] == "SELF_DEP")
    assert "NON_EXISTENT_PREREQ" in self_node["blocked_by"]
    assert self_node["status"] == "locked"

def test_tutor_empty_and_whitespace_rejection(client, auth_headers):
    # Empty message rejection
    resp1 = client.post("/tutor/chat", headers=auth_headers, json={"message": "   "})
    assert resp1.status_code == 422

    # Streaming empty message rejection
    resp2 = client.post("/tutor/chat/stream", headers=auth_headers, json={"message": ""})
    assert resp2.status_code == 422

def test_quiz_attempt_empty_answer_safety(client, auth_headers):
    payload = {
        "question_id": 1,
        "selected_answer": "   ",
        "time_taken_seconds": 10
    }
    resp = client.post("/quizzes/attempts", headers=auth_headers, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_correct"] is False
