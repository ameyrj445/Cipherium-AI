"""
Cipherium AI - Email & Password Reset Security Service (FR-AUTH-02c / J3-2)

Architecture & Security:
1. Cryptographic Token Serialization:
   Uses `itsdangerous.URLSafeTimedSerializer` with the application's central
   `SECRET_KEY` and dedicated salt. This produces tamper-evident, cryptographically
   signed tokens with timestamp verification.
2. Token Lifecycle:
   Tokens expire strictly after 3600 seconds (1 hour). Once consumed or expired,
   subsequent reset attempts fail with a deterministic 400 error.
3. Resilient Dispatch:
   In dev and test environments (or when MAIL_ENABLED=false), reset emails are logged
   to stdout/logger without attempting network connections.
   In production environments with MAIL_ENABLED=true, real dispatch is handled
   via Python's `smtplib` over TLS with a branded multipart HTML + plaintext email.
"""

import email.utils
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import smtplib
import ssl
from typing import Optional
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature, BadSignature

from app.config import settings

logger = logging.getLogger("cipherium.email")

# Serializer instance keyed on settings.SECRET_KEY
_serializer = URLSafeTimedSerializer(settings.SECRET_KEY, salt="cipherium-password-reset-salt")


def generate_reset_token(user_id: int) -> str:
    """
    Generates a cryptographically signed, timestamped password reset token.
    """
    return _serializer.dumps({"user_id": user_id})


def verify_reset_token(token: str, max_age: int = 3600) -> Optional[int]:
    """
    Validates the token signature and verifies it has not expired.
    
    Args:
        token: The signed token string provided by the user.
        max_age: Maximum allowable age in seconds (defaults to 3600 = 1 hour).
        
    Returns:
        int: The extracted user_id if valid; None if expired, tampered, or invalid.
    """
    try:
        data = _serializer.loads(token, max_age=max_age)
        return data.get("user_id")
    except (SignatureExpired, BadTimeSignature, BadSignature, Exception) as exc:
        logger.warning(f"Password reset token verification failed: {exc}")
        return None


def render_reset_email_html(reset_url: str) -> str:
    """
    Renders a responsive, branded HTML email template for password reset.
    """
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Cipherium AI Password</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }}
    .card {{ max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; }}
    .brand {{ color: #38bdf8; font-size: 20px; font-weight: 700; margin-bottom: 20px; }}
    .button {{ display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 24px 0; }}
    .footer {{ margin-top: 24px; font-size: 12px; color: #9ca3af; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Cipherium AI</div>
    <h2 style="color: #ffffff; margin-top: 0;">Password Reset Request</h2>
    <p>We received a request to reset the password for your Cipherium AI account.</p>
    <p>Click the button below to set a new password. This link will expire in <strong>60 minutes</strong>:</p>
    <div>
      <a href="{reset_url}" class="button" target="_blank">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #9ca3af;">Or paste this URL into your browser:<br><a href="{reset_url}" style="color: #38bdf8; word-break: break-all;">{reset_url}</a></p>
    <div class="footer">
      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </div>
  </div>
</body>
</html>"""


def send_reset_email(to_email: str, token: str, app_base_url: str = "http://localhost:5173") -> bool:
    """
    Dispatches password reset instructions via SMTP or simulation stub.
    
    Args:
        to_email: Recipient student's email address.
        token: Cryptographic signed reset token.
        app_base_url: Base frontend application URL.
        
    Returns:
        bool: True if delivered or simulated successfully.
    """
    reset_url = f"{app_base_url}/reset-password?token={token}"

    if not settings.MAIL_ENABLED:
        logger.info(
            f"[EMAIL SERVICE MOCK] Password reset link simulated for {to_email}: {reset_url}"
        )
        return True

    # Real SMTP execution
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Cipherium AI - Password Reset Request"
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email
    msg["Date"] = email.utils.formatdate(localtime=True)
    msg["Message-ID"] = email.utils.make_msgid(domain="cipherium.ai")

    plain_text = (
        f"Cipherium AI Password Reset Request\n\n"
        f"We received a request to reset your password.\n\n"
        f"Visit the following link to choose a new password (expires in 60 minutes):\n"
        f"{reset_url}\n\n"
        f"If you did not make this request, you can safely ignore this message."
    )
    html_content = render_reset_email_html(reset_url)

    msg.attach(MIMEText(plain_text, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL, [to_email], msg.as_string())
        logger.info(f"[EMAIL SERVICE] Successfully dispatched password reset email to {to_email}")
        return True
    except Exception as exc:
        logger.error(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {exc}", exc_info=True)
        return False
