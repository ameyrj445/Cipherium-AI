"""
Cipherium AI - Centralized SlowAPI Rate Limiter & Abuse Prevention

Design:
Provides IP-based rate limiting across sensitive authentication and tutoring routes:
- /auth/login: 10 requests per minute
- /auth/forgot-password: 5 requests per minute
- /tutor/chat: 30 requests per minute
"""

import os
from slowapi import Limiter
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
    headers_enabled=True,
)
