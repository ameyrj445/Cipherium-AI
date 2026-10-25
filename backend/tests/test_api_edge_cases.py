"""
Cipherium AI - Integration & Edge-Case API Tests
"""
import pytest


def test_auth_invalid_payload_formats(client):
    """Verify 422 Unprocessable Entity on malformed registration and login requests."""
    # Missing required password field
    res = client.post("/auth/register", json={"email": "bad@format.com", "name": "No Password"})
    assert res.status_code == 422

    # Malformed JSON payload
    res = client.post("/auth/login", json={"email": 12345})
    assert res.status_code == 422


def test_auth_invalid_bearer_token(client):
    """Verify 401 Unauthorized when an invalid or forged Bearer token is passed."""
    headers = {"Authorization": "Bearer forged.token.signature"}
    res = client.get("/auth/me", headers=headers)
    assert res.status_code == 401


def test_quiz_next_question_unknown_topic_fallback(client, auth_headers):
    """Verify requesting next question with unknown topic ID falls back gracefully to question pool."""
    res = client.get("/quizzes/next?topic_id=999999", headers=auth_headers)
    assert res.status_code == 200
    assert "question_text" in res.json()


def test_quiz_submit_attempt_nonexistent_question(client, auth_headers):
    """Verify 404 Not Found when submitting an attempt against a non-existent question."""
    payload = {
        "question_id": 999999,
        "selected_answer": "Binary Search",
        "time_taken_seconds": 15
    }
    res = client.post("/quizzes/attempts", json=payload, headers=auth_headers)
    assert res.status_code == 404
    assert "Question not found" in res.json()["detail"]


def test_quiz_exam_generator_out_of_bounds_parameters(client, auth_headers):
    """Verify 422 Unprocessable Entity when question count violates constraints (ge=1, le=20)."""
    res = client.post("/quizzes/exam?question_count=0", headers=auth_headers)
    assert res.status_code == 422

    res_high = client.post("/quizzes/exam?question_count=99", headers=auth_headers)
    assert res_high.status_code == 422


def test_analytics_update_nonexistent_plan_progress(client, auth_headers):
    """Verify 404 Not Found when updating milestone progress for an unknown plan ID."""
    payload = {
        "milestone_id": "m-nonexistent",
        "subtopic_name": "Nonexistent Topic",
        "subtopic_completed": True
    }
    res = client.post("/analytics/plans/invalid-plan-uuid/progress", json=payload, headers=auth_headers)
    assert res.status_code == 404


def test_tutor_ask_nonexistent_topic(client, auth_headers):
    """Verify AI Tutor handles queries specifying non-existent topic IDs gracefully."""
    payload = {
        "message": "Explain binary search trees",
        "topic_id": 999999
    }
    res = client.post("/tutor/ask", json=payload, headers=auth_headers)
    assert res.status_code == 404
