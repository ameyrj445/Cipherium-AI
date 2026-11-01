from app.models import Question, QuizAttempt
from app.utils import idempotency


def _payload(db_session):
    question = db_session.query(Question).order_by(Question.id).first()
    return question, {"question_id": question.id, "selected_answer": question.correct_answer}


def _attempt_count(db_session):
    return db_session.query(QuizAttempt).count()


def setup_function():
    idempotency._cache.clear()


def test_same_idempotency_key_returns_cached_response(client, auth_headers, db_session):
    _, payload = _payload(db_session)
    headers = {**auth_headers, "Idempotency-Key": "same-request"}

    first = client.post("/quizzes/attempts", headers=headers, json=payload)
    second = client.post("/quizzes/attempts", headers=headers, json=payload)

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert _attempt_count(db_session) == 1


def test_different_idempotency_keys_process_fresh_attempts(client, auth_headers, db_session):
    _, payload = _payload(db_session)
    first = client.post("/quizzes/attempts", headers={**auth_headers, "Idempotency-Key": "first"}, json=payload)
    second = client.post("/quizzes/attempts", headers={**auth_headers, "Idempotency-Key": "second"}, json=payload)

    assert first.status_code == second.status_code == 200
    assert first.json()["id"] != second.json()["id"]
    assert _attempt_count(db_session) == 2


def test_expired_idempotency_key_is_processed_again(client, auth_headers, db_session, monkeypatch):
    _, payload = _payload(db_session)
    clock = [1000.0]
    monkeypatch.setattr(idempotency.time, "monotonic", lambda: clock[0])
    headers = {**auth_headers, "Idempotency-Key": "expires"}

    first = client.post("/quizzes/attempts", headers=headers, json=payload)
    clock[0] += idempotency.TTL_SECONDS + 1
    second = client.post("/quizzes/attempts", headers=headers, json=payload)

    assert first.status_code == second.status_code == 200
    assert first.json()["id"] != second.json()["id"]
    assert _attempt_count(db_session) == 2
