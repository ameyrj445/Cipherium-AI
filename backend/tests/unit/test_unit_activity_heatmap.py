import pytest
from datetime import datetime, timedelta, timezone
from app.models import QuizAttempt, Topic, User

def test_activity_heatmap_endpoint(client, auth_headers, db_session):
    user = db_session.query(User).filter(User.email == "student@cipherium.ai").first()
    assert user is not None

    now = datetime.now(timezone.utc)

    attempt1 = QuizAttempt(
        user_id=user.id,
        question_id=1,
        selected_answer="A",
        is_correct=True,
        time_taken_seconds=45,
        attempted_at=now
    )
    attempt2 = QuizAttempt(
        user_id=user.id,
        question_id=2,
        selected_answer="B",
        is_correct=False,
        time_taken_seconds=60,
        attempted_at=now - timedelta(days=1)
    )
    db_session.add_all([attempt1, attempt2])
    db_session.commit()

    resp = client.get("/analytics/activity-heatmap", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "total_activities_past_year" in data
    assert data["total_activities_past_year"] >= 2
    assert "current_streak_days" in data
    assert data["current_streak_days"] >= 1
    assert "longest_streak_days" in data
    assert "heatmap_data" in data
    assert len(data["heatmap_data"]) > 0
    assert "competency_radar" in data
    assert len(data["competency_radar"]) > 0

    sample = data["heatmap_data"][-1]
    assert "date" in sample
    assert "count" in sample
    assert "level" in sample

    radar_item = data["competency_radar"][0]
    assert "category" in radar_item
    assert "score" in radar_item
