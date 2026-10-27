import logging
import sys
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal, ACTIVE_DATABASE_URL
from app.data.seed import seed_database
from app.routers import auth, quiz, analytics, tutor

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

# Robust CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for uncaught server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(analytics.router)
app.include_router(tutor.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Cipherium AI API",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "postgresql" if "postgresql" in ACTIVE_DATABASE_URL else "sqlite"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to Cipherium AI Platform API",
        "docs": "/docs",
        "version": "2.0.0"
    }
