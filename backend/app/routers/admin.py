"""
Cipherium AI - Administration & Content Management System (CMS) Router

Endpoints:
  POST  /admin/resources              - Seed or author curriculum learning resources
  POST  /admin/resources/{id}/version - Create updated version of a learning resource
  POST  /admin/questions              - Author curriculum test questions with lifecycle status
  PATCH /admin/questions/{id}/status  - Transition question lifecycle (draft -> review -> published -> archived)
  GET   /admin/questions              - Query and filter question repository by lifecycle status
  GET   /admin/feedback               - Review student feedback and flag reports
  GET   /admin/analytics/overview     - Privacy-preserving aggregated platform telemetry
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Topic, Question, Resource, User, QuizAttempt, TopicMastery, Feedback
from app.schemas import (
    AdminResourceCreate,
    ResourceResponse,
    AdminQuestionCreate,
    AdminQuestionStatusUpdate,
    AdminQuestionResponse,
    FeedbackResponse,
)
from app.routers.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.post("/resources", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    payload: AdminResourceCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Creates a new learning resource attached to a curriculum topic.
    Restricted to users with 'admin' role.
    """
    topic = db.query(Topic).filter(Topic.id == payload.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    new_resource = Resource(
        topic_id=payload.topic_id,
        title=payload.title.strip(),
        resource_type=payload.resource_type,
        url=payload.url.strip(),
        difficulty=payload.difficulty,
        estimated_minutes=payload.estimated_minutes,
        summary=payload.summary,
        version=1,
        is_active=True,
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)

    return ResourceResponse(
        id=new_resource.id,
        topic_id=new_resource.topic_id,
        topic_name=topic.name,
        title=new_resource.title,
        resource_type=new_resource.resource_type,
        url=new_resource.url,
        difficulty=new_resource.difficulty,
        estimated_minutes=new_resource.estimated_minutes,
        summary=new_resource.summary,
    )


@router.post("/resources/{resource_id}/version", response_model=ResourceResponse)
def bump_resource_version(
    resource_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Bumps the immutable version counter for a learning resource (FR-CUR-04).
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource.version = (resource.version or 1) + 1
    db.commit()
    db.refresh(resource)

    return ResourceResponse(
        id=resource.id,
        topic_id=resource.topic_id,
        topic_name=resource.topic.name if resource.topic else None,
        title=resource.title,
        resource_type=resource.resource_type,
        url=resource.url,
        difficulty=resource.difficulty,
        estimated_minutes=resource.estimated_minutes,
        summary=resource.summary,
    )


@router.post("/questions", response_model=AdminQuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    payload: AdminQuestionCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Authors a diagnostic or practice test question with lifecycle status tracking.
    """
    topic = db.query(Topic).filter(Topic.id == payload.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    valid_statuses = {"draft", "review", "published", "archived"}
    status_clean = payload.status.lower()
    if status_clean not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid lifecycle status '{payload.status}'. Must be one of {valid_statuses}",
        )

    if payload.correct_answer not in payload.options:
        raise HTTPException(
            status_code=400,
            detail="correct_answer must be one of the choices in options list",
        )

    new_question = Question(
        topic_id=payload.topic_id,
        question_text=payload.question_text.strip(),
        options=json.dumps(payload.options),
        correct_answer=payload.correct_answer.strip(),
        difficulty=payload.difficulty,
        explanation=payload.explanation,
        status=status_clean,
        version=1,
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return AdminQuestionResponse(
        id=new_question.id,
        topic_id=new_question.topic_id,
        question_text=new_question.question_text,
        options=payload.options,
        correct_answer=new_question.correct_answer,
        difficulty=new_question.difficulty,
        explanation=new_question.explanation,
        status=new_question.status,
        version=new_question.version,
    )


@router.patch("/questions/{question_id}/status", response_model=AdminQuestionResponse)
def update_question_status(
    question_id: int,
    payload: AdminQuestionStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Transitions the editorial lifecycle state of a question (FR-ADMIN-01).
    Valid transitions: draft -> review -> published -> archived.
    """
    valid_statuses = {"draft", "review", "published", "archived"}
    status_clean = payload.status.lower()
    if status_clean not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Must be one of {valid_statuses}",
        )

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.status = status_clean
    db.commit()
    db.refresh(question)

    options_list = json.loads(question.options) if isinstance(question.options, str) else question.options
    return AdminQuestionResponse(
        id=question.id,
        topic_id=question.topic_id,
        question_text=question.question_text,
        options=options_list,
        correct_answer=question.correct_answer,
        difficulty=question.difficulty,
        explanation=question.explanation,
        status=question.status,
        version=question.version or 1,
    )


@router.get("/questions", response_model=List[AdminQuestionResponse])
def list_questions(
    status: Optional[str] = Query(None, description="Filter by status (draft, review, published, archived)"),
    topic_id: Optional[int] = Query(None, description="Filter by topic ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Retrieves questions with optional filtering by status and topic.
    """
    query = db.query(Question)
    if status:
        query = query.filter(Question.status == status.lower())
    if topic_id:
        query = query.filter(Question.topic_id == topic_id)

    questions = query.offset(skip).limit(limit).all()
    results = []
    for q in questions:
        opts = json.loads(q.options) if isinstance(q.options, str) else q.options
        results.append(
            AdminQuestionResponse(
                id=q.id,
                topic_id=q.topic_id,
                question_text=q.question_text,
                options=opts,
                correct_answer=q.correct_answer,
                difficulty=q.difficulty,
                explanation=q.explanation,
                status=q.status or "published",
                version=q.version or 1,
            )
        )
    return results


@router.get("/feedback", response_model=List[FeedbackResponse])
def list_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    feedback_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Retrieves student feedback, bug reports, and ratings for editorial review.
    """
    query = db.query(Feedback)
    if feedback_type:
        query = query.filter(Feedback.feedback_type == feedback_type)
    return query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/analytics/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Provides privacy-preserving platform-wide telemetry and activity statistics (FR-ADMIN-02).
    """
    total_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_attempts = db.query(func.count(QuizAttempt.id)).scalar() or 0
    total_questions = db.query(func.count(Question.id)).scalar() or 0
    
    # Question lifecycle counts
    draft_count = db.query(func.count(Question.id)).filter(Question.status == "draft").scalar() or 0
    published_count = db.query(func.count(Question.id)).filter(Question.status == "published").scalar() or 0

    # Aggregate accuracy
    correct_attempts = db.query(func.count(QuizAttempt.id)).filter(QuizAttempt.is_correct == True).scalar() or 0
    accuracy_rate = (correct_attempts / total_attempts) if total_attempts > 0 else 0.0

    return {
        "total_active_students": total_users,
        "total_quiz_attempts": total_attempts,
        "overall_accuracy_rate": round(accuracy_rate, 4),
        "questions_overview": {
            "total": total_questions,
            "published": published_count,
            "draft": draft_count,
        },
    }
