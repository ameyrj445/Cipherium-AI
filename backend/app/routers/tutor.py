"""
Cipherium AI - AI Tutor API Router

Endpoints:
  POST /tutor/chat    - Interactive pedagogical tutoring with curriculum grounding
  GET  /tutor/history - Retrieve persistent conversation dialogue history
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Topic, TutorMessage, User
from app.schemas import TutorChatRequest, TutorChatResponse, ResourceResponse
from app.routers.auth import get_current_user
from app.services.tutor import ask_ai_tutor

router = APIRouter(tags=["AI Tutor"])


@router.post("/tutor/chat", response_model=TutorChatResponse)
def chat_with_tutor(
    req: TutorChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Handles interactive dialogue with the pedagogical AI Tutor.
    
    Processing Steps:
    1. Resolves syllabus topic metadata if a `topic_id` is specified by the student.
    2. Persists the student's question to the database for dialogue history tracking.
    3. Synthesizes an empathetic academic explanation using either the Gemini LLM
       or the grounded fallback pedagogical engine.
    4. Persists the tutor's response to the database.
    5. Attaches up to two curated learning resources to encourage immediate follow-up practice.
    """
    topic = None
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()

    # 1. Record incoming student message
    user_msg_record = TutorMessage(
        user_id=current_user.id,
        role="user",
        message=req.message,
        topic_id=req.topic_id
    )
    db.add(user_msg_record)
    db.commit()

    # 2. Generate grounded pedagogical explanation
    ai_answer = ask_ai_tutor(
        user_message=req.message,
        topic_code=topic.code if topic else None,
        topic_name=topic.name if topic else None
    )

    # 3. Record assistant response
    assistant_msg_record = TutorMessage(
        user_id=current_user.id,
        role="assistant",
        message=ai_answer,
        topic_id=req.topic_id
    )
    db.add(assistant_msg_record)
    db.commit()

    # 4. Attach relevant learning resources matching the selected topic
    suggested_resources: List[ResourceResponse] = []
    if topic:
        for r in topic.resources[:2]:
            suggested_resources.append(
                ResourceResponse(
                    id=r.id,
                    topic_id=r.topic_id,
                    topic_name=topic.name,
                    title=r.title,
                    resource_type=r.resource_type,
                    url=r.url,
                    difficulty=r.difficulty,
                    estimated_minutes=r.estimated_minutes,
                    summary=r.summary
                )
            )

    return TutorChatResponse(
        response=ai_answer,
        topic_name=topic.name if topic else None,
        suggested_resources=suggested_resources
    )


@router.get("/tutor/history")
def get_tutor_history(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves chronological conversation history between the authenticated student
    and the AI tutor. Allows the frontend to reconstruct chat threads upon page reload.
    """
    messages = (
        db.query(TutorMessage)
        .filter(TutorMessage.user_id == current_user.id)
        .order_by(TutorMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    history = []
    for m in messages:
        history.append({
            "id": m.id,
            "role": m.role,
            "message": m.message,
            "topic_id": m.topic_id,
            "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S") if m.created_at else None
        })
    return history
