from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime

from app.database import get_db
from app.models import Topic, TopicMastery, QuizAttempt, Resource, StudyPlan, User
from app.schemas import (
    MasteryAnalyticsResponse,
    TopicMasteryDetail,
    ResourceResponse,
    GenerateRoadmapRequest,
    RoadmapResponse,
    RoadmapTask,
    CreateCustomPlanRequest,
    UpdatePlanProgressRequest
)
from app.routers.auth import get_current_user
from app.services.analytics import compute_recommendation_score
from app.ml.predictor import predict_weak_topic
from app.services.study_plan_generator import generate_study_plan


router = APIRouter(tags=["Analytics, Recommendations & Roadmaps"])

@router.get("/analytics/mastery", response_model=MasteryAnalyticsResponse)
def get_mastery_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topics = db.query(Topic).all()
    user_masteries = {
        m.topic_id: m for m in db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()
    }
    all_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()

    total_quizzes = len(all_attempts)
    total_correct = sum(1 for a in all_attempts if a.is_correct)
    overall_accuracy = round((total_correct / total_quizzes * 100), 1) if total_quizzes > 0 else 0.0

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
                ml_prediction=ml_pred_label
            )
        )

    # Sort topics so weak and developing topics show first for rapid intervention
    priority_order = {"weak": 1, "developing": 2, "insufficient_data": 3, "strong": 4}
    topic_details.sort(key=lambda item: priority_order.get(item.status, 5))

    return MasteryAnalyticsResponse(
        total_quizzes_taken=total_quizzes,
        overall_accuracy=overall_accuracy,
        strong_topics_count=strong_cnt,
        developing_topics_count=dev_cnt,
        weak_topics_count=weak_cnt,
        topics=topic_details
    )

@router.get("/recommendations", response_model=List[ResourceResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
        plan_record.updated_at = datetime.utcnow()
    
    db.commit()

    return RoadmapResponse(
        target_hours_per_week=req.target_hours_per_week,
        total_estimated_hours=round(total_hours, 1),
        tasks=tasks,
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )

@router.post("/roadmaps/custom")
def create_custom_study_plan(
    req: CreateCustomPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan_dict = generate_study_plan(
        subject=req.subject,
        duration_weeks=req.duration_weeks,
        target_hours_per_week=req.target_hours_per_week,
        skill_level=req.skill_level,
        learning_goal=req.learning_goal
    )
    
    plan_record = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).first()
    if not plan_record:
        plan_record = StudyPlan(
            user_id=current_user.id,
            target_hours_per_week=req.target_hours_per_week,
            plan_json=json.dumps(plan_dict)
        )
        db.add(plan_record)
    else:
        plan_record.target_hours_per_week = req.target_hours_per_week
        plan_record.plan_json = json.dumps(plan_dict)
        plan_record.updated_at = datetime.utcnow()
    
    db.commit()
    return plan_dict

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
    plan_record = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.updated_at.desc(), StudyPlan.id.desc())
        .first()
    )
    if not plan_record or not plan_record.plan_json:
        return {"error": "No active study plan found."}

    try:
        plan_data = json.loads(plan_record.plan_json)
    except Exception:
        return {"error": "Invalid plan data format."}

    milestones = plan_data.get("milestones", [])
    
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

    plan_data["updated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    plan_record.plan_json = json.dumps(plan_data)
    plan_record.updated_at = datetime.utcnow()
    db.commit()

    return plan_data


# ── Gemini API Key Management ──────────────────────────────────────────────────
import os as _os
import app.services.study_plan_generator as _gen_module

@router.get("/settings/gemini-status")
def get_gemini_status(current_user: User = Depends(get_current_user)):
    """Returns whether a valid Gemini API key is configured."""
    key = (_gen_module.GEMINI_API_KEY or "").strip()
    is_set = bool(key) and key not in ("", "replace_with_your_key", "your_api_key_here")
    masked = (key[:8] + "..." + key[-4:]) if is_set and len(key) > 12 else ""
    return {"gemini_key_set": is_set, "masked_key": masked, "model": _gen_module.GEMINI_MODEL}


@router.post("/settings/gemini-key")
def set_gemini_key(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    """Updates the Gemini API key in memory (session only) and optionally in the .env file."""
    new_key = (payload.get("api_key") or "").strip()
    if not new_key:
        return {"success": False, "message": "No API key provided."}

    # Set in module memory immediately
    _gen_module.GEMINI_API_KEY = new_key
    _os.environ["GEMINI_API_KEY"] = new_key

    # Optionally persist to .env file
    env_path = _os.path.join(_os.path.dirname(__file__), "..", "..", ".env")
    try:
        lines = []
        found = False
        if _os.path.exists(env_path):
            with open(env_path, "r") as f:
                lines = f.readlines()
            new_lines = []
            for line in lines:
                if line.startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={new_key}\n")
                    found = True
                else:
                    new_lines.append(line)
            if not found:
                new_lines.append(f"\nGEMINI_API_KEY={new_key}\n")
        else:
            new_lines = [f"GEMINI_API_KEY={new_key}\n"]
        with open(env_path, "w") as f:
            f.writelines(new_lines)
    except Exception as e:
        pass  # Not fatal — it's already in memory

    return {"success": True, "message": "Gemini API key updated successfully."}
