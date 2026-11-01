"""
Cipherium AI - Learner Profile & GDPR Data Portability Router

Endpoints:
  GET /me/export - Generates privacy-compliant data export archive in JSON or CSV format (FR-PROF-02b)
"""

import csv
import io
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, TopicMastery, QuizAttempt, TutorMessage, DailyTask, UserSettings, StudyPlan
from app.routers.auth import get_current_user
from app.limiter import limiter

router = APIRouter(tags=["Learner Profile & Privacy"])


@router.get("/me/export")
@limiter.limit("3/hour")
def export_user_data(
    request: Request,
    format: str = Query("json", description="Export format: 'json' or 'csv'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exports all personal learning data, mastery states, quiz histories, and settings.
    Implements GDPR Article 20 Right to Data Portability (FR-PROF-02b).
    """
    format_clean = format.strip().lower()
    if format_clean not in ["json", "csv"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid export format. Supported formats are 'json' and 'csv'.",
        )

    # 1. Fetch user mastery data
    masteries = db.query(TopicMastery).filter(TopicMastery.user_id == current_user.id).all()

    if format_clean == "csv":
        # Generate flattened CSV of topic mastery and cognitive states
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "topic_id",
            "topic_name",
            "mastery_score",
            "attempt_count",
            "last_seen",
        ])
        for m in masteries:
            writer.writerow([
                m.topic_id,
                m.topic.name if m.topic else "",
                round(m.mastery_score or 0.0, 4),
                m.attempt_count,
                m.updated_at.isoformat() if m.updated_at else "",
            ])
        csv_content = output.getvalue()
        output.close()

        filename = f"cipherium_export_{current_user.id}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # JSON export format: full comprehensive archive
    settings_obj = current_user.settings
    settings_data = {
        "target_role": settings_obj.target_role if settings_obj else "Full-Stack Software Engineer",
        "weekly_hours": settings_obj.weekly_hours if settings_obj else 6,
        "difficulty_mode": settings_obj.difficulty_mode if settings_obj else "standard",
        "daily_streak_reminder": settings_obj.daily_streak_reminder if settings_obj else True,
        "diagnostic_quiz_alert": settings_obj.diagnostic_quiz_alert if settings_obj else True,
        "weak_topic_ping": settings_obj.weak_topic_ping if settings_obj else True,
    }

    mastery_list = [
        {
            "topic_id": m.topic_id,
            "topic_code": m.topic.code if m.topic else None,
            "topic_name": m.topic.name if m.topic else None,
            "mastery_score": round(m.mastery_score or 0.0, 4),
            "status": m.status,
            "attempt_count": m.attempt_count,
            "correct_count": m.correct_count,
            "updated_at": m.updated_at.isoformat() if m.updated_at else None,
        }
        for m in masteries
    ]

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.attempted_at.desc())
        .limit(200)
        .all()
    )
    attempt_list = [
        {
            "id": a.id,
            "question_id": a.question_id,
            "selected_answer": a.selected_answer,
            "is_correct": a.is_correct,
            "time_taken_seconds": a.time_taken_seconds,
            "attempted_at": a.attempted_at.isoformat() if a.attempted_at else None,
        }
        for a in attempts
    ]

    tasks = (
        db.query(DailyTask)
        .filter(DailyTask.user_id == current_user.id)
        .order_by(DailyTask.created_at.desc())
        .limit(100)
        .all()
    )
    task_list = [
        {
            "id": t.id,
            "title": t.title,
            "duration": t.duration,
            "is_done": t.is_done,
            "date_str": t.date_str,
        }
        for t in tasks
    ]

    messages = (
        db.query(TutorMessage)
        .filter(TutorMessage.user_id == current_user.id)
        .order_by(TutorMessage.created_at.desc())
        .limit(100)
        .all()
    )
    message_list = [
        {
            "id": msg.id,
            "role": msg.role,
            "message": msg.message,
            "topic_id": msg.topic_id,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        for msg in messages
    ]

    # Study plans
    study_plans = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.created_at.desc())
        .limit(20)
        .all()
    )
    study_plan_list = [
        {
            "id": sp.id,
            "target_hours_per_week": sp.target_hours_per_week,
            "plan_json": json.loads(sp.plan_json) if isinstance(sp.plan_json, str) else sp.plan_json,
            "created_at": sp.created_at.isoformat() if sp.created_at else None,
        }
        for sp in study_plans
    ]

    export_payload = {
        "metadata": {
            "platform": "Cipherium AI",
            "version": "2.0.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
        },
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "settings": settings_data,
        "masteries": mastery_list,
        "quiz_history": attempt_list,
        "daily_tasks": task_list,
        "study_plans": study_plan_list,
        "tutor_dialogue": message_list,
    }

    json_str = json.dumps(export_payload, indent=2)
    filename = f"cipherium_export_{current_user.id}.json"
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
