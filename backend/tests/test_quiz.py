import pytest

def test_get_topics_list(client):
    response = client.get("/topics")
    assert response.status_code == 200
    topics = response.json()
    assert len(topics) >= 4
    topic_codes = [t["code"] for t in topics]
    assert "DSA-ARRAYS" in topic_codes

def test_get_next_question(client, auth_headers):
    response = client.get("/quizzes/next", headers=auth_headers)
    assert response.status_code == 200
    q = response.json()
    assert "id" in q
    assert "question_text" in q
    assert len(q["options"]) >= 2
    # Verify explanation is masked before submission
    assert q.get("explanation") is None

def test_submit_quiz_attempt(client, auth_headers):
    # Fetch a question first
    q_resp = client.get("/quizzes/next", headers=auth_headers)
    assert q_resp.status_code == 200
    question = q_resp.json()
    q_id = question["id"]
    chosen_opt = question["options"][0]

    # Submit answer
    sub_resp = client.post(
        "/quizzes/attempts",
        headers=auth_headers,
        json={"question_id": q_id, "selected_answer": chosen_opt, "time_taken_seconds": 12}
    )
    assert sub_resp.status_code == 200
    result = sub_resp.json()
    assert "is_correct" in result
    assert "correct_answer" in result
    assert "new_mastery_score" in result
    assert "new_status" in result
    assert result["new_status"] in ["insufficient_data", "weak", "developing", "strong"]

def test_generate_diagnostic_exam(client, auth_headers):
    response = client.post(
        "/quizzes/exam?question_count=5&time_limit_minutes=10",
        headers=auth_headers
    )
    assert response.status_code == 200
    exam = response.json()
    assert "exam_id" in exam
    assert len(exam["questions"]) == 5
    assert exam["time_limit_minutes"] == 10
