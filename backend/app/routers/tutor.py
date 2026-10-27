"""
Cipherium AI - AI Tutor API Router

Endpoints:
  POST /tutor/chat    - Interactive pedagogical tutoring with curriculum grounding
  GET  /tutor/history - Retrieve persistent conversation dialogue history
"""

import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Topic, TutorMessage, User
from app.schemas import TutorChatRequest, TutorChatResponse, ResourceResponse
from app.routers.auth import get_current_user
from app.services.tutor import ask_ai_tutor, stream_ai_tutor

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
    clean_msg = (req.message or "").strip()
    if not clean_msg:
        raise HTTPException(status_code=422, detail="Question message cannot be empty.")

    topic = None
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()

    # 1. Record incoming student message
    user_msg_record = TutorMessage(
        user_id=current_user.id,
        role="user",
        message=clean_msg,
        topic_id=req.topic_id
    )
    db.add(user_msg_record)
    db.commit()

    # 2. Generate grounded pedagogical explanation
    ai_answer = ask_ai_tutor(
        user_message=req.message,
        topic_code=topic.code if topic else None,
        topic_name=topic.name if topic else None,
        mode=req.mode or "socratic"
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
        suggested_resources=suggested_resources,
        mode=req.mode or "socratic"
    )


@router.post("/tutor/chat/stream")
def stream_chat_with_tutor(
    req: TutorChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Streams interactive pedagogical AI Tutor dialogue over Server-Sent Events (SSE).
    Yields data: {"chunk": "...", "done": false} as tokens generate, followed by
    data: {"chunk": "", "done": true, "topic_name": "...", "suggested_resources": [...]} on completion.
    """
    clean_msg = (req.message or "").strip()
    if not clean_msg:
        raise HTTPException(status_code=422, detail="Question message cannot be empty.")

    topic = None
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()

    # 1. Record incoming student message
    user_msg_record = TutorMessage(
        user_id=current_user.id,
        role="user",
        message=clean_msg,
        topic_id=req.topic_id
    )
    db.add(user_msg_record)
    db.commit()

    # 2. Prepare curated resources
    suggested_resources = []
    if topic:
        for r in topic.resources[:2]:
            suggested_resources.append({
                "id": r.id,
                "topic_id": r.topic_id,
                "topic_name": topic.name,
                "title": r.title,
                "resource_type": r.resource_type,
                "url": r.url,
                "difficulty": r.difficulty,
                "estimated_minutes": r.estimated_minutes,
                "summary": r.summary
            })

    def event_stream():
        accumulated_chunks = []
        for chunk in stream_ai_tutor(
            user_message=req.message,
            topic_code=topic.code if topic else None,
            topic_name=topic.name if topic else None,
            mode=req.mode or "socratic"
        ):
            accumulated_chunks.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"

        full_answer = "".join(accumulated_chunks)
        # Final event with completion signal and metadata
        yield f"data: {json.dumps({'chunk': '', 'done': True, 'topic_name': topic.name if topic else None, 'suggested_resources': suggested_resources, 'mode': req.mode or 'socratic'})}\n\n"

        # Persist assistant response to DB
        assistant_record = TutorMessage(
            user_id=current_user.id,
            role="assistant",
            message=full_answer,
            topic_id=req.topic_id
        )
        db.add(assistant_record)
        db.commit()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
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
