"""
Cipherium AI - Structured Request Logging & Distributed Trace Middleware (NFR-OBS-01)

Assigns a unique UUID-based X-Request-ID to every incoming HTTP transaction,
measures end-to-end request latency, and emits structured telemetry logs.
"""

import json
import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("cipherium.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Resolve existing inbound request trace ID or generate a new UUID
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            log_payload = {
                "trace_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": 500,
                "latency_ms": duration_ms,
                "client_ip": request.client.host if request.client else "unknown",
                "error": str(exc),
            }
            logger.error(json.dumps(log_payload))
            raise exc

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        log_payload = {
            "trace_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": duration_ms,
            "client_ip": request.client.host if request.client else "unknown",
        }
        logger.info(json.dumps(log_payload))

        return response
