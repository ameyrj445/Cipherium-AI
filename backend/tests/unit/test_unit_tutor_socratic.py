import json
import pytest
from app.services.tutor import ask_ai_tutor, stream_ai_tutor
from app.schemas import TutorChatRequest, TutorChatResponse

def test_socratic_mode_scaffolding():
    answer = ask_ai_tutor(
        user_message="How do I find a cycle in a linked list?",
        topic_code="DSA-LINKEDLIST",
        topic_name="Linked Lists",
        mode="socratic"
    )
    assert len(answer) > 50
    # In Socratic mode, tutor should provide guiding questions or scaffolding hints
    lower_ans = answer.lower()
    assert any(term in lower_ans for term in ["consider", "hint", "think", "what if", "scaffold", "guided", "pointer", "question"])

def test_direct_mode_explanation():
    answer = ask_ai_tutor(
        user_message="Explain Binary Search Trees",
        topic_code="DSA-TREES",
        topic_name="Trees & Binary Search Trees",
        mode="direct"
    )
    assert len(answer) > 50
    assert "Trees" in answer or "Binary Search" in answer

def test_exam_prep_mode_breakdown():
    answer = ask_ai_tutor(
        user_message="What is the complexity of quicksort and common pitfalls?",
        topic_code="DSA-ARRAYS",
        topic_name="Arrays & Sorting",
        mode="exam_prep"
    )
    assert len(answer) > 50
    lower_ans = answer.lower()
    assert any(term in lower_ans for term in ["o(", "complexity", "pitfall", "edge case", "exam", "time", "space"])

def test_streaming_tutor_generator():
    chunks = list(stream_ai_tutor(
        user_message="What is an index in SQL?",
        topic_code="SQL-INDEXES",
        topic_name="Database Indexes",
        mode="socratic"
    ))
    assert len(chunks) > 1
    reconstructed = "".join(chunks)
    assert len(reconstructed) > 50
    assert "index" in reconstructed.lower()

def test_tutor_chat_request_schema():
    req = TutorChatRequest(message="Help with graphs", mode="socratic", topic_id=4)
    assert req.mode == "socratic"
    assert req.topic_id == 4

    default_req = TutorChatRequest(message="Help with graphs")
    assert default_req.mode == "socratic"

def test_tutor_stream_endpoint_sse(client, auth_headers):
    payload = {
        "message": "Can you explain B-Tree database indexes in Socratic mode?",
        "topic_id": 5,
        "mode": "socratic"
    }
    response = client.post("/tutor/chat/stream", headers=auth_headers, json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    # Parse SSE stream chunks
    lines = response.text.strip().split("\n\n")
    assert len(lines) >= 2

    has_data_chunk = False
    has_done_signal = False

    for event in lines:
        if event.startswith("data: "):
            payload = json.loads(event[6:])
            if payload.get("done") is True:
                has_done_signal = True
            elif "chunk" in payload:
                has_data_chunk = True

    assert has_data_chunk is True
    assert has_done_signal is True
