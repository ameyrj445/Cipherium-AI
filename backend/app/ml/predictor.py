"""
Machine Learning Model Service for Weak-Topic Prediction & Classification
Uses Scikit-learn Random Forest Classifier and Logistic Regression
Trained on student activity features:
- study_hours
- vle_clicks (interaction volume)
- prior_attempts
- recent_accuracy
"""
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib

from app.datasets.generate_data import generate_oulad_engagement_dataset

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "weak_topic_classifier.joblib")

_model = None

def train_or_load_classifier():
    global _model
    if os.path.exists(MODEL_FILE):
        try:
            _model = joblib.load(MODEL_FILE)
            print("Loaded trained Scikit-learn model from disk.")
            return _model
        except Exception:
            pass

    # Ensure dataset is generated
    dataset_path = generate_oulad_engagement_dataset()
    df = pd.read_csv(dataset_path)

    # Feature selection matching OULAD analytics parameters
    X = df[["study_hours", "vle_clicks", "prior_attempts", "assessment_score"]]
    y = df["is_weak"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    print(f"RandomForest Weak-Topic Classifier Trained! Test Accuracy: {acc:.3f}, F1: {f1:.3f}")

    joblib.dump(model, MODEL_FILE)
    _model = model
    return _model

def predict_weak_topic(study_hours: float, vle_clicks: int, prior_attempts: int, assessment_score: float) -> dict:
    """
    Predicts probability of a student struggling or needing intervention on a topic
    """
    global _model
    if _model is None:
        _model = train_or_load_classifier()

    features = pd.DataFrame(
        [[study_hours, vle_clicks, prior_attempts, assessment_score]],
        columns=["study_hours", "vle_clicks", "prior_attempts", "assessment_score"]
    )
    prob_weak = float(_model.predict_proba(features)[0][1])
    is_weak = bool(prob_weak >= 0.5)

    return {
        "is_weak_prediction": is_weak,
        "weak_probability": round(prob_weak, 3),
        "model": "RandomForest-OULAD-Trained"
    }
