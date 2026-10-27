"""
Bayesian Knowledge Tracing (BKT) and Spaced Repetition (Ebbinghaus / SM-2) Service.
Grounds student performance in cognitive science & educational data mining.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import math

class BayesianKnowledgeTracer:
    """
    Standard Bayesian Knowledge Tracing (Corbett & Anderson):
    - p_l0: Initial probability of mastery prior to practice (default 0.20)
    - p_t:  Probability of transitioning from unlearned to learned (default 0.15)
    - p_s:  Slip probability: student knows it but slips up (default 0.10)
    - p_g:  Guess probability: student doesn't know it but guesses right (default 0.25)
    """
    def __init__(self, p_l0: float = 0.20, p_t: float = 0.15, p_s: float = 0.10, p_g: float = 0.25):
        self.p_l0 = p_l0
        self.p_t = p_t
        self.p_s = p_s
        self.p_g = p_g

    def update_step(self, p_prior: float, is_correct: bool) -> float:
        """Computes the posterior knowledge probability after observing one response."""
        p_prior = max(0.001, min(0.999, p_prior))
        
        if is_correct:
            numerator = p_prior * (1.0 - self.p_s)
            denominator = numerator + ((1.0 - p_prior) * self.p_g)
        else:
            numerator = p_prior * self.p_s
            denominator = numerator + ((1.0 - p_prior) * (1.0 - self.p_g))

        if denominator <= 0:
            p_posterior = p_prior
        else:
            p_posterior = numerator / denominator

        # Knowledge state transition step
        p_next = p_posterior + ((1.0 - p_posterior) * self.p_t)
        return round(max(0.01, min(0.99, p_next)), 4)

    def trace_sequence(self, sequence: List[bool]) -> float:
        """Traces a sequence of chronological responses from initial state."""
        if not sequence:
            return self.p_l0

        p_curr = self.p_l0
        for is_correct in sequence:
            p_curr = self.update_step(p_curr, is_correct)

        return round(p_curr, 3)


def _normalize_datetime(dt: Any) -> datetime:
    """Normalizes any datetime to offset-naive UTC to avoid mixed timezone comparison errors."""
    if not isinstance(dt, datetime):
        return datetime.utcnow()
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class SpacedRepetitionScheduler:
    """
    Combines the Ebbinghaus Exponential Forgetting Curve with SuperMemo-2 (SM-2):
    R = e^(-Δt / S)
    where S is the memory stability (in days), scaling with successful recall intervals.
    """
    @staticmethod
    def calculate_retention_rate(stability_days: float, days_elapsed: float) -> float:
        """Calculates current probability of memory retention."""
        if stability_days <= 0:
            return 0.10
        if days_elapsed <= 0:
            return 1.00
        
        # Exponential memory decay (bounded against float underflow)
        decay_factor = max(-50.0, -days_elapsed / stability_days)
        retention = math.exp(decay_factor)
        return round(max(0.05, min(1.00, retention)), 3)

    @staticmethod
    def calculate_next_review(
        consecutive_correct: int,
        is_last_correct: bool,
        base_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Calculates the stability days and optimal target date for spaced repetition."""
        ref_time = _normalize_datetime(base_time or datetime.utcnow())

        if not is_last_correct or consecutive_correct <= 0:
            # Immediate remediation required
            stability = 0.5
            urgency = "critical_review"
        elif consecutive_correct == 1:
            stability = 1.0
            urgency = "review_recommended"
        elif consecutive_correct == 2:
            stability = 3.0
            urgency = "optimal"
        else:
            # SM-2 progressive multiplier (1.7^n) bounded against overflow
            bounded_n = min(15, consecutive_correct - 2)
            stability = round(min(365.0, 3.0 * (1.7 ** bounded_n)), 1)
            urgency = "optimal"

        next_review_due = ref_time + timedelta(days=stability)

        return {
            "stability_days": stability,
            "next_review_due": next_review_due,
            "urgency": urgency
        }


def evaluate_bkt_and_retention(
    attempts: List[Any],
    current_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Evaluates attempts history to produce:
    - BKT latent mastery probability
    - Current memory retention rate
    - Next recommended spaced review timestamp
    - Review status category
    """
    now = current_time or datetime.utcnow()
    tracer = BayesianKnowledgeTracer()
    scheduler = SpacedRepetitionScheduler()

    if not attempts:
        return {
            "bkt_probability": tracer.p_l0,
            "retention_rate": 1.0,
            "next_review_due": now + timedelta(days=1),
            "retention_status": "optimal",
            "consecutive_correct": 0,
            "stability_days": 1.0
        }

    # Extract boolean correct flags & dates
    bool_sequence = []
    consecutive_correct = 0
    last_attempt_time = now

    for item in attempts:
        if isinstance(item, dict):
            is_c = bool(item.get("is_correct", False))
            dt = item.get("timestamp") or item.get("attempted_at") or now
        else:
            is_c = bool(getattr(item, "is_correct", False))
            dt = getattr(item, "attempted_at", now)

        bool_sequence.append(is_c)
        if is_c:
            consecutive_correct += 1
        else:
            consecutive_correct = 0
        last_attempt_time = dt

    bkt_prob = tracer.trace_sequence(bool_sequence)
    is_last_correct = bool_sequence[-1] if bool_sequence else False

    review_info = scheduler.calculate_next_review(
        consecutive_correct=consecutive_correct,
        is_last_correct=is_last_correct,
        base_time=last_attempt_time
    )

    norm_now = _normalize_datetime(now)
    norm_last = _normalize_datetime(last_attempt_time)
    days_since_last = max(0.0, (norm_now - norm_last).total_seconds() / 86400.0)
    current_retention = scheduler.calculate_retention_rate(
        stability_days=review_info["stability_days"],
        days_elapsed=days_since_last
    )

    # Classify review status
    if current_retention < 0.60 or not is_last_correct:
        status = "critical_review"
    elif current_retention < 0.80 or norm_now >= review_info["next_review_due"]:
        status = "review_recommended"
    else:
        status = "optimal"

    return {
        "bkt_probability": bkt_prob,
        "retention_rate": current_retention,
        "next_review_due": review_info["next_review_due"],
        "retention_status": status,
        "consecutive_correct": consecutive_correct,
        "stability_days": review_info["stability_days"]
    }
