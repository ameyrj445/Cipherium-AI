import pytest
from app.services.tutor import ask_ai_tutor, KNOWLEDGE_BASE

def test_tutor_knowledge_base():
    ans = ask_ai_tutor(
        user_message="What is an array?",
        topic_code="DSA-ARRAYS",
        topic_name="Arrays & Two-Pointer Patterns"
    )
    assert "Arrays" in ans or "Array" in ans
    assert len(ans) > 40

def test_tutor_chat_endpoint(client, auth_headers):
    payload = {
        "message": "Can you explain B-Tree database indexes?",
        "topic_id": 5
    }
    response = client.post("/tutor/chat", headers=auth_headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0

def test_tutor_history_endpoint(client, auth_headers):
    # Send a message first
    client.post(
        "/tutor/chat",
        headers=auth_headers,
        json={"message": "Hello tutor!"}
    )
    # Check history
    response = client.get("/tutor/history", headers=auth_headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) >= 2 # 1 user + 1 assistant
    roles = [m["role"] for m in history]
    assert "user" in roles
    assert "assistant" in roles
