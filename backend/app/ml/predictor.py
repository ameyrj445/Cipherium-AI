"""
Cipherium AI - Machine Learning Weak-Topic Predictor Service

Methodology & Dataset Grounding:
This service trains and deploys a supervised classification model based on
the Open University Learning Analytics Dataset (OULAD) benchmark. 

In predictive learning analytics, identifying struggling students *before*
they fail a summative assessment is the primary goal of Early Warning Systems (EWS).
We extract four key behavioural and cognitive telemetry features:
  1. `study_hours`: Time spent engaged with learning resources.
  2. `vle_clicks`: Virtual Learning Environment clickstream volume (proxy for active engagement).
  3. `prior_attempts`: Repetitive assessment iterations.
  4. `assessment_score`: Baseline quiz performance on preliminary modules.

Model Architecture:
We employ a Random Forest Classifier (100 estimators, max depth 6).
Random Forest is well-suited for tabular student telemetry because:
  - It handles non-linear relationships between engagement time and retention.
  - It avoids severe overfitting through bagging and feature subsampling.
  - Its `predict_proba` method provides a calibrated risk probability that
    can be surfaced directly to the student UI as an early-warning indicator.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

# Resolve local path for model weights serialization
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "weak_topic_classifier.joblib")

# In-memory cached model instance
_model = None


def train_or_load_classifier():
    """
    Loads pre-trained model weights from disk if available, or delegates
    to the production training pipeline to train on raw OULAD data.
    
    Returns:
        RandomForestClassifier: Trained and fitted scikit-learn model.
    """
    global _model

    # 1. Fast-path: Load cached model from disk if it already exists
    if os.path.exists(MODEL_FILE):
        try:
            _model = joblib.load(MODEL_FILE)
            return _model
        except Exception as e:
            print(f"[ML Service] Error loading cached model: {e}. Falling back to pipeline training...")

    # 2. Retraining via Production OULAD Pipeline
    from app.ml.train_pipeline import run_pipeline
    _model = run_pipeline()
    if _model is not None:
        return _model

    raise RuntimeError(
        f"Model weights not found at {MODEL_FILE} and raw OULAD dataset unavailable. "
        "Please ensure raw OULAD data is present in backend/data/raw/oulad/ and run "
        "python -m app.ml.train_pipeline"
    )


def predict_weak_topic(
    study_hours: float,
    vle_clicks: int,
    prior_attempts: int,
    assessment_score: float
) -> dict:
    """
    Evaluates student interaction metrics and returns the probability of the
    student requiring pedagogical intervention on a curriculum topic.
    
    Args:
        study_hours: Logged study duration (hours).
        vle_clicks: Total clicks across lectures, notes, and visualizers.
        prior_attempts: Number of quiz attempts recorded so far.
        assessment_score: Historical accuracy or normalized test score (0.0 to 1.0).
        
    Returns:
        dict: {
            "is_weak_prediction": bool,
            "weak_probability": float (0.000 to 1.000),
            "model": str ("RandomForest-OULAD-Trained")
        }
    """
    global _model
    if _model is None:
        _model = train_or_load_classifier()

    # Structure incoming features into DataFrame with exact feature names
    features = pd.DataFrame(
        [[study_hours, vle_clicks, prior_attempts, assessment_score]],
        columns=["study_hours", "vle_clicks", "prior_attempts", "assessment_score"]
    )

    # Class 1 corresponds to "is_weak = True"
    prob_weak = float(_model.predict_proba(features)[0][1])
    is_weak = bool(prob_weak >= 0.50)

    return {
        "is_weak_prediction": is_weak,
        "weak_probability": round(prob_weak, 3),
        "model": "RandomForest-OULAD-Trained"
    }
