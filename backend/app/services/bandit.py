"""Opt-in epsilon-greedy recommendation policy and reward persistence."""

from __future__ import annotations

import os
import random
from typing import Any, Mapping, Sequence

from sqlalchemy.orm import Session

from app.models.recommendation_arm import RecommendationArm

EPSILON = 0.1


def bandit_enabled() -> bool:
    return os.getenv("BANDIT_ENABLED", "false").strip().lower() == "true"


def _value(candidate: Any, name: str, default: Any = None) -> Any:
    return candidate.get(name, default) if isinstance(candidate, Mapping) else getattr(candidate, name, default)


def choose_resource(candidates: Sequence[Any], rewards: Mapping[str, float], *, rng: Any = random) -> Any | None:
    """Explore randomly with epsilon probability; otherwise exploit arm reward."""
    if not candidates:
        return None
    if rng.random() < EPSILON:
        return rng.choice(candidates)
    # ZPD score is a cold-start tie-breaker until a resource earns a reward.
    return max(candidates, key=lambda item: (rewards.get(str(_value(item, "id")), 0.0), _value(item, "relevance_score", 0.0) or 0.0))


def reward_resource(db: Session, user_id: int, resource_id: str | int, amount: float = 1.0) -> None:
    resource_key = str(resource_id)
    arm = db.query(RecommendationArm).filter(
        RecommendationArm.user_id == user_id, RecommendationArm.resource_id == resource_key
    ).first()
    if arm is None:
        arm = RecommendationArm(user_id=user_id, resource_id=resource_key, reward=0.0, pull_count=0)
        db.add(arm)
    arm.reward += amount
    arm.pull_count += 1


def reward_map(db: Session, user_id: int) -> dict[str, float]:
    return {arm.resource_id: arm.reward for arm in db.query(RecommendationArm).filter(RecommendationArm.user_id == user_id).all()}
