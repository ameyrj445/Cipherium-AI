from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timezone, date, timedelta

from app.database import get_db
from app.models import (
    Topic, TopicMastery, QuizAttempt, Resource, StudyPlan,
    SubjectRoadmap, User, Question, DailyTask, UserSettings, TutorMessage
)
from app.schemas import (
    MasteryAnalyticsResponse,
    TopicMasteryDetail,
    ResourceResponse,
    GenerateRoadmapRequest,
    RoadmapResponse,
    RoadmapTask,
    CreateCustomPlanRequest,
    SaveCustomPlanRequest,
    UpdatePlanProgressRequest,
    StreakResponse,
    UserSettingsResponse,
    UserSettingsUpdate,
    DailyTaskResponse,
    DailyTaskCreate,
    DailyTaskToggleRequest,
    RetentionScheduleItem,
    RetentionScheduleResponse,
    KnowledgeGraphResponse
)
from app.routers.auth import get_current_user
from app.services.analytics import compute_recommendation_score, calculate_topic_cognitive_state
from app.services.knowledge_graph import build_curriculum_dag
from app.ml.predictor import predict_weak_topic
from app.services.study_plan_generator import generate_study_plan


router = APIRouter(tags=["Analytics, Recommendations & Roadmaps"])

@router.get("/roadmaps/subjects")
def list_subject_roadmaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return the curated Explore All Subjects roadmaps stored in the database."""
    records = (
        db.query(SubjectRoadmap)
        .filter(SubjectRoadmap.is_active.is_(True))
        .order_by(SubjectRoadmap.id.asc())
        .all()
    )
    roadmaps = []
    for record in records:
        try:
            roadmap = json.loads(record.roadmap_json)
            if isinstance(roadmap, dict):
                roadmaps.append(roadmap)
        except json.JSONDecodeError:
            continue
    return roadmaps


def calculate_user_streak(user_id: int, db: Session) -> dict:
    """
    Calculates the student's consecutive active daily study streak based on
    timestamps of recorded quiz attempts in the database.
    """
    attempts = (
        db.query(QuizAttempt.attempted_at)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.attempted_at.desc())
        .all()
    )
    if not attempts:
        return {"day_streak": 0, "last_active_date": None, "is_active_today": False}

    unique_dates = sorted(
        list(set(a[0].date() for a in attempts if a[0] is not None)),
        reverse=True
    )
    if not unique_dates:
        return {"day_streak": 0, "last_active_date": None, "is_active_today": False}

    utc_today = datetime.now(timezone.utc).date()
    local_today = date.today()
    last_active = unique_dates[0]
    is_active_today = (last_active in (utc_today, local_today))

    # Streak is active if last activity was today or yesterday in either UTC or local time
    earliest_valid_yesterday = min(utc_today, local_today) - timedelta(days=1)
    if last_active < earliest_valid_yesterday:
        return {"day_streak": 0, "last_active_date": last_active.isoformat(), "is_active_today": False}

    streak = 0
    expected_date = last_active
    for d in unique_dates:
        if d == expected_date:
            streak += 1
            expected_date = d - timedelta(days=1)
        else:
            break

    return {
        "day_streak": streak,
        "last_active_date": last_active.isoformat(),
        "is_active_today": is_active_today
    }


@router.get("/analytics/mastery", response_model=MasteryAnalyticsResponse)
def get_mastery_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes holistic curriculum mastery analytics for the authenticated student.
    
    Processing Steps:
    1. Loads all curriculum topics and joins historical student quiz attempts.
    2. Calculates overall historical precision (percentage accuracy).
    3. Feeds interaction telemetry into the pre-trained Random Forest ML classifier
       to calculate weak-topic probabilities based on the OULAD academic benchmark.
    4. Ranks curriculum topics into prioritised order:
       Weak -> Developing -> Insufficient Data -> Strong.
    5. Calculates consecutive daily active study streak.
    """
    topics = db.query(Topic).all()
    user_masteries = {
        m.topic_id: m for m in db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    }
    all_attempts = (
        db.query(QuizAttempt)
        .join(Question)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )

    total_quizzes = len(all_attempts)
    total_correct = sum(1 for a in all_attempts if a.is_correct)
    overall_accuracy = round((total_correct / total_quizzes * 100), 1) if total_quizzes > 0 else 0.0

    attempts_by_topic = {}
    for a in all_attempts:
        if a.question and a.question.topic_id:
            attempts_by_topic.setdefault(a.question.topic_id, []).append(a)

    topic_details: List[TopicMasteryDetail] = []
    strong_cnt = 0
    dev_cnt = 0
    weak_cnt = 0

    for t in topics:
        m = user_masteries.get(t.id)
        if m:
            m_score = m.mastery_score
            st = m.status
            att_cnt = m.attempt_count
            corr_cnt = m.correct_count
        else:
            m_score = 0.0
            st = "insufficient_data"
            att_cnt = 0
            corr_cnt = 0

        acc_pct = round((corr_cnt / att_cnt * 100), 1) if att_cnt > 0 else 0.0

        # Calculate cognitive state via Bayesian Knowledge Tracing and Ebbinghaus Spaced Repetition
        t_attempts = attempts_by_topic.get(t.id, [])
        cog_state = calculate_topic_cognitive_state(t_attempts)

        # Run Scikit-learn Random Forest model trained on OULAD dataset:
        # Features: study_hours, vle_clicks, prior_attempts, assessment_score
        estimated_study_hours = max(1.0, round(att_cnt * 0.4, 1))
        estimated_clicks = max(10, att_cnt * 18)
        simulated_score = acc_pct if att_cnt > 0 else 45.0
        ml_res = predict_weak_topic(
            study_hours=estimated_study_hours,
            vle_clicks=estimated_clicks,
            prior_attempts=att_cnt,
            assessment_score=simulated_score
        )
        ml_weak_prob = ml_res["weak_probability"]
        ml_pred_label = "Intervention Needed" if ml_res["is_weak_prediction"] else "On Track"

        # If attempts are low or score indicates weakness, honor ML prediction
        if ml_res["is_weak_prediction"] and st != "strong":
            st = "weak"

        if st == "strong":
            strong_cnt += 1
        elif st == "developing":
            dev_cnt += 1
        elif st == "weak":
            weak_cnt += 1

        topic_details.append(
            TopicMasteryDetail(
                topic_id=t.id,
                topic_name=t.name,
                topic_code=t.code,
                category=t.category,
                mastery_score=m_score,
                status=st,
                attempt_count=att_cnt,
                correct_count=corr_cnt,
                accuracy_percentage=acc_pct,
                ml_weak_probability=ml_weak_prob,
                ml_prediction=ml_pred_label,
                bkt_probability=cog_state["bkt_probability"],
                retention_rate=cog_state["retention_rate"],
                next_review_due=cog_state["next_review_due"],
                retention_status=cog_state["retention_status"]
            )
        )

    # Sort topics so weak and developing topics show first for rapid intervention
    priority_order = {"weak": 1, "developing": 2, "insufficient_data": 3, "strong": 4}
    topic_details.sort(key=lambda item: priority_order.get(item.status, 5))

    streak_data = calculate_user_streak(current_user.id, db)

    return MasteryAnalyticsResponse(
        total_quizzes_taken=total_quizzes,
        overall_accuracy=overall_accuracy,
        strong_topics_count=strong_cnt,
        developing_topics_count=dev_cnt,
        weak_topics_count=weak_cnt,
        topics=topic_details,
        day_streak=streak_data["day_streak"]
    )

