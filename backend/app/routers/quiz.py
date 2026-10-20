from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import random

from app.database import get_db
from app.models import Topic, Question, QuizAttempt, TopicMastery, User
from app.schemas import TopicResponse, QuestionResponse, QuizAttemptSubmit, QuizAttemptResult
from app.routers.auth import get_current_user
from app.services.analytics import calculate_topic_mastery, calculate_adaptive_difficulty

router = APIRouter(tags=["Topics & Quizzes"])

@router.get("/topics", response_model=List[TopicResponse])
def get_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).all()
    return topics

@router.get("/quizzes/next", response_model=QuestionResponse)
def get_next_question(
    topic_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Question)
    if topic_id:
        query = query.filter(Question.topic_id == topic_id)
        # Fetch user's recent attempts for this topic to adapt difficulty
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
        # Fallback to any question
        questions = db.query(Question).all()
        if not questions:
            raise HTTPException(status_code=404, detail="No questions available")

    # Pick a question with lowest attempt frequency for this user
    user_attempted_qids = {
        a.question_id for a in db.query(QuizAttempt.question_id).filter(QuizAttempt.user_id == current_user.id).all()
    }
    unattempted = [q for q in questions if q.id not in user_attempted_qids]
    chosen = random.choice(unattempted) if unattempted else random.choice(questions)

    options_list = json.loads(chosen.options)
    # Shuffle options for realism
    random.shuffle(options_list)

    return QuestionResponse(
        id=chosen.id,
        topic_id=chosen.topic_id,
        topic_name=chosen.topic.name if chosen.topic else "",
        question_text=chosen.question_text,
        options=options_list,
        difficulty=chosen.difficulty,
        explanation=None # Don't reveal explanation before submission!
    )

@router.post("/quizzes/attempts", response_model=QuizAttemptResult)
def submit_quiz_attempt(
    attempt_data: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(Question).filter(Question.id == attempt_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = (attempt_data.selected_answer.strip().lower() == question.correct_answer.strip().lower())

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

    # Recalculate mastery for the question's topic
    topic_attempts = (
        db.query(QuizAttempt)
        .join(Question)
        .filter(QuizAttempt.user_id == current_user.id, Question.topic_id == question.topic_id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )
    
    mastery_score, status_str, count, correct_count = calculate_topic_mastery(topic_attempts)

    # Update or create TopicMastery record
    tm_record = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id, TopicMastery.topic_id == question.topic_id)
        .first()
    )
    if not tm_record:
        tm_record = TopicMastery(
            user_id=current_user.id,
            topic_id=question.topic_id,
            mastery_score=mastery_score,
            status=status_str,
            attempt_count=count,
            correct_count=correct_count
        )
        db.add(tm_record)
    else:
        tm_record.mastery_score = mastery_score
        tm_record.status = status_str
        tm_record.attempt_count = count
        tm_record.correct_count = correct_count
    
    db.commit()

    return QuizAttemptResult(
        id=attempt.id,
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        topic_id=question.topic_id,
        topic_name=question.topic.name if question.topic else "",
        new_mastery_score=mastery_score,
        new_status=status_str
    )
