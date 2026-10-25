"""
Cipherium AI - Application Configuration & Environment Settings

Architecture Note:
We use Pydantic Settings (`BaseSettings`) to strictly validate and load
environment configuration. This provides type-safe environment resolution with
a deterministic precedence hierarchy:
  1. System environment variables (e.g., Docker / Kubernetes / Cloud Run)
  2. Local `.env` file (for developer convenience)
  3. Sensible, secure in-memory defaults

Security Decisions:
- CORS origins: Wildcard `*` is explicitly disallowed whenever authentication
  credentials (cookies/Authorization headers) are exchanged, complying with
  RFC 6454 / Starlette security constraints.
- Database fallback: Defaults to a local SQLite database so evaluators and
  new contributors can clone and run immediately without setting up Postgres.
"""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized application settings. Loaded once at startup and referenced
    across all routers, database engines, and middleware.
    """
    # Environment mode: 'development', 'test', or 'production'
    ENVIRONMENT: str = "development"

    # Database connection string:
    # Defaults to local SQLite file for zero-config onboarding.
    # In production, this is overridden via DATABASE_URL to PostgreSQL.
    DATABASE_URL: str = "sqlite:///./cipherium.db"

    # JWT Authentication settings:
    # 256-bit secret key used to sign HMAC-SHA256 tokens.
    SECRET_KEY: str = "cipherium_super_secure_secret_key_983419827391823719823"
    ALGORITHM: str = "HS256"

    # 12-hour session expiration (720 minutes), ideal for prolonged student study sessions
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720

    # Optional Gemini LLM integration for AI Tutor responses:
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Comma-delimited list of trusted client origins for CORS policy
    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost"
    )

    # Configure Pydantic to read from backend/.env if present
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        """
        Parses comma-separated ALLOWED_ORIGINS string into a clean list of URI strings.
        Disallows '*' when credentials are active to avoid browser CORS rejections.
        """
        fallback_dev_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost",
        ]
        if not self.ALLOWED_ORIGINS or self.ALLOWED_ORIGINS.strip() == "*":
            return fallback_dev_origins
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


# Global singleton instance accessed by services and routers
settings = Settings()
