from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Topic, Resource, TutorMessage, User
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
    topic = None
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()

    # Save user message
    user_msg_record = TutorMessage(
        user_id=current_user.id,
        role="user",
        message=req.message,
        topic_id=req.topic_id
    )
    db.add(user_msg_record)
    db.commit()

    # Generate answer
    ai_answer = ask_ai_tutor(
        user_message=req.message,
        topic_code=topic.code if topic else None,
        topic_name=topic.name if topic else None
    )

    # Save tutor response
    assistant_msg_record = TutorMessage(
        user_id=current_user.id,
        role="assistant",
        message=ai_answer,
        topic_id=req.topic_id
    )
    db.add(assistant_msg_record)
    db.commit()

    # Suggest relevant learning resources
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
