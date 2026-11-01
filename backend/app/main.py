import logging
import sys
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db, ACTIVE_DATABASE_URL
from app.data.seed import seed_database
from app.models import User
from app.schemas import DeleteAccountResponse
from app.routers import auth, quiz, analytics, tutor, admin, profile, feedback, health
from app.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.routers.auth import get_current_user, delete_account
from app.limiter import limiter, rate_limit_exceeded_handler

# Structured logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("cipherium.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting Cipherium AI API in [{settings.ENVIRONMENT}] environment.")
    logger.info(f"Active database backend: {ACTIVE_DATABASE_URL.split('@')[-1] if '@' in ACTIVE_DATABASE_URL else ACTIVE_DATABASE_URL}")
    
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Seed default topics, questions, and test user
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database schema initialized and seed records verified.")
    except Exception as exc:
        logger.error(f"Database seed initialization warning: {exc}")
    finally:
        db.close()
    yield
    logger.info("Cipherium AI API shutting down.")

app = FastAPI(
    title="Cipherium AI Platform API",
    description="Production Adaptive Diagnostic Testing, Weak-Topic Analytics, Personalized Study Roadmaps & AI Tutoring",
    version="2.0.0",
    lifespan=lifespan
)

# Attach SlowAPI rate limiter state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Robust CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enterprise defensive security headers (NFR-SEC-01)
app.add_middleware(SecurityHeadersMiddleware)

# Distributed request tracing & latency tracking (NFR-OBS-01)
app.add_middleware(RequestLoggingMiddleware)

# Global exception handler for uncaught server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, (RateLimitExceeded, HTTPException)):
        raise exc
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Root DELETE /me alias delegating to auth.delete_account
@app.delete("/me", response_model=DeleteAccountResponse, tags=["Authentication"])
def delete_account_alias(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return delete_account(current_user=current_user, db=db)

# Include Routers
app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(analytics.router)
app.include_router(tutor.router)
app.include_router(admin.router)
app.include_router(profile.router)
app.include_router(feedback.router)
app.include_router(health.router)

# Health endpoints delegated to app.routers.health

@app.get("/")
def root():
    return {
        "message": "Welcome to Cipherium AI Platform API",
        "docs": "/docs",
        "version": "2.0.0"
    }