@router.get("/analytics/retention-schedule", response_model=RetentionScheduleResponse)
def get_retention_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns topics grouped by Spaced Repetition urgency and Ebbinghaus memory decay.
    Prioritizes concepts that are slipping from student retention.
    """
    topics = db.query(Topic).all()
    all_attempts = (
        db.query(QuizAttempt)
        .join(Question)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )
    attempts_by_topic = {}
    for a in all_attempts:
        if a.question and a.question.topic_id:
            attempts_by_topic.setdefault(a.question.topic_id, []).append(a)

    schedule_items = []
    due_today_cnt = 0
    crit_cnt = 0
    rec_cnt = 0
    opt_cnt = 0
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    for t in topics:
        t_attempts = attempts_by_topic.get(t.id, [])
        cog_state = calculate_topic_cognitive_state(t_attempts)
        status = cog_state["retention_status"]

        if status == "critical_review":
            crit_cnt += 1
            due_today_cnt += 1
        elif status == "review_recommended":
            rec_cnt += 1
            if cog_state["next_review_due"] and cog_state["next_review_due"] <= now:
                due_today_cnt += 1
        else:
            opt_cnt += 1

        schedule_items.append(
            RetentionScheduleItem(
                topic_id=t.id,
                topic_name=t.name,
                topic_code=t.code,
                bkt_probability=cog_state["bkt_probability"],
                retention_rate=cog_state["retention_rate"],
                next_review_due=cog_state["next_review_due"],
                retention_status=status,
                attempt_count=len(t_attempts)
            )
        )

    # Sort schedule by urgency: critical first, then recommended, then optimal
    urgency_order = {"critical_review": 1, "review_recommended": 2, "optimal": 3}
    schedule_items.sort(key=lambda item: (urgency_order.get(item.retention_status, 4), item.retention_rate))

    return RetentionScheduleResponse(
        due_today_count=due_today_cnt,
        critical_count=crit_cnt,
        recommended_count=rec_cnt,
        optimal_count=opt_cnt,
        schedule=schedule_items
    )

@router.get("/analytics/knowledge-graph", response_model=KnowledgeGraphResponse)
def get_knowledge_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the curriculum prerequisite Knowledge Graph (DAG).
    Dynamically maps each topic to 'mastered', 'unlocked', or 'locked' based on student BKT & mastery states.
    """
    topics = db.query(Topic).all()
    user_masteries = {
        m.topic.code: m.mastery_score
        for m in db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
        if m.topic
    }

    # Calculate BKT probabilities from attempts
    all_attempts = (
        db.query(QuizAttempt)
        .join(Question)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )
    attempts_by_code = {}
    for a in all_attempts:
        if a.question and a.question.topic and a.question.topic.code:
            attempts_by_code.setdefault(a.question.topic.code, []).append(a)

    bkt_states = {}
    for t in topics:
        t_attempts = attempts_by_code.get(t.code, [])
        cog_state = calculate_topic_cognitive_state(t_attempts)
        bkt_states[t.code] = cog_state["bkt_probability"]

    graph_data = build_curriculum_dag(
        topics=topics,
        user_masteries=user_masteries,
        bkt_states=bkt_states
    )
    return graph_data

