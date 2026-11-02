from app.models import Question


def test_tutor_is_locked_during_quiz_and_unlocked_on_completion(client, auth_headers, db_session):
    question = db_session.query(Question).first()
    attempt = client.post(
        "/quizzes/attempts",
        headers={**auth_headers, "Idempotency-Key": "tutor-lock-attempt"},
        json={"question_id": question.id, "selected_answer": question.correct_answer, "time_taken_seconds": 10},
    )
    assert attempt.status_code == 200
    quiz_id = attempt.json()["quiz_id"]

    locked = client.post("/tutor/chat", headers=auth_headers, json={"message": "Help me with this answer"})
    assert locked.status_code == 403
    assert locked.json()["detail"] == "Tutor is locked during an active quiz session."

    completed = client.post(f"/quizzes/{quiz_id}/complete", headers=auth_headers)
    assert completed.status_code == 200

    unlocked = client.post("/tutor/chat", headers=auth_headers, json={"message": "Explain arrays", "mode": "direct"})
    assert unlocked.status_code == 200
