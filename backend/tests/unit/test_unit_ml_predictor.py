"""
Cipherium AI - Unit Tests: Machine Learning Weak-Topic Predictor Service
"""
import os
import pytest
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from app.ml.predictor import train_or_load_classifier, predict_weak_topic, MODEL_FILE
from app.datasets.generate_data import generate_oulad_engagement_dataset


def test_oulad_dataset_generation():
    """Verify synthetic OULAD dataset generates expected schema and realistic distributions."""
    dataset_path = generate_oulad_engagement_dataset()
    assert os.path.exists(dataset_path), "Dataset file was not created"
    
    df = pd.read_csv(dataset_path)
    expected_cols = {"study_hours", "vle_clicks", "prior_attempts", "assessment_score", "is_weak"}
    assert expected_cols.issubset(set(df.columns)), f"Missing columns in dataset: {df.columns}"
    assert len(df) >= 100, "Dataset contains insufficient sample size"
    assert df["is_weak"].isin([0, 1]).all(), "Target variable must be binary [0, 1]"


def test_train_or_load_classifier_specs():
    """Verify classifier initializes with required hyperparameters and classes."""
    model = train_or_load_classifier()
    assert isinstance(model, RandomForestClassifier), "Model must be a RandomForestClassifier"
    assert model.n_estimators == 100, "Expected 100 forest estimators"
    assert model.max_depth == 6, "Expected max_depth constrained to 6"
    assert list(model.classes_) == [0, 1], "Expected binary classification classes [0, 1]"


def test_predict_weak_topic_struggling_learner():
    """Verify that low study time, low clicks, and poor scores trigger weak intervention warning."""
    result = predict_weak_topic(
        study_hours=0.5,
        vle_clicks=8,
        prior_attempts=4,
        assessment_score=20.0
    )
    assert isinstance(result, dict)
    assert result["is_weak_prediction"] is True
    assert result["weak_probability"] >= 0.50
    assert result["model"] == "RandomForest-OULAD-Trained"


def test_predict_weak_topic_mastered_learner():
    """Verify that consistent engagement, high clicks, and high scores predict low weak risk."""
    result = predict_weak_topic(
        study_hours=25.0,
        vle_clicks=350,
        prior_attempts=1,
        assessment_score=95.0
    )
    assert isinstance(result, dict)
    assert result["is_weak_prediction"] is False
    assert result["weak_probability"] < 0.50


def test_predict_weak_topic_boundary_zero_values():
    """Verify robustness when encountering zero-value cold-start boundaries."""
    result = predict_weak_topic(
        study_hours=0.0,
        vle_clicks=0,
        prior_attempts=0,
        assessment_score=0.0
    )
    assert isinstance(result, dict)
    assert 0.0 <= result["weak_probability"] <= 1.0
    assert isinstance(result["is_weak_prediction"], bool)


def test_predict_weak_topic_extreme_values():
    """Verify stability under extreme engagement telemetry values."""
    result = predict_weak_topic(
        study_hours=500.0,
        vle_clicks=10000,
        prior_attempts=10,
        assessment_score=1.0
    )
    assert isinstance(result, dict)
    assert 0.0 <= result["weak_probability"] <= 1.0