@router.get("/recommendations", response_model=List[ResourceResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ranks all learning resources in the repository for the active student using
    a multi-factor pedagogical fit scoring equation:
      S = 0.5 * topic_relevance + 0.3 * difficulty_fit + 0.2 * prerequisite_fit
      
    Returns sorted array with highest-scoring remediation resources first.
    """
    user_masteries = {
        m.topic_id: m for m in db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    }
    resources = db.query(Resource).all()

    ranked_list: List[ResourceResponse] = []
    for r in resources:
        m = user_masteries.get(r.topic_id)
        status_val = m.status if m else "insufficient_data"
        score_val = m.mastery_score if m else 0.0

        rel_score, reason = compute_recommendation_score(
            topic_status=status_val,
            mastery_score=score_val,
            resource_difficulty=r.difficulty,
            prerequisites_met=True
        )

        ranked_list.append(
            ResourceResponse(
                id=r.id,
                topic_id=r.topic_id,
                topic_name=r.topic.name if r.topic else "",
                title=r.title,
                resource_type=r.resource_type,
                url=r.url,
                difficulty=r.difficulty,
                estimated_minutes=r.estimated_minutes,
                summary=r.summary,
                relevance_score=rel_score,
                recommendation_reason=reason
            )
        )

    # Sort by relevance score descending
    ranked_list.sort(key=lambda x: (x.relevance_score or 0.0), reverse=True)
    return ranked_list

@router.post("/roadmaps/generate", response_model=RoadmapResponse)
def generate_study_roadmap(
    req: GenerateRoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topics = db.query(Topic).all()
    user_masteries = {
        m.topic_id: m for m in db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    }

    # Order topics with topological considerations:
    # 1. Weak topics first
    # 2. Developing topics
    # 3. Insufficient data
    # 4. Strong topics (reinforcement)
    status_weights = {"weak": 1, "developing": 2, "insufficient_data": 3, "strong": 4}

    tasks: List[RoadmapTask] = []
    total_hours = 0.0

    # Sort topics
    sorted_topics = sorted(
        topics,
        key=lambda t: status_weights.get(user_masteries.get(t.id).status if user_masteries.get(t.id) else "insufficient_data", 5)
    )

    for idx, t in enumerate(sorted_topics):
        m = user_masteries.get(t.id)
        status_val = m.status if m else "insufficient_data"
        
        if status_val == "weak":
            hours = 3.5
            priority = "High"
            milestone = f"Milestone {idx + 1}: Urgent Mastery Intervention"
            task_status = "in_progress" if idx == 0 else "pending"
        elif status_val == "developing":
            hours = 2.5
            priority = "Medium"
            milestone = f"Milestone {idx + 1}: Skill Acceleration"
            task_status = "pending"
        elif status_val == "insufficient_data":
            hours = 2.0
            priority = "Medium"
            milestone = f"Milestone {idx + 1}: Diagnostic Exploration"
            task_status = "pending"
        else: # strong
            hours = 1.0
            priority = "Low"
            milestone = f"Milestone {idx + 1}: Advanced Refresher"
            task_status = "pending"

        total_hours += hours

        # Grab top resources for this topic
        top_resources = [
            ResourceResponse(
                id=r.id,
                topic_id=r.topic_id,
                topic_name=t.name,
                title=r.title,
                resource_type=r.resource_type,
                url=r.url,
                difficulty=r.difficulty,
                estimated_minutes=r.estimated_minutes,
                summary=r.summary
            )
            for r in t.resources[:2]
        ]

        tasks.append(
            RoadmapTask(
                task_id=f"TASK-{t.code}",
                topic_id=t.id,
                topic_name=t.name,
                priority=priority,
                estimated_hours=hours,
                recommended_resources=top_resources,
                milestone=milestone,
                status=task_status
            )
        )

    # Persist or update study plan
    plan_data = [task.model_dump() for task in tasks]
    plan_record = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).first()
    if not plan_record:
        plan_record = StudyPlan(
            user_id=current_user.id,
            target_hours_per_week=req.target_hours_per_week,
            plan_json=json.dumps(plan_data)
        )
        db.add(plan_record)
    else:
        plan_record.target_hours_per_week = req.target_hours_per_week
        plan_record.plan_json = json.dumps(plan_data)
        plan_record.updated_at = datetime.now(timezone.utc)
    
    db.commit()

    return RoadmapResponse(
        target_hours_per_week=req.target_hours_per_week,
        total_estimated_hours=round(total_hours, 1),
        tasks=tasks,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    )

@router.post("/roadmaps/custom")
def create_custom_study_plan(
    req: CreateCustomPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a Gemini draft for preview only; it is not persisted."""
    try:
        plan_dict = generate_study_plan(
            subject=req.subject,
            duration_weeks=req.duration_weeks,
            target_hours_per_week=req.target_hours_per_week,
            skill_level=req.skill_level,
            learning_goal=req.learning_goal
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    plan_dict["is_added_to_learn"] = False
    return plan_dict

@router.post("/roadmaps/custom/save")
def save_custom_study_plan(
    req: SaveCustomPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Persist a Gemini-generated plan only after the learner adds it to Learn."""
    plan_dict = req.plan
    if not isinstance(plan_dict, dict) or not plan_dict.get("milestones"):
        raise HTTPException(status_code=422, detail="A valid generated study plan is required.")

    plan_dict["is_added_to_learn"] = True
    # Each saved plan gets its own record so learners can keep several active plans.
    plan_record = StudyPlan(
        user_id=current_user.id,
        target_hours_per_week=plan_dict.get("target_hours_per_week", 10),
        plan_json=json.dumps(plan_dict)
    )
    db.add(plan_record)

    db.commit()
    return plan_dict

@router.get("/roadmaps/custom")
def list_custom_study_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return every plan the learner has added to Learn, most recently updated first."""
    records = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.updated_at.desc(), StudyPlan.id.desc())
        .all()
    )
    plans = []
    for record in records:
        try:
            data = json.loads(record.plan_json)
            if isinstance(data, dict) and data.get("milestones"):
                plans.append(data)
        except Exception:
            continue
    return plans

@router.delete("/roadmaps/custom/{plan_id}")
def delete_custom_study_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete only the selected learner plan."""
    records = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).all()
    for record in records:
        try:
            if json.loads(record.plan_json).get("id") == plan_id:
                db.delete(record)
                db.commit()
                return {"deleted": True, "plan_id": plan_id}
        except Exception:
            continue
    raise HTTPException(status_code=404, detail="Study plan not found.")

@router.get("/roadmaps/current")
def get_current_study_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan_record = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.updated_at.desc(), StudyPlan.id.desc())
        .first()
    )
    if plan_record and plan_record.plan_json:
        try:
            data = json.loads(plan_record.plan_json)
            if isinstance(data, dict) and "milestones" in data:
                return data
        except Exception:
            pass

    # No plan created yet by this specific user
    return None


@router.put("/roadmaps/progress")
def update_study_plan_progress(
    req: UpdatePlanProgressRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan_records = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.updated_at.desc(), StudyPlan.id.desc())
        .all()
    )
    plan_record = None
    if req.plan_id:
        for candidate in plan_records:
            try:
                if json.loads(candidate.plan_json).get("id") == req.plan_id:
                    plan_record = candidate
                    break
            except Exception:
                continue
    if plan_record is None and plan_records:
        plan_record = plan_records[0]
    if not plan_record or not plan_record.plan_json:
        return {"error": "No active study plan found."}

    try:
        plan_data = json.loads(plan_record.plan_json)
    except Exception:
        return {"error": "Invalid plan data format."}

    milestones = plan_data.get("milestones", [])

    # The selected plan drives Learn, dashboard tracking, analytics, and resources.
    if req.add_to_learn is not None:
        plan_data["is_added_to_learn"] = req.add_to_learn
    
    # Update subtopic completion
    if req.milestone_id and req.subtopic_name is not None and req.subtopic_completed is not None:
        for m in milestones:
            if m.get("id") == req.milestone_id:
                done_list = m.get("completed_subtopics", [])
                if req.subtopic_completed and req.subtopic_name not in done_list:
                    done_list.append(req.subtopic_name)
                elif not req.subtopic_completed and req.subtopic_name in done_list:
                    done_list.remove(req.subtopic_name)
                m["completed_subtopics"] = done_list
                
                # Check if all subtopics and resources are completed
                all_subs_done = len(done_list) >= len(m.get("subtopics", []))
                all_res_done = all(r.get("completed", False) for r in m.get("resources", []))
                if all_subs_done and (all_res_done or len(m.get("resources", [])) == 0):
                    m["status"] = "completed"
                elif len(done_list) > 0 or any(r.get("completed", False) for r in m.get("resources", [])):
                    m["status"] = "in_progress"

    # Update resource completion
    if req.milestone_id and req.resource_id is not None and req.resource_completed is not None:
        for m in milestones:
            if m.get("id") == req.milestone_id:
                for r in m.get("resources", []):
                    if r.get("id") == req.resource_id:
                        r["completed"] = req.resource_completed
                # Re-evaluate status
                done_list = m.get("completed_subtopics", [])
                all_subs_done = len(done_list) >= len(m.get("subtopics", []))
                all_res_done = all(r.get("completed", False) for r in m.get("resources", []))
                if all_subs_done and all_res_done:
                    m["status"] = "completed"
                elif len(done_list) > 0 or any(r.get("completed", False) for r in m.get("resources", [])):
                    m["status"] = "in_progress"

    # Explicit milestone status update
    if req.milestone_id and req.milestone_status:
        for m in milestones:
            if m.get("id") == req.milestone_id:
                m["status"] = req.milestone_status
                if req.milestone_status == "completed":
                    m["completed_subtopics"] = list(m.get("subtopics", []))
                    for r in m.get("resources", []):
                        r["completed"] = True

    # Track logged hours
    if req.logged_hours_delta and req.logged_hours_delta > 0:
        current_hrs = plan_data.get("completed_hours", 0.0)
        plan_data["completed_hours"] = round(current_hrs + req.logged_hours_delta, 1)

    plan_data["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    plan_record.plan_json = json.dumps(plan_data)
    plan_record.updated_at = datetime.now(timezone.utc)
    db.commit()

    return plan_data


@router.get("/analytics/flashcards")
def get_topic_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates tailored spaced repetition revision flashcards prioritizing
    topics diagnosed as weak or developing by Cipherium's mastery model.
    """
    weak_masteries = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id, TopicMastery.status.in_(["weak", "developing"]))
        .all()
    )
    target_topic_ids = [m.topic_id for m in weak_masteries]
    
    query = db.query(Question)
    if target_topic_ids:
        query = query.filter(Question.topic_id.in_(target_topic_ids))
    
    questions = query.limit(10).all()
    if not questions:
        questions = db.query(Question).limit(8).all()

    flashcards = []
    for q in questions:
        flashcards.append({
            "id": f"fc-{q.id}",
            "topic_id": q.topic_id,
            "topic_name": q.topic.name if q.topic else "Core Curriculum",
            "concept_question": q.question_text,
            "key_takeaway": q.correct_answer,
            "explanation": q.explanation or "Foundational core concept.",
            "difficulty": q.difficulty
        })

    return flashcards


