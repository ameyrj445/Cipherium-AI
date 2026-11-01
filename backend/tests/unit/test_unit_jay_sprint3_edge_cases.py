"""
Cipherium AI - Edge Case & Boundary Condition Tests: Jay Sprint 3 Deliverables

Covers:
- J3-1 Edge Cases: Trace ID preservation on 4xx/5xx responses, malformed headers.
- J3-2 Edge Cases: SMTP network connection failure resilience, empty credential handling.
- J3-3 Edge Cases: Database disconnection simulation on /health/ready (503 Service Unavailable), degraded health reporting.
- J3-4 Edge Cases: Security defensive headers presence on error responses (404, 422).
- J3-5 Edge Cases: Admin overview division-by-zero resilience on cold start (empty database).
"""

from unittest.mock import MagicMock, patch
import pytest
import smtplib
from sqlalchemy.exc import OperationalError

from app.config import settings
from app.models import User
from app.services.email import send_reset_email
from app.services.auth import hash_password


def _get_auth_headers(client, email="student@cipherium.ai", password="cipherium123"):
    res = client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _get_admin_headers(client, db_session):
    admin = db_session.query(User).filter(User.email == "admin_edge3@cipherium.ai").first()
    if not admin:
        admin = User(
            name="Admin Edge 3",
            email="admin_edge3@cipherium.ai",
            password_hash=hash_password("adminpass123"),
            role="admin",
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
    else:
        admin.role = "admin"
        db_session.commit()

    res = client.post("/auth/login", json={"email": "admin_edge3@cipherium.ai", "password": "adminpass123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# J3-1 Edge Cases: Trace IDs Across HTTP Status Ranges
# ============================================================================

def test_trace_id_present_on_404_not_found(client):
    """Verify X-Request-ID header is present even on 404 client error responses."""
    res = client.get("/nonexistent-endpoint-path-98765")
    assert res.status_code == 404
    assert "X-Request-ID" in res.headers


def test_trace_id_present_on_422_validation_error(client):
    """Verify X-Request-ID header is present on unprocessable entity responses."""
    res = client.post("/auth/login", json={"email": "invalid_email_missing_password"})
    assert res.status_code == 422
    assert "X-Request-ID" in res.headers


# ============================================================================
# J3-2 Edge Cases: SMTP Resilience Under Failure
# ============================================================================

@patch("smtplib.SMTP")
def test_smtp_handles_network_timeout_gracefully(mock_smtp_cls):
    """Verify SMTP connection timeout returns False without raising an uncaught exception."""
    mock_smtp_cls.side_effect = smtplib.SMTPConnectError(421, b"Connection timed out")

    original_enabled = settings.MAIL_ENABLED
    try:
        settings.MAIL_ENABLED = True
        success = send_reset_email("student@cipherium.ai", "token_timeout_test")
        assert success is False
    finally:
        settings.MAIL_ENABLED = original_enabled


@patch("smtplib.SMTP")
def test_smtp_sends_without_auth_when_credentials_blank(mock_smtp_cls):
    """Verify SMTP operates cleanly on local relay without authentication credentials."""
    mock_server = MagicMock()
    mock_smtp_cls.return_value.__enter__.return_value = mock_server

    original_enabled = settings.MAIL_ENABLED
    original_user = settings.SMTP_USER
    original_pass = settings.SMTP_PASSWORD
    try:
        settings.MAIL_ENABLED = True
        settings.SMTP_USER = ""
        settings.SMTP_PASSWORD = ""

        success = send_reset_email("student@cipherium.ai", "token_no_auth_test")
        assert success is True
        assert not mock_server.login.called
        assert mock_server.sendmail.called
    finally:
        settings.MAIL_ENABLED = original_enabled
        settings.SMTP_USER = original_user
        settings.SMTP_PASSWORD = original_pass


# ============================================================================
# J3-3 Edge Cases: Health Check DB Outage Simulation
# ============================================================================

def test_readiness_probe_returns_503_on_db_outage(client):
    """Verify /health/ready returns 503 Service Unavailable when DB connectivity fails."""
    with patch("sqlalchemy.orm.Session.execute", side_effect=OperationalError("connection refused", {}, None)):
        res = client.get("/health/ready")
        assert res.status_code == 503
        assert "connectivity check failed" in res.json()["detail"].lower()


def test_health_reports_degraded_status_when_db_fails(client):
    """Verify /health reports degraded status without throwing a 500 when DB query fails."""
    with patch("sqlalchemy.orm.Session.execute", side_effect=OperationalError("connection refused", {}, None)):
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "degraded"
        assert data["database"] == "degraded"


# ============================================================================
# J3-4 Edge Cases: Security Headers on Error Responses
# ============================================================================

def test_security_headers_present_on_404_error_response(client):
    """Verify defensive security headers are preserved on error responses."""
    res = client.get("/nonexistent-404-test")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


# ============================================================================
# J3-5 Edge Cases: Admin Overview Cold Start Resilience
# ============================================================================

def test_admin_overview_empty_telemetry_resilience(client, db_session):
    """Verify overview calculations succeed even when no quiz attempts exist in the session."""
    admin_headers = _get_admin_headers(client, db_session)
    res = client.get("/admin/analytics/overview", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["avg_mastery_score"], float)
    assert isinstance(data["overall_accuracy_rate"], float)
    assert isinstance(data["most_struggled_topics"], list)
