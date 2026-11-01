from app.models import Question, QuizAttempt, QuizSession


def test_attempt_creates_and_returns_quiz_session(client, auth_headers, db_session):
    question = db_session.query(Question).order_by(Question.id).first()

    response = client.post(
        "/quizzes/attempts",
        headers=auth_headers,
        json={"question_id": question.id, "selected_answer": question.correct_answer},
    )

    assert response.status_code == 200
    session_id = response.json()["session_id"]
    session = db_session.query(QuizSession).filter(QuizSession.id == session_id).one()
    attempt = db_session.query(QuizAttempt).filter(QuizAttempt.id == response.json()["id"]).one()
    assert session.status == "active"
    assert session.session_type == "adaptive"
    assert attempt.session_id == session.id
