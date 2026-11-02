"""Short-lived anti-cheat locks backed by Redis when it is configured."""

from __future__ import annotations

import os
import time
from threading import RLock


QUIZ_LOCK_TTL_SECONDS = 2 * 60 * 60
_memory_locks: dict[str, float] = {}
_memory_lock = RLock()
_redis_client = None
_redis_checked = False


def _key(user_id: int) -> str:
    return f"quiz_lock:{user_id}"


def _get_redis_client():
    """Return a best-effort Redis client; local deployments need no Redis setup."""
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None
    try:
        import redis

        _redis_client = redis.Redis.from_url(redis_url, socket_connect_timeout=0.2, socket_timeout=0.2)
        _redis_client.ping()
    except Exception:
        _redis_client = None
    return _redis_client


def set_quiz_lock(user_id: int, ttl_seconds: int = QUIZ_LOCK_TTL_SECONDS) -> None:
    key = _key(user_id)
    client = _get_redis_client()
    if client is not None:
        try:
            client.set(key, "1", ex=ttl_seconds)
            return
        except Exception:
            pass
    with _memory_lock:
        _memory_locks[key] = time.monotonic() + ttl_seconds


def quiz_lock_active(user_id: int) -> bool:
    key = _key(user_id)
    client = _get_redis_client()
    if client is not None:
        try:
            return bool(client.exists(key))
        except Exception:
            pass
    now = time.monotonic()
    with _memory_lock:
        expires_at = _memory_locks.get(key)
        if expires_at is None or expires_at <= now:
            _memory_locks.pop(key, None)
            return False
        return True


def clear_quiz_lock(user_id: int) -> None:
    key = _key(user_id)
    client = _get_redis_client()
    if client is not None:
        try:
            client.delete(key)
        except Exception:
            pass
    with _memory_lock:
        _memory_locks.pop(key, None)
