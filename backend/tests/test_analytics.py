import pytest
from app.services.analytics import calculate_topic_mastery, classify_mastery, compute_recommendation_score
from app.ml.predictor import predict_weak_topic

def test_classify_mastery_thresholds():
    assert classify_mastery(0.40, attempts=1) == "insufficient_data"
    assert classify_mastery(0.45, attempts=4) == "weak"
    assert classify_mastery(0.65, attempts=4) == "developing"
    assert classify_mastery(0.85, attempts=4) == "strong"

def test_compute_recommendation_score():
    score_weak, reason_weak = compute_recommendation_score(
        topic_status="weak",
        mastery_score=0.3,
        resource_difficulty=2,
        user_avg_difficulty=2.0
    )
    score_strong, _ = compute_recommendation_score(
        topic_status="strong",
        mastery_score=0.9,
        resource_difficulty=4,
        user_avg_difficulty=2.0
    )
    # Weak topics must yield significantly higher recommendation score
    assert score_weak > score_strong
    assert "remediation" in reason_weak.lower()

def test_ml_weak_topic_predictor():
    res = predict_weak_topic(
        study_hours=2.0,
        vle_clicks=15,
        prior_attempts=5,
        assessment_score=35.0
    )
    assert "is_weak_prediction" in res
    assert "weak_probability" in res
    assert 0.0 <= res["weak_probability"] <= 1.0

def test_mastery_analytics_endpoint(client, auth_headers):
    response = client.get("/analytics/mastery", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_quizzes_taken" in data
    assert "overall_accuracy" in data
    assert "topics" in data
    assert len(data["topics"]) > 0

def test_recommendations_endpoint(client, auth_headers):
    response = client.get("/recommendations", headers=auth_headers)
    assert response.status_code == 200
    recs = response.json()
    assert len(recs) > 0
    assert "title" in recs[0]
    assert "relevance_score" in recs[0]

def test_generate_custom_plan(client, auth_headers):
    payload = {
        "subject": "Data Structures & Algorithms",
        "duration_weeks": 4,
        "target_hours_per_week": 8,
        "skill_level": "Beginner",
        "learning_goal": "Full Mastery"
    }
    response = client.post("/roadmaps/custom", headers=auth_headers, json=payload)
    assert response.status_code == 200
    plan = response.json()
    assert "milestones" in plan
    assert len(plan["milestones"]) >= 2

def test_flashcards_endpoint(client, auth_headers):
    response = client.get("/analytics/flashcards", headers=auth_headers)
    assert response.status_code == 200
    cards = response.json()
    assert isinstance(cards, list)
    assert len(cards) > 0
    assert "concept_question" in cards[0]
    assert "key_takeaway" in cards[0]

def test_streak_endpoint(client, auth_headers):
    response = client.get("/analytics/streak", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "day_streak" in data
    assert isinstance(data["day_streak"], int)
    assert data["day_streak"] >= 0

def test_tasks_today_and_toggle(client, auth_headers):
    # Fetch tasks
    response = client.get("/tasks/today", headers=auth_headers)
    assert response.status_code == 200
    tasks = response.json()
    assert isinstance(tasks, list)
    assert len(tasks) > 0
    first_task = tasks[0]
    task_id = first_task["id"]
    initial_status = first_task["is_done"]

    # Toggle task
    toggle_resp = client.put(f"/tasks/{task_id}/toggle", headers=auth_headers, json={"is_done": not initial_status})
    assert toggle_resp.status_code == 200
    updated_task = toggle_resp.json()
    assert updated_task["id"] == task_id
    assert updated_task["is_done"] == (not initial_status)

def test_settings_profile_endpoints(client, auth_headers):
    # Get profile settings
    get_resp = client.get("/settings/profile", headers=auth_headers)
    assert get_resp.status_code == 200
    settings = get_resp.json()
    assert "target_role" in settings
    assert "weekly_hours" in settings

    # Update profile settings
    update_payload = {
        "target_role": "AI / ML Engineer",
        "weekly_hours": 15,
        "difficulty_mode": "Hard",
        "daily_streak_reminder": False
    }
    put_resp = client.put("/settings/profile", headers=auth_headers, json=update_payload)
    assert put_resp.status_code == 200
    updated = put_resp.json()
    assert updated["target_role"] == "AI / ML Engineer"
    assert updated["weekly_hours"] == 15
    assert updated["difficulty_mode"] == "Hard"
    assert updated["daily_streak_reminder"] is False

