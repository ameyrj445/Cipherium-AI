"""
Cipherium AI - Unit & Integration Tests: Jay Sprint 2 Deliverables

Covers:
- J2-1: Admin Content-Authoring API (FR-ADMIN-01 / FR-CUR-04)
- J2-2: Privacy & GDPR Data Export (FR-PROF-02b)
- J2-3: Tutor Conversation Sessions (FR-TUTOR / DB Schema)
- J2-4: Recommendation Feedback API (FR-REC-04)
- J2-5: Data Retention Policy & Stale Message Purge (NFR-PRIV-01)
"""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi import HTTPException

from app.models import User, Topic, Question, Resource, TutorConversation, TutorMessage, UserSettings, Feedback
from app.routers.auth import require_admin
from scripts.retention_purge import purge_stale_tutor_messages


def _get_auth_headers(client, email="student@cipherium.ai", password="cipherium123"):
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _get_admin_headers(client, db_session):
    admin = db_session.query(User).filter(User.email == "admin_test@cipherium.ai").first()
    if not admin:
        from app.services.auth import hash_password
        admin = User(
            name="Admin Test",
            email="admin_test@cipherium.ai",
            password_hash=hash_password("adminpass123"),
            role="admin",
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
    else:
        admin.role = "admin"
        db_session.commit()

    res = client.post("/auth/login", json={"email": "admin_test@cipherium.ai", "password": "adminpass123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# J2-1: Admin Content-Authoring API Tests
# ============================================================================

def test_admin_routes_forbidden_for_regular_student(client, db_session):
    """Verify non-admin student receives 403 Forbidden on all /admin endpoints."""
    student_headers = _get_auth_headers(client)

    res1 = client.post("/admin/resources", json={
        "topic_id": 1,
        "title": "Unauthorized Resource",
        "url": "https://example.com/forbidden",
        "resource_type": "article"
    }, headers=student_headers)
    assert res1.status_code == 403

    res2 = client.post("/admin/questions", json={
        "topic_id": 1,
        "question_text": "Sample text?",
        "options": ["A", "B"],
        "correct_answer": "A",
        "difficulty": 1
    }, headers=student_headers)
    assert res2.status_code == 403

    res3 = client.get("/admin/questions", headers=student_headers)
    assert res3.status_code == 403


def test_admin_create_resource_and_version_bump(client, db_session):
    """Verify admin can create curriculum resource and bump its immutable version."""
    admin_headers = _get_admin_headers(client, db_session)
    topic = db_session.query(Topic).first()

    payload = {
        "topic_id": topic.id,
        "title": "Mastering Dynamic Programming",
        "resource_type": "article",
        "url": "https://cipherium.ai/articles/dp-mastery",
        "difficulty": 3,
        "estimated_minutes": 25,
        "summary": "Deep dive into memoization and tabulation patterns."
    }
    create_res = client.post("/admin/resources", json=payload, headers=admin_headers)
    assert create_res.status_code == 201
    data = create_res.json()
    assert data["title"] == payload["title"]
    resource_id = data["id"]

    # Verify in DB version is 1
    r = db_session.query(Resource).filter(Resource.id == resource_id).first()
    assert r.version == 1
    assert r.is_active is True

    # Bump version
    bump_res = client.post(f"/admin/resources/{resource_id}/version", headers=admin_headers)
    assert bump_res.status_code == 200
    db_session.refresh(r)
    assert r.version == 2


def test_admin_create_question_and_lifecycle_transitions(client, db_session):
    """Verify draft question authoring, status progression, and quiz isolation."""
    admin_headers = _get_admin_headers(client, db_session)
    student_headers = _get_auth_headers(client)
    topic = db_session.query(Topic).first()

    # 1. Admin creates a draft question
    q_payload = {
        "topic_id": topic.id,
        "question_text": "What is the worst-case space complexity of BFS on a tree with branching factor b and depth d?",
        "options": ["O(b^d)", "O(d)", "O(1)", "O(b*d)"],
        "correct_answer": "O(b^d)",
        "difficulty": 4,
        "explanation": "BFS stores all leaves at the deepest level in memory, which is O(b^d).",
        "status": "draft"
    }
    res = client.post("/admin/questions", json=q_payload, headers=admin_headers)
    assert res.status_code == 201
    q_data = res.json()
    q_id = q_data["id"]
    assert q_data["status"] == "draft"

    # 2. Verify draft question is NEVER served in /quizzes/next for students
    next_q_res = client.get(f"/quizzes/next?topic_id={topic.id}", headers=student_headers)
    assert next_q_res.status_code == 200
    assert next_q_res.json()["id"] != q_id

    # 3. Transition to 'review'
    review_res = client.patch(f"/admin/questions/{q_id}/status", json={"status": "review"}, headers=admin_headers)
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "review"

    # Still isolated from student quizzes
    next_q_res = client.get(f"/quizzes/next?topic_id={topic.id}", headers=student_headers)
    assert next_q_res.json()["id"] != q_id

    # 4. Transition to 'published'
    publish_res = client.patch(f"/admin/questions/{q_id}/status", json={"status": "published"}, headers=admin_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "published"

    # 5. Filter list questions by status
    list_drafts = client.get("/admin/questions?status=draft", headers=admin_headers)
    assert list_drafts.status_code == 200
    assert all(item["status"] == "draft" for item in list_drafts.json())

    list_published = client.get("/admin/questions?status=published", headers=admin_headers)
    assert list_published.status_code == 200
    assert any(item["id"] == q_id for item in list_published.json())


# ============================================================================
# J2-2: Privacy & GDPR Data Export Tests
# ============================================================================

def test_gdpr_export_json_structure(client, db_session):
    """Verify GDPR JSON data export returns complete personal archive."""
    headers = _get_auth_headers(client)

    res = client.get("/me/export?format=json", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/json"
    assert "attachment; filename=" in res.headers["content-disposition"]
    assert res.headers["content-disposition"].endswith(".json\"")

    data = res.json()
    assert "metadata" in data
    assert "user" in data
    assert "settings" in data
    assert "masteries" in data
    assert "quiz_history" in data
    assert "daily_tasks" in data
    assert "study_plans" in data
    assert "tutor_dialogue" in data
    assert data["user"]["email"] == "student@cipherium.ai"


def test_gdpr_export_csv_headers_and_data(client, db_session):
    """Verify GDPR CSV export produces expected header structure and flattened records."""
    headers = _get_auth_headers(client)

    res = client.get("/me/export?format=csv", headers=headers)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment; filename=" in res.headers["content-disposition"]
    assert res.headers["content-disposition"].endswith(".csv\"")

    lines = res.text.strip().splitlines()
    assert len(lines) >= 1
    header_line = lines[0].replace("\r", "")
    expected_header = "topic_id,topic_name,mastery_score,attempt_count,last_seen"
    assert header_line == expected_header


def test_gdpr_export_invalid_format_error(client, db_session):
    """Verify requesting an unsupported export format raises 400 Bad Request."""
    headers = _get_auth_headers(client)
    res = client.get("/me/export?format=xml", headers=headers)
    assert res.status_code == 400
    assert "supported formats are 'json' and 'csv'" in res.json()["detail"].lower()


# ============================================================================
# J2-3: Tutor Conversation Sessions Tests
# ============================================================================

def test_tutor_conversation_creation_and_listing(client, db_session):
    """Verify learner can create and list persistent tutor conversation threads."""
    headers = _get_auth_headers(client)
    topic = db_session.query(Topic).first()

    # Create conversation with explicit title
    create_res = client.post("/tutor/conversations", json={
        "topic_id": topic.id,
        "title": "Graph Traversal Algorithms Q&A"
    }, headers=headers)
    assert create_res.status_code == 201
    conv = create_res.json()
    assert conv["title"] == "Graph Traversal Algorithms Q&A"
    assert conv["topic_id"] == topic.id
    conv_id = conv["id"]

    # List conversations
    list_res = client.get("/tutor/conversations", headers=headers)
    assert list_res.status_code == 200
    conversations = list_res.json()
    assert any(c["id"] == conv_id for c in conversations)


def test_tutor_conversation_messages_scoping(client, db_session):
    """Verify sending a message to a conversation stores it under that session."""
    headers = _get_auth_headers(client)
    topic = db_session.query(Topic).first()

    # Create session
    conv_res = client.post("/tutor/conversations", json={
        "topic_id": topic.id
    }, headers=headers)
    conv_id = conv_res.json()["id"]

    # Send message scoped to conversation
    chat_res = client.post(f"/tutor/conversations/{conv_id}/messages", json={
        "message": "Can you explain Dijkstra's algorithm step-by-step?",
        "mode": "socratic"
    }, headers=headers)
    assert chat_res.status_code == 200
    assert "response" in chat_res.json()

    # Retrieve conversation messages
    msgs_res = client.get(f"/tutor/conversations/{conv_id}/messages", headers=headers)
    assert msgs_res.status_code == 200
    messages = msgs_res.json()
    assert len(messages) >= 2  # At least user prompt and assistant explanation
    assert messages[0]["role"] == "user"
    assert messages[0]["conversation_id"] == conv_id
    assert messages[1]["role"] == "assistant"
    assert messages[1]["conversation_id"] == conv_id


# ============================================================================
# J2-4: Recommendation Feedback API Tests
# ============================================================================

def test_submit_feedback_happy_path(client, db_session):
    """Verify submitting learner rating and feedback."""
    headers = _get_auth_headers(client)

    payload = {
        "feedback_type": "rec_rating",
        "target_id": 1,
        "rating": 1,
        "comment": "Super helpful resource on Binary Search Trees!"
    }
    res = client.post("/feedback", json=payload, headers=headers)
    assert res.status_code == 201
    fb = res.json()
    assert fb["feedback_type"] == "rec_rating"
    assert fb["rating"] == 1
    assert fb["comment"] == payload["comment"]

    # Check /feedback/my
    my_res = client.get("/feedback/my", headers=headers)
    assert my_res.status_code == 200
    assert any(f["id"] == fb["id"] for f in my_res.json())


def test_feedback_difficulty_staircase_adaptation(client, db_session):
    """Verify submitting too_easy or too_hard dynamically adjusts difficulty mode in UserSettings."""
    headers = _get_auth_headers(client)

    # Reset user settings to 'gradual'
    settings_res = client.put("/settings/profile", json={"difficulty_mode": "gradual"}, headers=headers)
    assert settings_res.status_code == 200

    # 1. User submits 'too_easy' -> gradual advances to 'standard'
    client.post("/feedback", json={"feedback_type": "too_easy", "rating": 1}, headers=headers)
    cur_settings = client.get("/settings/profile", headers=headers).json()
    assert cur_settings["difficulty_mode"] == "standard"

    # 2. User submits 'too_easy' again -> standard advances to 'rigorous'
    client.post("/feedback", json={"feedback_type": "too_easy", "rating": 1}, headers=headers)
    cur_settings = client.get("/settings/profile", headers=headers).json()
    assert cur_settings["difficulty_mode"] == "rigorous"

    # 3. User submits 'too_hard' -> rigorous drops down to 'standard'
    client.post("/feedback", json={"feedback_type": "too_hard", "rating": -1}, headers=headers)
    cur_settings = client.get("/settings/profile", headers=headers).json()
    assert cur_settings["difficulty_mode"] == "standard"


# ============================================================================
# J2-5: Data Retention Policy & Stale Message Purge Tests
# ============================================================================

def test_retention_purge_dry_run_and_execution(client, db_session):
    """Verify retention policy identifies and removes transcripts older than 90 days for opted-out users."""
    user = db_session.query(User).filter(User.email == "student@cipherium.ai").first()
    
    # Ensure user has notification_retention = False
    if not user.settings:
        settings = UserSettings(user_id=user.id, notification_retention=False)
        db_session.add(settings)
    else:
        user.settings.notification_retention = False
    db_session.commit()

    now = datetime.now(timezone.utc)
    old_time = now - timedelta(days=95)
    recent_time = now - timedelta(days=10)

    old_msg = TutorMessage(
        user_id=user.id,
        role="user",
        message="Old message from 95 days ago",
        created_at=old_time
    )
    recent_msg = TutorMessage(
        user_id=user.id,
        role="user",
        message="Recent message from 10 days ago",
        created_at=recent_time
    )
    db_session.add_all([old_msg, recent_msg])
    db_session.commit()
    old_msg_id = old_msg.id
    recent_msg_id = recent_msg.id

    # Dry run should count the message without deleting
    count_dry = purge_stale_tutor_messages(db=db_session, days=90, dry_run=True, only_opted_out=True)
    assert count_dry >= 1
    assert db_session.query(TutorMessage).filter(TutorMessage.id == old_msg_id).first() is not None

    # Real purge should delete the old message
    count_real = purge_stale_tutor_messages(db=db_session, days=90, dry_run=False, only_opted_out=True)
    assert count_real >= 1
    assert db_session.query(TutorMessage).filter(TutorMessage.id == old_msg_id).first() is None
    # Recent message remains safe
    assert db_session.query(TutorMessage).filter(TutorMessage.id == recent_msg_id).first() is not None
