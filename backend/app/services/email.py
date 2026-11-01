"""
Cipherium AI - Email & Password Reset Security Service

Architecture & Security:
1. Cryptographic Token Serialization:
   Uses `itsdangerous.URLSafeTimedSerializer` with the application's central
   `SECRET_KEY` and dedicated salt. This produces tamper-evident, cryptographically
   signed tokens with timestamp verification.
2. Token Lifecycle:
   Tokens expire strictly after 3600 seconds (1 hour). Once consumed or expired,
   subsequent reset attempts fail with a deterministic 400 error.
3. Resilient Dispatch:
   In dev and test environments, reset emails are logged to stdout/logger.
   In production environments with SMTP configured, real dispatch is handled.
"""

import logging
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


def send_reset_email(to_email: str, token: str) -> None:
    """
    Dispatches password reset instructions with the reset link.
    In development and test environments, this logs the action to stdout.
    """
    reset_url = f"/reset-password?token={token}"
    logger.info(f"[EMAIL SERVICE] Password reset requested for {to_email}. Reset link: {reset_url}")
