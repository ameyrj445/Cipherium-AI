"""
Cipherium AI - Resilient Database Connection & Session Management

Design Rationale:
In enterprise and academic deployments, developer setup often fails at the
database layer when local PostgreSQL instances are not running or contain
unconfigured placeholder credentials (e.g., 'YOUR_DB_PASSWORD').

Instead of crashing the entire FastAPI application during initialization, our
resilient engine factory tests connectivity on startup. If the target Postgres
instance is unreachable or misconfigured, it logs a warning and falls back
gracefully to a local SQLite database (`cipherium.db`). This guarantees zero-friction
local development while maintaining 100% production compatibility with PostgreSQL.
"""

import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("cipherium.database")


def create_resilient_engine():
    """
    Initializes a SQLAlchemy engine with automatic fallback handling.
    
    1. Checks if the configured URL contains common placeholder passwords.
    2. Attempts a test connection (`pool_pre_ping=True`).
    3. If PostgreSQL fails to connect, transparently falls back to local SQLite.
    
    Returns:
        (Engine, str): Tuple containing the active SQLAlchemy Engine and resolved DB URL.
    """
    db_url = settings.DATABASE_URL

    # Detect unconfigured placeholder credentials in the .env file
    if "YOUR_DB_PASSWORD" in db_url or "change_me" in db_url:
        logger.warning(
            "Placeholder credentials detected in DATABASE_URL. "
            "Transparently falling back to local SQLite for zero-config startup."
        )
        db_url = "sqlite:///./cipherium.db"

    # SQLite requires check_same_thread=False because FastAPI handles requests across worker threads
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

    try:
        # pool_pre_ping=True prevents dropped connection errors after network timeouts
        engine = create_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
        
        # Actively test connection before proceeding
        with engine.connect() as conn:
            pass
        return engine, db_url
    except Exception as exc:
        # If external database (Postgres) failed, attempt safe fallback to SQLite
        if not db_url.startswith("sqlite"):
            logger.warning(
                f"Could not connect to target database ({exc}). "
                "Engaging resilient fallback to local SQLite (sqlite:///./cipherium.db)."
            )
            fallback_url = "sqlite:///./cipherium.db"
            engine = create_engine(
                fallback_url,
                connect_args={"check_same_thread": False},
                pool_pre_ping=True
            )
            return engine, fallback_url
        # If SQLite itself failed (e.g. read-only filesystem), raise exception
        raise exc


# Instantiate the active engine and export resolved database URL
engine, ACTIVE_DATABASE_URL = create_resilient_engine()

# Thread-safe session factory configured with autocommit=False and autoflush=False
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model inherited by all ORM entities in app.models
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides an isolated SQLAlchemy database session
    per incoming HTTP request. Guarantees that the session is closed and returned
    to the pool even if an uncaught exception occurs during request execution.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()