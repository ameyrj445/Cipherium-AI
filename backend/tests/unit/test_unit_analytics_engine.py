"""
Cipherium AI - Unit Tests: Learning Analytics & Adaptive Scoring Engine
"""
import pytest
from app.services.analytics import (
    classify_mastery,
    calculate_topic_mastery,
    calculate_adaptive_difficulty,
    compute_recommendation_score,
)
from app.models import QuizAttempt


class MockAttempt:
    """Lightweight dummy object matching QuizAttempt attributes for pure unit testing."""
    def __init__(self, is_correct: bool):
        self.is_correct = is_correct


# 1. classify_mastery Tests
def test_classify_mastery_cold_start():
    """Verify that fewer than 3 attempts always results in 'insufficient_data'."""
    assert classify_mastery(1.0, 0) == "insufficient_data"
    assert classify_mastery(1.0, 1) == "insufficient_data"
    assert classify_mastery(0.0, 2) == "insufficient_data"
    assert classify_mastery(0.85, 2) == "insufficient_data"


def test_classify_mastery_weak_threshold():
    """Verify accuracy < 0.50 categorizes student as 'weak' with >= 3 attempts."""
    assert classify_mastery(0.0, 3) == "weak"
    assert classify_mastery(0.33, 3) == "weak"
    assert classify_mastery(0.499, 10) == "weak"


def test_classify_mastery_developing_threshold():
    """Verify 0.50 <= accuracy <= 0.75 categorizes student as 'developing'."""
    assert classify_mastery(0.50, 3) == "developing"
    assert classify_mastery(0.66, 3) == "developing"
    assert classify_mastery(0.75, 4) == "developing"


def test_classify_mastery_strong_threshold():
    """Verify accuracy > 0.75 categorizes student as 'strong'."""
    assert classify_mastery(0.751, 4) == "strong"
    assert classify_mastery(0.80, 5) == "strong"
    assert classify_mastery(1.0, 10) == "strong"


# 2. calculate_topic_mastery Tests
def test_calculate_topic_mastery_empty():
    """Verify empty attempt histories cleanly default to baseline values."""
    score, status, total, correct = calculate_topic_mastery([])
    assert score == 0.0
    assert status == "insufficient_data"
    assert total == 0
    assert correct == 0


def test_calculate_topic_mastery_recency_boost():
    """
    Verify that recent improvements (last 5 attempts) appropriately boost
    the weighted score (0.7 overall + 0.3 recency).
    """
    # 5 incorrect followed by 5 correct
    attempts = [MockAttempt(False)] * 5 + [MockAttempt(True)] * 5
    score, status, total, correct = calculate_topic_mastery(attempts)

    # overall = 5 / 10 = 0.50
    # recency = 5 / 5 = 1.00
    # expected M = 0.7 * 0.5 + 0.3 * 1.0 = 0.35 + 0.30 = 0.65
    assert total == 10
    assert correct == 5
    assert score == 0.65
    assert status == "developing"


def test_calculate_topic_mastery_recency_decay():
    """
    Verify that recent drops in performance penalize the weighted score.
    """
    # 5 correct followed by 5 incorrect
    attempts = [MockAttempt(True)] * 5 + [MockAttempt(False)] * 5
    score, status, total, correct = calculate_topic_mastery(attempts)

    # overall = 5 / 10 = 0.50
    # recency = 0 / 5 = 0.00
    # expected M = 0.7 * 0.5 + 0.3 * 0.0 = 0.35
    assert total == 10
    assert correct == 5
    assert score == 0.35
    assert status == "weak"


def test_calculate_topic_mastery_perfect_retention():
    """Verify 100% precision across all attempts produces 1.0 score and 'strong' status."""
    attempts = [MockAttempt(True)] * 6
    score, status, total, correct = calculate_topic_mastery(attempts)
    assert total == 6
    assert correct == 6
    assert score == 1.0
    assert status == "strong"


# 3. calculate_adaptive_difficulty Tests
def test_calculate_adaptive_difficulty_empty():
    """Verify difficulty remains unchanged when no recent attempts exist."""
    assert calculate_adaptive_difficulty(3, []) == 3


def test_calculate_adaptive_difficulty_promotion():
    """Verify >= 85% accuracy promotes difficulty level by 1."""
    attempts = [MockAttempt(True)] * 5  # 100% accuracy
    assert calculate_adaptive_difficulty(2, attempts) == 3


def test_calculate_adaptive_difficulty_promotion_clamping():
    """Verify promotion cannot exceed maximum ceiling of Level 5."""
    attempts = [MockAttempt(True)] * 5
    assert calculate_adaptive_difficulty(5, attempts) == 5


def test_calculate_adaptive_difficulty_demotion():
    """Verify < 50% accuracy demotes difficulty level by 1."""
    attempts = [MockAttempt(False)] * 4 + [MockAttempt(True)] * 1  # 20% accuracy
    assert calculate_adaptive_difficulty(4, attempts) == 3


def test_calculate_adaptive_difficulty_demotion_clamping():
    """Verify demotion cannot fall below minimum floor of Level 1."""
    attempts = [MockAttempt(False)] * 5
    assert calculate_adaptive_difficulty(1, attempts) == 1


def test_calculate_adaptive_difficulty_stability():
    """Verify accuracy between 50% and 84% maintains current difficulty."""
    # 3/5 = 60% accuracy
    attempts = [MockAttempt(True)] * 3 + [MockAttempt(False)] * 2
    assert calculate_adaptive_difficulty(3, attempts) == 3


# 4. compute_recommendation_score Tests
def test_compute_recommendation_score_weak_topic_boost():
    """Verify weak topic status earns highest relevance weight (1.0)."""
    score, reason = compute_recommendation_score(
        topic_status="weak",
        mastery_score=0.35,
        resource_difficulty=2,
        user_avg_difficulty=2.0,
        prerequisites_met=True
    )
    # relevance = 1.0 (weight 0.5) -> 0.5
    # diff_fit = 1.0 (weight 0.3) -> 0.3
    # prereq = 1.0 (weight 0.2) -> 0.2
    # total = 1.0
    assert score == 1.0
    assert "Targeted remediation" in reason


def test_compute_recommendation_score_difficulty_penalty():
    """Verify large delta between resource and user level penalizes score."""
    score, _ = compute_recommendation_score(
        topic_status="developing",
        mastery_score=0.60,
        resource_difficulty=5,
        user_avg_difficulty=1.0,  # delta = 4 -> fit = 0.0
        prerequisites_met=True
    )
    # relevance = 0.6 * 0.5 = 0.30
    # diff_fit = 0.0 * 0.3 = 0.00
    # prereq = 1.0 * 0.2 = 0.20
    # total = 0.50
    assert score == 0.50


def test_compute_recommendation_score_unmet_prerequisites():
    """Verify unmet prerequisites significantly reduce recommendation score."""
    score, _ = compute_recommendation_score(
        topic_status="developing",
        mastery_score=0.60,
        resource_difficulty=2,
        user_avg_difficulty=2.0,
        prerequisites_met=False  # prereq fit = 0.2
    )
    # relevance = 0.6 * 0.5 = 0.30
    # diff_fit = 1.0 * 0.3 = 0.30
    # prereq = 0.2 * 0.2 = 0.04
    # total = 0.64
    assert score == 0.64
