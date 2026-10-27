import pytest
from datetime import datetime, timedelta
from app.services.bkt_service import (
    BayesianKnowledgeTracer,
    SpacedRepetitionScheduler,
    evaluate_bkt_and_retention
)

def test_bkt_initial_state_zero_attempts():
    tracer = BayesianKnowledgeTracer(p_l0=0.20, p_t=0.15, p_s=0.10, p_g=0.25)
    prob = tracer.trace_sequence([])
    assert prob == 0.20

def test_bkt_consecutive_correct_increases_probability():
    tracer = BayesianKnowledgeTracer()
    p1 = tracer.trace_sequence([True])
    p2 = tracer.trace_sequence([True, True])
    p3 = tracer.trace_sequence([True, True, True])
    p4 = tracer.trace_sequence([True, True, True, True])

    assert p1 > 0.20
    assert p2 > p1
    assert p3 > p2
    assert p4 > 0.85  # Strong mastery threshold reached

def test_bkt_incorrect_response_reduces_probability():
    tracer = BayesianKnowledgeTracer()
    # Student was at p2
    p_high = tracer.trace_sequence([True, True])
    # Slip or lack of knowledge
    p_drop = tracer.trace_sequence([True, True, False])
    assert p_drop < p_high

def test_bkt_all_incorrect_remains_low():
    tracer = BayesianKnowledgeTracer()
    prob = tracer.trace_sequence([False, False, False, False])
    assert prob < 0.25

def test_ebbinghaus_retention_decay():
    scheduler = SpacedRepetitionScheduler()
    # At time 0, retention is 100%
    ret_0 = scheduler.calculate_retention_rate(stability_days=2.0, days_elapsed=0.0)
    assert ret_0 == 1.0

    # At 2 days with stability 2 days, R = e^(-1) ~ 0.368
    ret_2 = scheduler.calculate_retention_rate(stability_days=2.0, days_elapsed=2.0)
    assert 0.35 <= ret_2 <= 0.38

    # Further elapsed time reduces retention
    ret_5 = scheduler.calculate_retention_rate(stability_days=2.0, days_elapsed=5.0)
    assert ret_5 < ret_2

def test_sm2_stability_and_next_review_scheduling():
    scheduler = SpacedRepetitionScheduler()
    now = datetime.utcnow()

    # First correct attempt -> stability should be 1.0 day
    review_info = scheduler.calculate_next_review(consecutive_correct=1, is_last_correct=True, base_time=now)
    assert review_info["stability_days"] == 1.0
    assert review_info["next_review_due"] > now

    # Second correct attempt -> stability should be ~3.0 days
    review_info_2 = scheduler.calculate_next_review(consecutive_correct=2, is_last_correct=True, base_time=now)
    assert review_info_2["stability_days"] >= 3.0

    # Wrong attempt resets consecutive streak to 0, immediate review
    review_info_wrong = scheduler.calculate_next_review(consecutive_correct=0, is_last_correct=False, base_time=now)
    assert review_info_wrong["stability_days"] <= 0.5
    assert review_info_wrong["urgency"] == "critical_review"

def test_evaluate_bkt_and_retention_integration():
    now = datetime.utcnow()
    # Simulate attempts: correct yesterday, correct 2 days ago
    attempts_data = [
        {"is_correct": True, "timestamp": now - timedelta(days=2)},
        {"is_correct": True, "timestamp": now - timedelta(days=1)},
    ]
    result = evaluate_bkt_and_retention(attempts_data, current_time=now)
    assert "bkt_probability" in result
    assert "retention_rate" in result
    assert "next_review_due" in result
    assert "retention_status" in result
    assert result["bkt_probability"] > 0.5
    assert 0.0 <= result["retention_rate"] <= 1.0
