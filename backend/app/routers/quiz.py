"""
Cipherium AI - Quiz & Diagnostic Assessment API Router

Endpoints:
  GET  /topics          - Retrieve all curriculum topics
  GET  /quizzes/next    - Adaptive question generator (difficulty staircase 1–5)
  POST /quizzes/attempts- Submit quiz attempt & automatically update topic mastery
  POST /quizzes/exam    - Generate timed mock diagnostic examination
"""

import json
import random
from uuid import uuid4
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Topic, Question, QuizAttempt, TopicMastery, QuizSession, User, SubjectRoadmap, utc_now
from app.schemas import TopicResponse, QuestionResponse, QuizAttemptSubmit, QuizAttemptResult
from app.routers.auth import get_current_user
from app.services.analytics import calculate_topic_mastery, calculate_adaptive_difficulty, calculate_topic_cognitive_state
from app.services.bkt_service import update_bkt_with_audit
from app.services.study_plan_generator import regenerate_if_stale
from app.services.quiz_lock import clear_quiz_lock, set_quiz_lock
from app.utils.idempotency import get_cached, store_cached

router = APIRouter(tags=["Topics & Quizzes"])


def _subject_topic_filters(roadmap_json: str) -> tuple[set[int], set[str]]:
    """Extract Topic ids/codes from a flexible SubjectRoadmap JSON payload."""
    try:
        roadmap = json.loads(roadmap_json)
    except (TypeError, json.JSONDecodeError):
        return set(), set()

    topic_ids: set[int] = set()
    topic_codes: set[str] = set()

    def add_reference(value) -> None:
        if isinstance(value, int):
            topic_ids.add(value)
        elif isinstance(value, str):
            topic_codes.add(value)

    def visit(value, topic_entry: bool = False) -> None:
        if isinstance(value, list):
            for item in value:
                visit(item, topic_entry=topic_entry)
        elif isinstance(value, dict):
            for key in ("topic_ids", "topic_codes"):
                if key in value:
                    for reference in value[key] if isinstance(value[key], list) else [value[key]]:
                        add_reference(reference)
            if topic_entry:
                for key in ("topic_id", "id", "code"):
                    if key in value:
                        add_reference(value[key])
            for key, child in value.items():
                if key not in {"topic_ids", "topic_codes"}:
                    visit(child, topic_entry=(key == "topics"))

    visit(roadmap)
    return topic_ids, topic_codes