# ── Gemini API Key Management ──────────────────────────────────────────────────
import os as _os
from app.config import settings as _app_settings
import app.services.study_plan_generator as _gen_module

@router.get("/settings/gemini-status")
def get_gemini_status(current_user: User = Depends(get_current_user)):
    """Returns whether a valid Gemini API key is configured."""
    key = (_gen_module.GEMINI_API_KEY or _app_settings.GEMINI_API_KEY or _os.environ.get("GEMINI_API_KEY", "")).strip()
    is_set = bool(key) and key not in ("", "replace_with_your_key", "your_api_key_here")
    masked = (key[:8] + "..." + key[-4:]) if is_set and len(key) > 12 else ""
    return {"gemini_key_set": is_set, "masked_key": masked, "model": _gen_module.GEMINI_MODEL}


@router.post("/settings/gemini-key")
def set_gemini_key(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Safely updates the Gemini API key in process memory for the active session.
    Production-safe: avoids dangerous runtime filesystem file mutations.
    """
    new_key = (payload.get("api_key") or "").strip()
    if not new_key:
        return {"success": False, "message": "No API key provided."}

    # Set in module memory immediately for active requests
    _gen_module.GEMINI_API_KEY = new_key
    _os.environ["GEMINI_API_KEY"] = new_key
    _app_settings.GEMINI_API_KEY = new_key

    return {"success": True, "message": "Gemini API key updated in active session memory."}


# ── Study Streak Endpoint ──────────────────────────────────────────────────────
@router.get("/analytics/streak", response_model=StreakResponse)
def get_user_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the student's continuous daily study streak and last active timestamp.
    """
    streak_data = calculate_user_streak(current_user.id, db)
    total_quizzes = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).count()
    return StreakResponse(
        day_streak=streak_data["day_streak"],
        last_active_date=streak_data["last_active_date"],
        is_active_today=streak_data["is_active_today"],
        total_quizzes_taken=total_quizzes
    )


