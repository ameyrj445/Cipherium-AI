from app.models import Question


def test_three_quiz_attempts_create_ordered_mastery_events(client, auth_headers, db_session):
    question = db_session.query(Question).order_by(Question.id).first()
    for _ in range(3):
        response = client.post(
            "/quizzes/attempts",
            headers=auth_headers,
            json={"question_id": question.id, "selected_answer": question.correct_answer},
        )
        assert response.status_code == 200

    history = client.get(
        f"/analytics/mastery/history?topic_id={question.topic_id}",
        headers=auth_headers,
    )
    assert history.status_code == 200
    events = history.json()
    assert len(events) == 3
    assert [event["event_type"] for event in events] == ["quiz_attempt"] * 3
    assert [event["id"] for event in events] == sorted(event["id"] for event in events)
