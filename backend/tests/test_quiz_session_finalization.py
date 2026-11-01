"""Coverage for quiz-session finalization and answer-key protection."""

from app.models import Question, QuizAttempt


def _question(db_session):
    return db_session.query(Question).order_by(Question.id).first()


def test_complete_quiz_returns_score_and_finalizes_attempts(client, auth_headers, db_session):
    question = _question(db_session)
    first = client.post(
        "/quizzes/attempts",
        headers=auth_headers,
        json={"question_id": question.id, "selected_answer": question.correct_answer},
    )
    assert first.status_code == 200
    quiz_id = first.json()["quiz_id"]

    second = client.post(
        "/quizzes/attempts",
        headers=auth_headers,
        json={"question_id": question.id, "selected_answer": "definitely incorrect", "quiz_id": quiz_id},
    )
    assert second.status_code == 200

    response = client.post(f"/quizzes/{quiz_id}/complete", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["score"] == 1
    assert payload["total"] == 2
    assert payload["accuracy_pct"] == 50.0
    assert payload["mastery_deltas"] == [{"topic_id": question.topic_id, "before": 0.0, "after": 0.5}]
    assert all(attempt.is_finalized for attempt in db_session.query(QuizAttempt).filter_by(quiz_id=quiz_id))


def test_hint_penalty_is_floored_at_zero(client, auth_headers, db_session):
    question = _question(db_session)
    response = client.post(
        "/quizzes/attempts",
        headers=auth_headers,
        json={"question_id": question.id, "selected_answer": question.correct_answer, "hint_count": 100},
    )
    assert response.status_code == 200
    assert response.json()["bkt_probability"] == 0.0


def test_get_quiz_session_never_exposes_answer_keys(client, auth_headers, db_session):
    question = _question(db_session)
    attempt_response = client.post(
        "/quizzes/attempts",
        headers=auth_headers,
        json={"question_id": question.id, "selected_answer": question.correct_answer},
    )
    quiz_id = attempt_response.json()["quiz_id"]

    response = client.get(f"/quizzes/{quiz_id}", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["question_ids"] == [question.id]
    serialized = str(payload).lower()
    assert "correct_answer" not in serialized
    assert "correct_index" not in serialized
