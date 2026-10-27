"""
Cipherium AI - Unit Tests: Cryptographic Hashing & JWT Security Service
"""
import hashlib
from datetime import timedelta, datetime, timezone
from jose import jwt
import pytest

from app.services.auth import hash_password, verify_password, create_access_token
from app.config import settings


def test_hash_password_bcrypt_format():
    """Verify that generated password hashes adhere to standard bcrypt format."""
    password = "SuperSecurePassword123!"
    hashed = hash_password(password)
    
    assert isinstance(hashed, str)
    assert hashed.startswith("$2b$12$") or hashed.startswith("$2a$12$"), "Hash must be 12-round bcrypt"
    assert hashed != password, "Password must not be stored in plaintext"


def test_hash_password_salt_uniqueness():
    """Verify that two hashes of the identical plaintext produce different salt-protected digests."""
    password = "ConsistentPassword123!"
    hash1 = hash_password(password)
    hash2 = hash_password(password)
    
    assert hash1 != hash2, "Bcrypt must generate unique random salts per invocation"
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True


def test_verify_password_correct_and_incorrect():
    """Verify standard bcrypt verification for matching and non-matching passwords."""
    password = "CorrectHorseBatteryStaple"
    hashed = hash_password(password)

    # Matching password
    assert verify_password(password, hashed) is True

    # Incorrect password
    assert verify_password("WrongPassword!", hashed) is False


def test_verify_password_legacy_sha256_backward_compatibility():
    """Verify backward compatibility for legacy SHA-256 hashes."""
    password = "LegacyUserPassword2024"
    legacy_sha256 = hashlib.sha256((password + "cipherium_salt_key").encode("utf-8")).hexdigest()

    # Valid legacy password should evaluate to True
    assert verify_password(password, legacy_sha256) is True

    # Invalid password against legacy hash
    assert verify_password("IncorrectGuess", legacy_sha256) is False


def test_create_access_token_payload():
    """Verify JWT token encoding, claims, signature, and expiration."""
    data = {"sub": "student@cipherium.ai", "user_id": 42}
    token = create_access_token(data, expires_delta=timedelta(minutes=15))

    assert isinstance(token, str)
    parts = token.split(".")
    assert len(parts) == 3, "JWT must consist of header, payload, and signature"

    # Decode and verify claims using settings.SECRET_KEY and settings.ALGORITHM
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "student@cipherium.ai"
    assert decoded["user_id"] == 42
    assert "exp" in decoded
    assert decoded["exp"] > datetime.now(timezone.utc).timestamp()
