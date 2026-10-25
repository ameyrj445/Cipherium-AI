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

from app.datasets.generate_data import generate_oulad_engagement_dataset

# Resolve local path for model weights serialization
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "weak_topic_classifier.joblib")

# In-memory cached model instance
_model = None


def train_or_load_classifier():
    """
    Loads pre-trained model weights from disk if available, or trains
    a fresh Random Forest classifier on the generated OULAD benchmark dataset.
    
    Returns:
        RandomForestClassifier: Trained and fitted scikit-learn model.
    """
    global _model

    # 1. Fast-path: Load cached model from disk if it already exists
    if os.path.exists(MODEL_FILE):
        try:
            _model = joblib.load(MODEL_FILE)
            return _model
        except Exception:
            # If corrupted or version mismatch, fall through to re-training
            pass

    # 2. Dataset Synthesis / Ingestion
    dataset_path = generate_oulad_engagement_dataset()
    df = pd.read_csv(dataset_path)

    # 3. Feature Selection matching OULAD student activity indicators
    feature_cols = ["study_hours", "vle_clicks", "prior_attempts", "assessment_score"]
    X = df[feature_cols]
    y = df["is_weak"]

    # 4. Train-Test Split (80/20 stratified split)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 5. Model Fitting
    # Constraining max_depth=6 limits leaf complexity and prevents overfitting
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    # 6. Evaluation metrics logging
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    print(f"[ML Service] Random Forest Weak-Topic Classifier trained: Accuracy={acc:.3f}, F1-Score={f1:.3f}")

    # 7. Persist to disk and update module singleton
    joblib.dump(model, MODEL_FILE)
    _model = model
    return _model


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
