"""
Cipherium AI - Unit Tests: Study Plan Generator Engine
"""
import pytest
from app.services.study_plan_generator import (
    match_subject_blueprint,
    generate_study_plan,
    generate_ai_curriculum_fallback,
    CURRICULUM_BLUEPRINTS,
)


def test_match_subject_blueprint_known_subjects():
    """Verify keyword mapping for pre-compiled high-quality pedagogical blueprints."""
    assert match_subject_blueprint("Data Structures and Algorithms") is not None
    assert match_subject_blueprint("dsa") is not None
    assert match_subject_blueprint("DSA Bootcamp") is not None
    assert match_subject_blueprint("Machine Learning & AI") is not None
    assert match_subject_blueprint("Web Development Full Stack") is not None
    assert match_subject_blueprint("System Design Architecture") is not None
    assert match_subject_blueprint("Operating Systems & Concurrency") is not None
    assert match_subject_blueprint("Relational Database Management (DBMS)") is not None
    assert match_subject_blueprint("Computer Networks & Sockets") is not None


def test_match_subject_blueprint_unknown_subject():
    """Verify unknown subjects return None so the fallback generator is invoked."""
    assert match_subject_blueprint("Aerospace Propulsion Dynamics") is None
    assert match_subject_blueprint("Ancient Roman Architecture") is None


def test_blueprint_study_plan_generation_scaling():
    """Verify blueprint-driven plan properly scales estimated hours to user target."""
    duration_weeks = 4
    hours_per_week = 10
    expected_total_hours = 40.0

    plan = generate_study_plan(
        subject="Data Structures & Algorithms",
        duration_weeks=duration_weeks,
        target_hours_per_week=hours_per_week,
        skill_level="intermediate",
        learning_goal="Crack technical interviews at top tier tech firms"
    )

    assert isinstance(plan, dict)
    assert plan["total_estimated_hours"] == expected_total_hours
    assert plan["duration_weeks"] == duration_weeks
    assert plan["target_hours_per_week"] == hours_per_week
    assert len(plan["milestones"]) > 0

    # Verify stage 1 is in_progress, others pending
    assert plan["milestones"][0]["status"] == "in_progress"
    for m in plan["milestones"][1:]:
        assert m["status"] == "pending"

    # Verify milestone resource structures
    first_milestone = plan["milestones"][0]
    assert len(first_milestone["subtopics"]) > 0
    assert len(first_milestone["resources"]) > 0
    for res in first_milestone["resources"]:
        assert "id" in res
        assert "title" in res
        assert "url" in res
        assert "resource_type" in res
        assert res["completed"] is False


def test_dynamic_fallback_study_plan_generation():
    """Verify dynamic generator successfully synthesizes roadmaps for custom subjects."""
    custom_subject = "Cloud Native Microservices Architecture"
    plan = generate_ai_curriculum_fallback(
        subject=custom_subject,
        duration_weeks=6,
        target_hours_per_week=5,
        skill_level="beginner",
        learning_goal="Build robust distributed services"
    )

    assert isinstance(plan, dict)
    assert plan["subject"] == custom_subject
    assert plan["total_estimated_hours"] == 30.0
    assert len(plan["milestones"]) >= 3
    for m in plan["milestones"]:
        assert len(m["subtopics"]) >= 2
        assert len(m["resources"]) >= 1
