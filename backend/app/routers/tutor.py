"""
Cipherium AI - AI Tutor API Router

Endpoints:
  POST /tutor/chat    - Interactive pedagogical tutoring with curriculum grounding
  GET  /tutor/history - Retrieve persistent conversation dialogue history
"""

import json
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Topic, TutorMessage, User, TutorConversation, utc_now
from app.schemas import TutorChatRequest, TutorChatResponse, ResourceResponse, TutorConversationCreate, TutorConversationResponse, TutorMessageDetail
from app.routers.auth import get_current_user
from app.services.tutor import ask_ai_tutor, generate_tutor_response, stream_ai_tutor
from app.services.rag import retrieve_context_with_ids
from app.utils.sanitize import sanitize_user_input
from app.limiter import limiter

router = APIRouter(tags=["AI Tutor"])


@router.post("/tutor/chat", response_model=TutorChatResponse)
@limiter.limit("30/minute")
def chat_with_tutor(
    request: Request,
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
    try:
        clean_msg = sanitize_user_input(clean_msg)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    topic = None
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()

    conversation = None
    if req.conversation_id:
        conversation = db.query(TutorConversation).filter(
            TutorConversation.id == req.conversation_id,
            TutorConversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation session not found")
        conversation.updated_at = utc_now()

    # 1. Record incoming student message
    user_msg_record = TutorMessage(
        user_id=current_user.id,
        role="user",
        message=clean_msg,
        topic_id=req.topic_id,
        conversation_id=conversation.id if conversation else None
    )
    db.add(user_msg_record)
    db.commit()

    # 2. Generate grounded pedagogical explanation
    ai_answer, latency_ms, token_count, retrieval_chunk_ids = generate_tutor_response(
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
        topic_id=req.topic_id,
        conversation_id=conversation.id if conversation else None,
        latency_ms=latency_ms,
        token_count=token_count,
        retrieval_chunk_ids=json.dumps(retrieval_chunk_ids),
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
@limiter.limit("30/minute")
def stream_chat_with_tutor(
    request: Request,
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
    try:
        clean_msg = sanitize_user_input(clean_msg)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    topic = None
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()

    conversation = None
    if req.conversation_id:
        conversation = db.query(TutorConversation).filter(
            TutorConversation.id == req.conversation_id,
            TutorConversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation session not found")
        conversation.updated_at = utc_now()

    # 1. Record incoming student message
    user_msg_record = TutorMessage(
        user_id=current_user.id,
        role="user",
        message=clean_msg,
        topic_id=req.topic_id,
        conversation_id=conversation.id if conversation else None
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
        start = time.monotonic()
        _, retrieval_chunk_ids = retrieve_context_with_ids(clean_msg)
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
            topic_id=req.topic_id,
            conversation_id=conversation.id if conversation else None,
            latency_ms=int((time.monotonic() - start) * 1000),
            token_count=len(full_answer.split()),
            retrieval_chunk_ids=json.dumps(retrieval_chunk_ids),
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


@router.post("/tutor/conversations", response_model=TutorConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: TutorConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initializes a new persistent tutoring conversation thread (FR-TUTOR).
    """
    title = payload.title.strip() if payload.title and payload.title.strip() else None
    if not title:
        if payload.topic_id:
            topic = db.query(Topic).filter(Topic.id == payload.topic_id).first()
            title = f"{topic.name} Discussion" if topic else "New Conversation"
        else:
            title = "New Conversation"

    new_conv = TutorConversation(
        user_id=current_user.id,
        topic_id=payload.topic_id,
        title=title,
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    return new_conv


@router.get("/tutor/conversations", response_model=List[TutorConversationResponse])
def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all conversation sessions belonging to the authenticated learner.
    """
    return (
        db.query(TutorConversation)
        .filter(TutorConversation.user_id == current_user.id)
        .order_by(TutorConversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/tutor/conversations/{conversation_id}/messages", response_model=List[TutorMessageDetail])
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the complete message history for a specific conversation session.
    """
    conv = db.query(TutorConversation).filter(
        TutorConversation.id == conversation_id,
        TutorConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    messages = (
        db.query(TutorMessage)
        .filter(TutorMessage.conversation_id == conversation_id)
        .order_by(TutorMessage.created_at.asc())
        .all()
    )
    return messages


@router.post("/tutor/conversations/{conversation_id}/messages", response_model=TutorChatResponse)
@limiter.limit("30/minute")
def send_conversation_message(
    conversation_id: int,
    request: Request,
    req: TutorChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a student question scoped to a specific persistent conversation thread.
    """
    conv = db.query(TutorConversation).filter(
        TutorConversation.id == conversation_id,
        TutorConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found")

    req.conversation_id = conv.id
    if not req.topic_id and conv.topic_id:
        req.topic_id = conv.topic_id

    response = chat_with_tutor(request=request, req=req, db=db, current_user=current_user)

    # Auto-title conversation if it still has default title
    if conv.title in ["New Conversation", "", None]:
        preview = req.message.strip().split("\n")[0]
        conv.title = (preview[:47] + "...") if len(preview) > 50 else preview
        db.commit()

    return response
