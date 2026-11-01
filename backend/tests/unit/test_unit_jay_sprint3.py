"""
Cipherium AI - Unit & Integration Tests: Jay Sprint 3 Deliverables

Covers:
- J3-1: Structured Logging & Distributed Trace IDs (NFR-OBS-01)
- J3-2: SMTP Email Integration & Reset Templating (FR-AUTH-02c)
- J3-3: Health Check & Availability Probes (NFR-AVAIL-01)
- J3-4: Defensive HTTP Security Headers (NFR-SEC-01)
- J3-5: Admin Platform Telemetry & Reporting (FR-ADMIN-02)
"""

import uuid
from unittest.mock import MagicMock, patch
import pytest

from app.config import settings
from app.models import User, Topic, TopicMastery, QuizAttempt
from app.services.email import send_reset_email, render_reset_email_html
from app.services.auth import hash_password


def _get_auth_headers(client, email="student@cipherium.ai", password="cipherium123"):
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _get_admin_headers(client, db_session):
    admin = db_session.query(User).filter(User.email == "admin_s3@cipherium.ai").first()
    if not admin:
        admin = User(
            name="Admin S3",
            email="admin_s3@cipherium.ai",
            password_hash=hash_password("adminpass123"),
            role="admin",
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
    else:
        admin.role = "admin"
        db_session.commit()

    res = client.post("/auth/login", json={"email": "admin_s3@cipherium.ai", "password": "adminpass123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# J3-1: Distributed Trace IDs & Logging Tests
# ============================================================================

def test_request_logging_middleware_attaches_trace_id(client):
    """Verify that every HTTP response has an X-Request-ID header attached."""
    res = client.get("/")
    assert res.status_code == 200
    assert "X-Request-ID" in res.headers
    trace_id = res.headers["X-Request-ID"]
    # Verify it is a valid UUID
    uuid_obj = uuid.UUID(trace_id)
    assert str(uuid_obj) == trace_id


def test_request_logging_middleware_echoes_inbound_trace_id(client):
    """Verify that an inbound X-Request-ID header is propagated downstream."""
    custom_trace = str(uuid.uuid4())
    res = client.get("/", headers={"X-Request-ID": custom_trace})
    assert res.status_code == 200
    assert res.headers["X-Request-ID"] == custom_trace


# ============================================================================
# J3-2: SMTP Email Integration Tests
# ============================================================================

def test_smtp_send_reset_email_simulated_when_mail_disabled():
    """Verify send_reset_email operates in simulation mode without network calls when MAIL_ENABLED=False."""
    original_enabled = settings.MAIL_ENABLED
    try:
        settings.MAIL_ENABLED = False
        success = send_reset_email("student@cipherium.ai", "sample_test_token_12345")
        assert success is True
    finally:
        settings.MAIL_ENABLED = original_enabled


@patch("smtplib.SMTP")
def test_smtp_send_reset_email_dispatches_when_mail_enabled(mock_smtp_cls):
    """Verify send_reset_email executes SMTP TLS connection and sends multipart email when MAIL_ENABLED=True."""
    mock_server = MagicMock()
    mock_smtp_cls.return_value.__enter__.return_value = mock_server

    original_enabled = settings.MAIL_ENABLED
    original_user = settings.SMTP_USER
    original_pass = settings.SMTP_PASSWORD
    try:
        settings.MAIL_ENABLED = True
        settings.SMTP_USER = "mailer@cipherium.ai"
        settings.SMTP_PASSWORD = "secret_smtp_password"

        success = send_reset_email("student@cipherium.ai", "token_mock_dispatch_999")
        assert success is True
        assert mock_server.starttls.called
        assert mock_server.login.called
        assert mock_server.sendmail.called
    finally:
        settings.MAIL_ENABLED = original_enabled
        settings.SMTP_USER = original_user
        settings.SMTP_PASSWORD = original_pass


def test_render_reset_email_html_structure():
    """Verify HTML template renders valid markup and includes the exact reset URL."""
    test_url = "https://app.cipherium.ai/reset-password?token=abcdef123456"
    html = render_reset_email_html(test_url)
    assert test_url in html
    assert "Cipherium AI" in html
    assert "Reset Password" in html
    assert "<!DOCTYPE html>" in html


# ============================================================================
# J3-3: Health Check & Availability Probes Tests
# ============================================================================

def test_health_check_endpoint(client):
    """Verify /health returns 200 with service, version, database, and uptime info."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["healthy", "ok"]
    assert data["service"] == "Cipherium AI API"
    assert data["version"] == "2.0.0"
    assert "database" in data
    assert "uptime_seconds" in data
    assert isinstance(data["uptime_seconds"], (int, float))


def test_health_liveness_probe(client):
    """Verify /health/live returns 200 OK for Kubernetes/container orchestrator."""
    res = client.get("/health/live")
    assert res.status_code == 200
    assert res.json() == {"status": "alive"}


def test_health_readiness_probe(client):
    """Verify /health/ready passes when database engine is healthy."""
    res = client.get("/health/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"


# ============================================================================
# J3-4: Defensive Security Headers Tests
# ============================================================================

def test_defensive_security_headers_present_on_all_responses(client):
    """Verify defensive HTTP security headers are attached to API responses (NFR-SEC-01)."""
    res = client.get("/")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "X-XSS-Protection" in res.headers


# ============================================================================
# J3-5: Admin Platform Telemetry Tests
# ============================================================================

def test_admin_analytics_overview_comprehensive(client, db_session):
    """Verify admin overview delivers all required aggregate platform telemetry."""
    admin_headers = _get_admin_headers(client, db_session)
    res = client.get("/admin/analytics/overview", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()

    assert "total_users" in data
    assert "active_users_last_7d" in data
    assert "quiz_attempts_today" in data
    assert "avg_mastery_score" in data
    assert "most_struggled_topics" in data
    assert isinstance(data["most_struggled_topics"], list)
    assert len(data["most_struggled_topics"]) <= 5


def test_admin_analytics_overview_forbidden_for_student(client):
    """Verify regular student token is rejected with 403 on /admin/analytics/overview."""
    student_headers = _get_auth_headers(client)
    res = client.get("/admin/analytics/overview", headers=student_headers)
    assert res.status_code == 403