# ── Daily Tasks Endpoints ──────────────────────────────────────────────────────
@router.get("/tasks/today", response_model=List[DailyTaskResponse])
def get_today_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves or synthesizes the student's daily study tasks for today.
    If no tasks exist for today, automatically seeds standard tasks based on active goals.
    """
    today_str = date.today().isoformat()
    tasks = (
        db.query(DailyTask)
        .filter(DailyTask.user_id == current_user.id, DailyTask.date_str == today_str)
        .order_by(DailyTask.id.asc())
        .all()
    )
    if tasks:
        return tasks

    # Auto-seed standard daily study tasks for today
    default_task_specs = [
        {"title": "Complete Diagnostic Assessment Quiz", "duration": "15 min"},
        {"title": "Review Recommended Video Guide", "duration": "30 min"},
        {"title": "Solve 3 Diagnostic Practice Problems", "duration": "20 min"},
        {"title": "Consult AI Tutor on Knowledge Gaps", "duration": "Any time"},
    ]
    created = []
    for spec in default_task_specs:
        t = DailyTask(
            user_id=current_user.id,
            title=spec["title"],
            duration=spec["duration"],
            is_done=False,
            date_str=today_str
        )
        db.add(t)
        created.append(t)
    db.commit()
    for t in created:
        db.refresh(t)
    return created


@router.put("/tasks/{task_id}/toggle", response_model=DailyTaskResponse)
def toggle_daily_task(
    task_id: int,
    req: Optional[DailyTaskToggleRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggles completion status for a daily task.
    Supports either explicit is_done payload or toggles current state if not specified.
    """
    task = (
        db.query(DailyTask)
        .filter(DailyTask.id == task_id, DailyTask.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if req is not None and req.is_done is not None:
        task.is_done = req.is_done
    else:
        task.is_done = not task.is_done
    db.commit()
    db.refresh(task)
    return task


# ── Persistent User Settings Endpoints ─────────────────────────────────────────
@router.get("/settings/profile", response_model=UserSettingsResponse)
def get_user_settings_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the student's persistent workspace configuration and AI hyperparameters.
    """
    user_settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == current_user.id)
        .first()
    )
    if not user_settings:
        return UserSettingsResponse()
    return UserSettingsResponse(
        target_role=user_settings.target_role or "Full-Stack Software Engineer",
        weekly_hours=user_settings.weekly_hours or 6,
        difficulty_mode=user_settings.difficulty_mode or "standard",
        daily_streak_reminder=user_settings.daily_streak_reminder,
        diagnostic_quiz_alert=user_settings.diagnostic_quiz_alert,
        weak_topic_ping=user_settings.weak_topic_ping,
        has_custom_api_key=bool(user_settings.custom_gemini_api_key),
        custom_gemini_api_key=user_settings.custom_gemini_api_key or ""
    )


@router.put("/settings/profile", response_model=UserSettingsResponse)
def update_user_settings_profile(
    req: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the student's persistent workspace preferences and syncs custom Gemini API key.
    """
    user_settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == current_user.id)
        .first()
    )
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)

    if req.target_role is not None:
        user_settings.target_role = req.target_role
    if req.weekly_hours is not None:
        user_settings.weekly_hours = req.weekly_hours
    if req.difficulty_mode is not None:
        user_settings.difficulty_mode = req.difficulty_mode
    if req.daily_streak_reminder is not None:
        user_settings.daily_streak_reminder = req.daily_streak_reminder
    if req.diagnostic_quiz_alert is not None:
        user_settings.diagnostic_quiz_alert = req.diagnostic_quiz_alert
    if req.weak_topic_ping is not None:
        user_settings.weak_topic_ping = req.weak_topic_ping
    if req.custom_gemini_api_key is not None:
        clean_key = req.custom_gemini_api_key.strip()
        user_settings.custom_gemini_api_key = clean_key
        if clean_key:
            _gen_module.GEMINI_API_KEY = clean_key
            _os.environ["GEMINI_API_KEY"] = clean_key
            _app_settings.GEMINI_API_KEY = clean_key

    db.commit()
    db.refresh(user_settings)
    return UserSettingsResponse(
        target_role=user_settings.target_role,
        weekly_hours=user_settings.weekly_hours,
        difficulty_mode=user_settings.difficulty_mode,
        daily_streak_reminder=user_settings.daily_streak_reminder,
        diagnostic_quiz_alert=user_settings.diagnostic_quiz_alert,
        weak_topic_ping=user_settings.weak_topic_ping,
        has_custom_api_key=bool(user_settings.custom_gemini_api_key),
        custom_gemini_api_key=user_settings.custom_gemini_api_key or ""
    )


