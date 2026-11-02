import json

from app.models import StudyPlan, Topic, TopicMastery, User
from app.services.study_plan_generator import regenerate_if_stale


def _user_and_topic(db_session):
    user = db_session.query(User).filter(User.email == "student@cipherium.ai").first()
    topic = db_session.query(Topic).first()
    return user, topic


def _set_mastery(db_session, user_id, topic_id, status, score):
    mastery = (
        db_session.query(TopicMastery)
        .filter(TopicMastery.user_id == user_id, TopicMastery.topic_id == topic_id)
        .first()
    )
    if mastery is None:
        mastery = TopicMastery(user_id=user_id, topic_id=topic_id)
        db_session.add(mastery)
    mastery.status = status
    mastery.mastery_score = score


def test_strong_mastery_regenerates_a_previously_weak_roadmap_task(db_session):
    user, topic = _user_and_topic(db_session)
    db_session.query(StudyPlan).filter(StudyPlan.user_id == user.id).delete()
    _set_mastery(db_session, user.id, topic.id, "strong", 0.9)
    plan = StudyPlan(
        user_id=user.id,
        target_hours_per_week=8,
        plan_json=json.dumps([{"topic_id": topic.id, "priority": "High", "estimated_hours": 3.5}]),
    )
    db_session.add(plan)
    db_session.flush()

    assert regenerate_if_stale(user.id, db_session) is True
    saved_task = json.loads(plan.plan_json)[0]
    assert saved_task["mastery_status"] == "strong"
    assert saved_task["priority"] == "Low"
    assert saved_task["estimated_hours"] == 1.0


def test_current_roadmap_skips_regeneration(db_session):
    user, topic = _user_and_topic(db_session)
    db_session.query(StudyPlan).filter(StudyPlan.user_id == user.id).delete()
    _set_mastery(db_session, user.id, topic.id, "developing", 0.55)
    original = [{"topic_id": topic.id, "priority": "Medium", "mastery_status": "developing"}]
    plan = StudyPlan(user_id=user.id, target_hours_per_week=8, plan_json=json.dumps(original))
    db_session.add(plan)
    db_session.flush()

    assert regenerate_if_stale(user.id, db_session) is False
    assert json.loads(plan.plan_json) == original
