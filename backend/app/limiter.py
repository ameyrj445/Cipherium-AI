"""
Cipherium AI - Centralized SlowAPI Rate Limiter & Abuse Prevention

Design:
Provides IP-based rate limiting across sensitive authentication and tutoring routes:
- /auth/login: 10 requests per minute
- /auth/forgot-password: 5 requests per minute
- /tutor/chat: 30 requests per minute
"""

import os
import time
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address


def is_rate_limiting_active() -> bool:
    """
    Checks whether rate limiting should be globally active.
    Can be controlled via RATE_LIMIT_ENABLED and TESTING environment variables.
    """
    if os.getenv("TESTING", "").lower() == "true":
        return False
    return os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],
    enabled=is_rate_limiting_active(),
    headers_enabled=False,
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Build a standard 429 JSON response that includes the Retry-After header
    without requiring endpoint signatures to declare `response: Response`.
    """
    response = JSONResponse(
        {"error": f"Rate limit exceeded: {exc.detail}"},
        status_code=429
    )
    retry_after = "60"
    try:
        current_limit = getattr(request.state, "view_rate_limit", None)
        if current_limit:
            limiter_inst = request.app.state.limiter
            window_stats = limiter_inst.limiter.get_window_stats(current_limit[0], *current_limit[1])
            reset_in = 1 + window_stats[0]
            retry_after = str(max(1, int(reset_in - time.time())))
    except Exception:
        pass
    response.headers["Retry-After"] = retry_after
    return response