@router.get("/analytics/activity-heatmap")
def get_activity_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Computes 365-day practice activity distribution and multi-dimensional competency radar.
    Aggregates quiz submissions and AI tutor interactions with day-by-day intensity levels (0-4),
    calculates active day streaks, and groups topic mastery into curriculum competency domains.
    """
    now = datetime.now(timezone.utc)
    one_year_ago = now - timedelta(days=364)

    # 1. Fetch user quiz attempts and tutor interactions
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .filter(QuizAttempt.attempted_at >= one_year_ago)
        .all()
    )
    tutor_msgs = (
        db.query(TutorMessage)
        .filter(TutorMessage.user_id == current_user.id)
        .filter(TutorMessage.role == "user")
        .filter(TutorMessage.created_at >= one_year_ago)
        .all()
    )

    # 2. Daily aggregation
    daily_counts = {}
    for a in attempts:
        d_str = a.attempted_at.strftime("%Y-%m-%d") if a.attempted_at else None
        if d_str:
            daily_counts[d_str] = daily_counts.get(d_str, 0) + 1

    for m in tutor_msgs:
        d_str = m.created_at.strftime("%Y-%m-%d") if m.created_at else None
        if d_str:
            daily_counts[d_str] = daily_counts.get(d_str, 0) + 1

    # 3. Construct 365-day array
    heatmap_data = []
    total_activities = 0
    start_date = (now - timedelta(days=364)).date()

    for i in range(365):
        day_date = start_date + timedelta(days=i)
        day_str = day_date.strftime("%Y-%m-%d")
        count = daily_counts.get(day_str, 0)
        total_activities += count

        # Activity level 0 - 4
        if count == 0:
            level = 0
        elif count <= 2:
            level = 1
        elif count <= 5:
            level = 2
        elif count <= 9:
            level = 3
        else:
            level = 4

        heatmap_data.append({
            "date": day_str,
            "count": count,
            "level": level
        })

    # 4. Streak calculation
    active_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in daily_counts.keys()])
    longest_streak = 0
    current_streak = 0

    if active_dates:
        temp_streak = 1
        longest_streak = 1
        for i in range(1, len(active_dates)):
            if (active_dates[i] - active_dates[i - 1]).days == 1:
                temp_streak += 1
                if temp_streak > longest_streak:
                    longest_streak = temp_streak
            elif (active_dates[i] - active_dates[i - 1]).days > 1:
                temp_streak = 1

        today_date = now.date()
        yesterday_date = today_date - timedelta(days=1)
        if active_dates[-1] == today_date or active_dates[-1] == yesterday_date:
            curr = 1
            idx = len(active_dates) - 1
            while idx > 0 and (active_dates[idx] - active_dates[idx - 1]).days == 1:
                curr += 1
                idx -= 1
            current_streak = curr

    # 5. Competency Radar by Category
    topics = db.query(Topic).all()
    user_masteries = {
        m.topic_id: m for m in db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    }

    category_scores = {}
    for t in topics:
        cat = t.category or "Computer Science"
        if cat not in category_scores:
            category_scores[cat] = []
        m = user_masteries.get(t.id)
        if m:
            category_scores[cat].append(m.mastery_score * 100)
        else:
            category_scores[cat].append(35.0)

    competency_radar = []
    for cat, scores in sorted(category_scores.items()):
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        competency_radar.append({
            "category": cat,
            "score": avg_score,
            "fullMark": 100
        })

    return {
        "total_activities_past_year": total_activities,
        "current_streak_days": current_streak,
        "longest_streak_days": longest_streak,
        "heatmap_data": heatmap_data,
        "competency_radar": competency_radar
    }
