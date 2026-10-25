from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import os

SECRET_KEY = os.getenv("SECRET_KEY", "cipherium_super_secure_secret_key_983419827391823719823")
ALGORITHM = "HS256"
# Keep the signed token lifetime aligned with the frontend's two-hour session.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

def hash_password(password: str) -> str:
    # Deterministic SHA256 with salt for portable reliable hash
    salt = "cipherium_salt_key"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
