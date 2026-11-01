"""
Cipherium AI - Health Check & System Availability Router (NFR-AVAIL-01)

Endpoints:
  GET /health       - Full availability report with uptime and component metrics
  GET /health/ready - Readiness probe checking database connectivity (503 on failure)
  GET /health/live  - Liveness probe confirming process responsiveness (200 OK)
"""

import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(prefix="/health", tags=["System Health & Availability"])

START_TIME = time.time()


@router.get("", status_code=status.HTTP_200_OK)
def get_health_status(db: Session = Depends(get_db)):
    """
    Standard comprehensive health check endpoint reporting service, database,
    and process uptime metrics.
    """
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "degraded"

    uptime = round(time.time() - START_TIME, 2)
    return {
        "status": "healthy" if db_status == "ok" else "degraded",
        "service": "Cipherium AI API",
        "version": "2.0.0",
        "database": db_status,
        "uptime_seconds": uptime,
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
def readiness_probe(db: Session = Depends(get_db)):
    """
    Kubernetes / Docker readiness probe. Verifies database connectivity.
    Returns 503 Service Unavailable if the database engine is unreachable.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity check failed: {str(exc)}",
        )


@router.get("/live", status_code=status.HTTP_200_OK)
def liveness_probe():
    """
    Kubernetes / Docker liveness probe. Fast zero-overhead ping
    confirming that the ASGI event loop is active and accepting requests.
    """
    return {"status": "alive"}
