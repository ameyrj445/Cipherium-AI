from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base, SessionLocal
from app.data.seed import seed_database
from app.routers import auth, quiz, analytics, tutor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Seed default topics, questions, and resources
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="Cipherium AI Platform API",
    description="Adaptive Diagnostic Testing, Weak-Topic Analytics, Personalized Study Roadmaps & AI Tutoring",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(analytics.router)
app.include_router(tutor.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Cipherium AI API"}

@app.get("/")
def root():
    return {
        "message": "Welcome to Cipherium AI Platform API",
        "docs": "/docs",
        "version": "1.0.0"
    }
