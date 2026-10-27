"""
Cipherium AI - Cryptographic Authentication & Token Services

Security Architecture:
1. Password Storage:
   - Modern accounts use industry-standard native `bcrypt` with adaptive work factor (12 rounds).
   - Each password hash has a cryptographically secure random salt generated on-the-fly,
     rendering rainbow table and precomputation attacks ineffective.
2. Backward Compatibility & Hash Migration:
   - Legacy prototype accounts in early builds used a static-salt SHA-256 scheme.
   - To prevent breaking existing users or seed databases, `verify_password` detects
     legacy hashes using constant-time comparison (`hmac.compare_digest`), enabling the
     auth router to transparently upgrade the stored hash to bcrypt upon successful login.
3. Stateless JWT Sessions:
   - Issues HMAC-SHA256 tokens encoded with UTC expiry timestamps to prevent clock skew.
"""

import bcrypt
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from app.config import settings


def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using native bcrypt with a fresh random salt.
    
    Args:
        password: Raw student password string.
        
    Returns:
        str: UTF-8 decoded bcrypt hash string (prefixed with $2b$).
    """
    # 12 rounds provides optimal defense against offline brute-force attacks
    # while maintaining sub-150ms verification times on modern server CPUs.
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies candidate plain password against stored database hash.
    
    Supports:
    - Standard bcrypt hashes ($2b$ or $2a$)
    - Backward-compatible legacy static-salt SHA-256 hashes
    
    Args:
        plain_password: User-submitted raw password from login form.
        hashed_password: Password hash string stored in the database.
        
    Returns:
        bool: True if passwords match, False otherwise.
    """
    if not plain_password or not hashed_password:
        return False

    # 1. Standard modern bcrypt verification
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        except Exception:
            return False

    # 2. Legacy SHA-256 fallback with static salt for backwards compatibility with early seed data.
    # Note: Using hmac.compare_digest prevents timing side-channel attacks.
    legacy_hash = hashlib.sha256((plain_password + "cipherium_salt_key").encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a cryptographically signed HMAC-SHA256 JWT containing student claims.
    
    Args:
        data: Payload claims dictionary (typically includes 'sub': user.email).
        expires_delta: Optional explicit expiration duration. Defaults to settings.ACCESS_TOKEN_EXPIRE_MINUTES.
        
    Returns:
        str: Encoded JWT access token.
    """
    to_encode = data.copy()
    
    # Always use explicit timezone-aware UTC timestamps
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and validates an incoming JWT token against our server secret and algorithm.
    
    Args:
        token: Raw Bearer JWT string from the HTTP Authorization header.
        
    Returns:
        Optional[dict]: Decoded claims dictionary if valid and unexpired; None otherwise.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