@router.get("/topics", response_model=List[TopicResponse])
def get_topics(subject_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    """
    Returns the comprehensive list of computer science curriculum topics.
    Used by frontend dropdowns, study plan milestones, and mastery bar charts.
    """
    query = db.query(Topic)
    if subject_id is not None:
        subject = db.query(SubjectRoadmap).filter(SubjectRoadmap.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        topic_ids, topic_codes = _subject_topic_filters(subject.roadmap_json)
        if not topic_ids and not topic_codes:
            return []
        filters = []
        if topic_ids:
            filters.append(Topic.id.in_(topic_ids))
        if topic_codes:
            filters.append(Topic.code.in_(topic_codes))
        from sqlalchemy import or_
        query = query.filter(or_(*filters))
    return query.order_by(Topic.id.asc()).all()


@router.get("/quizzes/next", response_model=QuestionResponse)
def get_next_question(
    topic_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adaptive question selection algorithm:
    1. If `topic_id` is supplied, fetches the student's recent attempts for that topic.
    2. Calculates the student's adaptive difficulty level (1-5) using short-term precision.
    3. Queries unattempted questions to avoid immediate repetition.
    4. Strips the answer explanation from the response payload to prevent browser inspection.
    """
    query = db.query(Question).filter(Question.status == "published")
    if topic_id:
        query = query.filter(Question.topic_id == topic_id)
        
        # Look back over recent attempts to calibrate difficulty staircase
        recent_attempts = (
            db.query(QuizAttempt)
            .join(Question)
            .filter(QuizAttempt.user_id == current_user.id, Question.topic_id == topic_id)
            .order_by(QuizAttempt.attempted_at.desc())
            .limit(5)
            .all()
        )
        adaptive_diff = calculate_adaptive_difficulty(current_difficulty=2, recent_attempts=recent_attempts)
        query = query.filter(Question.difficulty <= adaptive_diff + 1)

    questions = query.all()
    if not questions:
        # Fallback to general question pool if no topic-filtered questions remain
        questions = db.query(Question).filter(Question.status == "published").all()
        if not questions:
            raise HTTPException(status_code=404, detail="No questions available in the curriculum pool.")

    # Prioritize questions the user has not yet attempted
    user_attempted_qids = {
        a.question_id for a in db.query(QuizAttempt.question_id).filter(QuizAttempt.user_id == current_user.id).all()
    }
    unattempted = [q for q in questions if q.id not in user_attempted_qids]
    chosen = random.choice(unattempted) if unattempted else random.choice(questions)

    # Parse and shuffle answer options to prevent positional bias
    options_list = json.loads(chosen.options)
    random.shuffle(options_list)

    return QuestionResponse(
        id=chosen.id,
        topic_id=chosen.topic_id,
        topic_name=chosen.topic.name if chosen.topic else "",
        question_text=chosen.question_text,
        options=options_list,
        difficulty=chosen.difficulty,
        explanation=None  # Explicitly omitted until user submits an answer
    )


@router.post("/quizzes/attempts", response_model=QuizAttemptResult)
def submit_quiz_attempt(
    attempt_data: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    """
    Evaluates a student's answer submission, records telemetry, and
    recomputes the student's mastery score for that curriculum topic.
    """
    # Prefix with the authenticated user id so one user's key cannot expose
    # another user's quiz result.
    cache_key = f"quiz-attempt:{current_user.id}:{idempotency_key}" if idempotency_key else None
    if cache_key:
        cached_response = get_cached(cache_key)
        if cached_response is not None:
            return cached_response

    session = None
    if attempt_data.session_id is not None:
        session = (
            db.query(QuizSession)
            .filter(QuizSession.id == attempt_data.session_id, QuizSession.user_id == current_user.id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Quiz session not found")
        if session.status != "active":
            raise HTTPException(status_code=409, detail="Quiz session is already completed")
    elif attempt_data.quiz_id:
        # Preserve clients that already group attempts via the legacy quiz_id.
        session = (
            db.query(QuizSession)
            .join(QuizAttempt)
            .filter(QuizAttempt.user_id == current_user.id, QuizAttempt.quiz_id == attempt_data.quiz_id)
            .order_by(QuizSession.id.asc())
            .first()
        )
    if session is None:
        session = QuizSession(user_id=current_user.id, session_type="adaptive", status="active")
        db.add(session)
        db.flush()

    question = db.query(Question).filter(Question.id == attempt_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if attempt_data.hint_count < 0:
        raise HTTPException(status_code=422, detail="hint_count cannot be negative")

    # A valid quiz interaction activates the anti-cheat tutor lock for the
    # session's lifetime (two hours when no Redis service is configured).
    set_quiz_lock(current_user.id)

    # Case-insensitive whitespace-trimmed evaluation with NoneType safety
    selected_clean = (attempt_data.selected_answer or "").strip().lower()
    correct_clean = (question.correct_answer or "").strip().lower()
    is_correct = (selected_clean == correct_clean) and bool(selected_clean)

    attempt = QuizAttempt(
        user_id=current_user.id,
        question_id=question.id,
        session_id=session.id,
        selected_answer=attempt_data.selected_answer,
        is_correct=is_correct,
        time_taken_seconds=attempt_data.time_taken_seconds,
        hint_count=attempt_data.hint_count,
        quiz_id=attempt_data.quiz_id or str(session.id),
        is_finalized=False,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # A submitted answer is deliberately not folded into TopicMastery until the
    # session is completed.  This makes completion atomic across all its topics.
    # We still calculate its cognitive state for immediate feedback.
    topic_attempts = (
        db.query(QuizAttempt)
        .join(Question)
        .filter(QuizAttempt.user_id == current_user.id, Question.topic_id == question.topic_id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )

    mastery_score, status, total_att, correct_att = calculate_topic_mastery(topic_attempts)
    cog_state = update_bkt_with_audit(
        topic_attempts,
        db=db,
        user_id=current_user.id,
        topic_id=question.topic_id,
        posterior_penalty=0.05 * attempt.hint_count,
    )
    db.commit()

    response = QuizAttemptResult(
        id=attempt.id,
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        topic_id=question.topic_id,
        topic_name=question.topic.name if question.topic else "",
        new_mastery_score=mastery_score,
        new_status=status,
        bkt_probability=cog_state["bkt_probability"],
        retention_rate=cog_state["retention_rate"],
        next_review_due=cog_state["next_review_due"],
        retention_status=cog_state["retention_status"],
        quiz_id=attempt.quiz_id,
        session_id=attempt.session_id,
    )
    if cache_key:
        cached_response = jsonable_encoder(response)
        store_cached(cache_key, cached_response)
        return cached_response
    return response


@router.get("/quizzes/{quiz_id}")
def get_quiz_session(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return session metadata and question ids without exposing answer keys."""
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id, QuizAttempt.quiz_id == quiz_id)
        .order_by(QuizAttempt.attempted_at.asc(), QuizAttempt.id.asc())
        .all()
    )
    if not attempts:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    return {
        "id": quiz_id,
        "total_questions": len(attempts),
        "is_finalized": all(a.is_finalized for a in attempts),
        "question_ids": [a.question_id for a in attempts],
    }


@router.post("/quizzes/{quiz_id}/complete")
def complete_quiz_session(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Finalize one session and atomically apply its topic-level mastery changes."""
    attempts = (
        db.query(QuizAttempt)
        .join(Question)
        .filter(QuizAttempt.user_id == current_user.id, QuizAttempt.quiz_id == quiz_id)
        .order_by(QuizAttempt.attempted_at.asc(), QuizAttempt.id.asc())
        .all()
    )
    if not attempts:
        raise HTTPException(status_code=404, detail="Quiz session not found")

    topic_ids = sorted({attempt.question.topic_id for attempt in attempts})
    deltas = []
    for topic_id in topic_ids:
        mastery = (
            db.query(TopicMastery)
            .filter(TopicMastery.user_id == current_user.id, TopicMastery.topic_id == topic_id)
            .first()
        )
        before = mastery.mastery_score if mastery else 0.0
        topic_attempts = (
            db.query(QuizAttempt)
            .join(Question)
            .filter(QuizAttempt.user_id == current_user.id, Question.topic_id == topic_id)
            .order_by(QuizAttempt.attempted_at.asc(), QuizAttempt.id.asc())
            .all()
        )
        # Run the final chronological BKT pass after the entire session has
        # been recorded.  BKT is derived from the attempt history (rather than
        # persisted separately), so analytics will read this same final state.
        calculate_topic_cognitive_state(topic_attempts)
        after, status, attempt_count, correct_count = calculate_topic_mastery(topic_attempts)
        if mastery is None:
            mastery = TopicMastery(
                user_id=current_user.id, topic_id=topic_id, mastery_score=after,
                status=status, attempt_count=attempt_count, correct_count=correct_count,
            )
            db.add(mastery)
        else:
            mastery.mastery_score = after
            mastery.status = status
            mastery.attempt_count = attempt_count
            mastery.correct_count = correct_count
        deltas.append({"topic_id": topic_id, "before": round(before, 3), "after": round(after, 3)})

    for attempt in attempts:
        attempt.is_finalized = True
    session_ids = {attempt.session_id for attempt in attempts if attempt.session_id is not None}
    if session_ids:
        db.query(QuizSession).filter(
            QuizSession.user_id == current_user.id,
            QuizSession.id.in_(session_ids),
        ).update({"status": "completed", "completed_at": utc_now()}, synchronize_session=False)
    roadmap_regenerated = regenerate_if_stale(current_user.id, db)
    db.commit()
    clear_quiz_lock(current_user.id)

    score = sum(1 for attempt in attempts if attempt.is_correct)
    total = len(attempts)
    return {
        "score": score,
        "total": total,
        "accuracy_pct": round((score / total) * 100, 2) if total else 0.0,
        "mastery_deltas": deltas,
        "roadmap_regenerated": roadmap_regenerated,
    }


@router.post("/quizzes/exam")
def generate_diagnostic_exam(
    topic_ids: Optional[List[int]] = Query(None),
    question_count: int = Query(5, ge=1, le=20),
    time_limit_minutes: int = Query(10, ge=1, le=120),
    max_difficulty: int = Query(3, ge=1, le=5),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Synthesizes a timed mock diagnostic exam calibrated to a maximum difficulty level.
    Aggregates questions across specified topics with shuffled options for standardized testing.
    """
    query = db.query(Question).filter(Question.status == "published").filter(Question.difficulty <= max_difficulty)
    if topic_ids:
        query = query.filter(Question.topic_id.in_(topic_ids))
    
    available_questions = query.all()
    if not available_questions:
        raise HTTPException(
            status_code=404,
            detail="No questions match the requested exam criteria."
        )

    # Randomly sample the desired number of questions
    selected_sample = random.sample(
        available_questions,
        min(question_count, len(available_questions))
    )

    exam_payload = []
    for q in selected_sample:
        opts = json.loads(q.options)
        random.shuffle(opts)
        exam_payload.append({
            "id": q.id,
            "topic_id": q.topic_id,
            "topic_name": q.topic.name if q.topic else "",
            "question_text": q.question_text,
            "options": opts,
            "difficulty": q.difficulty,
            "allocated_seconds": q.difficulty * 45,  # Proportional time budget per question
            "correct_answer": q.correct_answer,
            "explanation": q.explanation or ""
        })

    return {
        "exam_id": f"exam-{random.randint(1000, 9999)}",
        "exam_title": "Timed Diagnostic Benchmark Assessment",
        "total_questions": len(exam_payload),
        "time_limit_minutes": time_limit_minutes,
        "total_time_seconds": time_limit_minutes * 60,
        "questions": exam_payload
    }
