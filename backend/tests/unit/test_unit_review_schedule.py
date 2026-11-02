from app.models import Question, ReviewSchedule, User


def test_quiz_attempt_creates_and_updates_review_schedule(client, auth_headers, db_session):
    user = db_session.query(User).filter(User.email == "student@cipherium.ai").first()
    question = db_session.query(Question).first()

    first = client.post(
        "/quizzes/attempts",
        headers={**auth_headers, "Idempotency-Key": "review-schedule-one"},
        json={"question_id": question.id, "selected_answer": question.correct_answer, "time_taken_seconds": 12},
    )
    assert first.status_code == 200
    schedule = db_session.query(ReviewSchedule).filter_by(user_id=user.id, topic_id=question.topic_id).one()
    first_due = schedule.next_review_at
    assert schedule.review_count == 1
    assert schedule.memory_stability > 0

    second = client.post(
        "/quizzes/attempts",
        headers={**auth_headers, "Idempotency-Key": "review-schedule-two"},
        json={"question_id": question.id, "selected_answer": question.correct_answer, "time_taken_seconds": 12},
    )
    assert second.status_code == 200
    db_session.refresh(schedule)
    assert schedule.review_count == 2
    assert schedule.next_review_at >= first_due
