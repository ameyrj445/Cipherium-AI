"""
Cipherium AI - Authentication & Identity API Router

Endpoints:
  POST   /auth/register        - Register new student account
  POST   /auth/login           - Authenticate and receive JWT access token
  GET    /auth/me              - Retrieve authenticated user profile
  DELETE /auth/me              - Soft-delete account and anonymize PII
  POST   /auth/forgot-password - Request password reset link (rate-limited, 202 Accepted)
  POST   /auth/reset-password  - Reset password using time-limited cryptographic token
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserProfile,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    DeleteAccountResponse,
)
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.services.email import (
    generate_reset_token,
    verify_reset_token,
    send_reset_email,
)
from app.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates the Bearer JWT token and retrieves the active user record.
    Rejects deactivated or soft-deleted accounts with 403 Forbidden.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated or deleted",
        )
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Role-based access control dependency ensuring only users with the
    'admin' role can access protected administration endpoints.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="student",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"user_id": new_user.id, "email": new_user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated or deleted",
        )

    # Transparently upgrade legacy SHA-256 hash to bcrypt if needed
    if not (user.password_hash.startswith("$2b$") or user.password_hash.startswith("$2a$")):
        user.password_hash = hash_password(login_data.password)
        db.commit()

    token = create_access_token({"user_id": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
    )


@router.get("/me", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me", response_model=DeleteAccountResponse)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Soft-deletes the authenticated user account and anonymizes PII.
    Subsequent login or token use will be forbidden.
    """
    current_user.is_active = False
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.email = f"deleted_{current_user.id}@void.invalid"
    current_user.name = f"Deleted User {current_user.id}"
    current_user.password_hash = "DELETED_ACCOUNT"
    db.commit()
    return DeleteAccountResponse(
        message="Account successfully deactivated and personal data anonymized."
    )


@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ForgotPasswordResponse,
)
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Generates a secure, signed password reset token and dispatches reset instructions.
    Always returns 202 Accepted to prevent user email enumeration.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if user and getattr(user, "is_active", True):
        token = generate_reset_token(user.id)
        user.password_reset_token = token
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        send_reset_email(user.email, token)

    return ForgotPasswordResponse(
        message="If the email is registered, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Validates a password reset token and updates the user's password with fresh bcrypt hash.
    Invalidates the token immediately upon consumption.
    """
    user_id = verify_reset_token(payload.token, max_age=3600)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == user_id).first()
    if (
        not user
        or not getattr(user, "is_active", True)
        or user.password_reset_token != payload.token
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if user.reset_token_expires_at:
        now = datetime.now(timezone.utc)
        expires = user.reset_token_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < now:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.password_hash = hash_password(payload.new_password)
    user.password_reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return ResetPasswordResponse(message="Password has been successfully reset.")
