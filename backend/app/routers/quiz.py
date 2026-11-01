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
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Topic, Question, QuizAttempt, TopicMastery, User
from app.schemas import TopicResponse, QuestionResponse, QuizAttemptSubmit, QuizAttemptResult
from app.routers.auth import get_current_user
from app.services.analytics import calculate_topic_mastery, calculate_adaptive_difficulty, calculate_topic_cognitive_state

router = APIRouter(tags=["Topics & Quizzes"])


@router.get("/topics", response_model=List[TopicResponse])
def get_topics(db: Session = Depends(get_db)):
    """
    Returns the comprehensive list of computer science curriculum topics.
    Used by frontend dropdowns, study plan milestones, and mastery bar charts.
    """
    return db.query(Topic).all()


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
    query = db.query(Question)
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
        questions = db.query(Question).all()
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
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates a student's answer submission, records telemetry, and
    recomputes the student's mastery score for that curriculum topic.
    """
    question = db.query(Question).filter(Question.id == attempt_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Case-insensitive whitespace-trimmed evaluation with NoneType safety
    selected_clean = (attempt_data.selected_answer or "").strip().lower()
    correct_clean = (question.correct_answer or "").strip().lower()
    is_correct = (selected_clean == correct_clean) and bool(selected_clean)

    attempt = QuizAttempt(
        user_id=current_user.id,
        question_id=question.id,
        selected_answer=attempt_data.selected_answer,
        is_correct=is_correct,
        time_taken_seconds=attempt_data.time_taken_seconds
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Query all historical attempts by this user for the topic to recalculate mastery
    topic_attempts = (
        db.query(QuizAttempt)
        .join(Question)
        .filter(QuizAttempt.user_id == current_user.id, Question.topic_id == question.topic_id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )

    mastery_score, status, total_att, correct_att = calculate_topic_mastery(topic_attempts)
    cog_state = calculate_topic_cognitive_state(topic_attempts)

    # Upsert TopicMastery record
    tm = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id, TopicMastery.topic_id == question.topic_id)
        .first()
    )
    if not tm:
        tm = TopicMastery(
            user_id=current_user.id,
            topic_id=question.topic_id,
            mastery_score=mastery_score,
            status=status,
            attempt_count=total_att,
            correct_count=correct_att
        )
        db.add(tm)
    else:
        tm.mastery_score = mastery_score
        tm.status = status
        tm.attempt_count = total_att
        tm.correct_count = correct_att
    
    db.commit()

    return QuizAttemptResult(
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
        retention_status=cog_state["retention_status"]
    )


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
    query = db.query(Question).filter(Question.difficulty <= max_difficulty)
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
