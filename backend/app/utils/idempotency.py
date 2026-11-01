"""Short-lived in-memory response cache for idempotent HTTP requests."""

from __future__ import annotations

import time
from threading import RLock
from typing import Any


TTL_SECONDS = 10 * 60
_cache: dict[str, tuple[dict[str, Any], float]] = {}
_lock = RLock()


def _remove_expired(now: float) -> None:
    for key, (_, expires_at) in list(_cache.items()):
        if expires_at <= now:
            del _cache[key]


def get_cached(key: str) -> dict[str, Any] | None:
    """Return a copy of an unexpired response for ``key``, if one exists."""
    now = time.monotonic()
    with _lock:
        _remove_expired(now)
        cached = _cache.get(key)
        return dict(cached[0]) if cached else None


def store_cached(key: str, response: dict[str, Any]) -> None:
    """Cache a JSON-compatible response for ten minutes."""
    now = time.monotonic()
    with _lock:
        _remove_expired(now)
        _cache[key] = (dict(response), now + TTL_SECONDS)
