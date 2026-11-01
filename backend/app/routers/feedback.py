"""
Cipherium AI - Recommendation & Tutoring Feedback API Router

Endpoints:
  POST /feedback    - Submit learner feedback, ratings, and content flags (FR-REC-04)
  GET  /feedback/my - Retrieve submission history for the authenticated user
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Feedback, User, UserSettings
from app.schemas import FeedbackCreate, FeedbackResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback & Recommendations"])

ALLOWED_FEEDBACK_TYPES = {
    "tutor_rating",
    "rec_rating",
    "bug",
    "too_easy",
    "too_hard",
    "not_relevant",
}

DIFFICULTY_STAIRCASE_UP = {
    "gradual": "standard",
    "standard": "rigorous",
    "rigorous": "rigorous",
}

DIFFICULTY_STAIRCASE_DOWN = {
    "rigorous": "standard",
    "standard": "gradual",
    "gradual": "gradual",
}


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submits student feedback on recommendations, AI tutoring dialogues, or bug reports.
    Automatically adjusts the learner's difficulty preference when 'too_easy' or 'too_hard'
    signals are received (FR-REC-04).
    """
    type_clean = payload.feedback_type.strip().lower()
    if type_clean not in ALLOWED_FEEDBACK_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid feedback_type '{payload.feedback_type}'. Allowed types: {list(ALLOWED_FEEDBACK_TYPES)}",
        )

    if payload.rating is not None and payload.rating not in {-1, 0, 1}:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid rating '{payload.rating}'. Rating must be one of -1, 0, or 1.",
        )

    # Adaptive difficulty calibration
    if type_clean in ("too_easy", "too_hard"):
        settings = (
            db.query(UserSettings)
            .filter(UserSettings.user_id == current_user.id)
            .first()
        )
        if not settings:
            settings = UserSettings(user_id=current_user.id, difficulty_mode="standard")
            db.add(settings)
            db.flush()

        current_mode = (settings.difficulty_mode or "standard").lower()
        if type_clean == "too_easy":
            settings.difficulty_mode = DIFFICULTY_STAIRCASE_UP.get(current_mode, "rigorous")
        elif type_clean == "too_hard":
            settings.difficulty_mode = DIFFICULTY_STAIRCASE_DOWN.get(current_mode, "gradual")

    record = Feedback(
        user_id=current_user.id,
        feedback_type=type_clean,
        target_id=payload.target_id,
        rating=payload.rating,
        comment=payload.comment.strip() if payload.comment else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get("/my", response_model=List[FeedbackResponse])
def get_my_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves chronological feedback submissions created by the authenticated learner.
    """
    return (
        db.query(Feedback)
        .filter(Feedback.user_id == current_user.id)
        .order_by(Feedback.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
