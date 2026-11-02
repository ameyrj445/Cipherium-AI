"""Benchmark BKT and Random Forest weak-topic models on an OULAD holdout set."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, brier_score_loss, log_loss, roc_auc_score
from sklearn.model_selection import train_test_split

from app.ml.train_pipeline import find_raw_dataset_dir

REPORT_FILE = BACKEND_DIR / "data" / "benchmark_report.json"
FEATURES = ["study_hours", "vle_clicks", "prior_attempts", "assessment_score"]


class BKTWeakRiskModel:
    """A compact Bayesian Knowledge Tracing baseline for aggregated OULAD events."""

    def fit(self, _features: pd.DataFrame, targets: pd.Series):
        self.initial_knowledge = float(np.clip(1 - targets.mean(), 0.05, 0.95))
        self.guess = 0.25
        self.slip = 0.10
        self.learn = 0.15
        return self

    def predict_proba(self, features: pd.DataFrame) -> np.ndarray:
        risks = []
        for score in features["assessment_score"].fillna(0.0):
            knowledge = self.initial_knowledge
            correct = float(score) >= 50.0
            likelihood = (
                knowledge * (1 - self.slip) + (1 - knowledge) * self.guess
                if correct
                else knowledge * self.slip + (1 - knowledge) * (1 - self.guess)
            )
            posterior = (
                knowledge * (1 - self.slip) / likelihood
                if correct
                else knowledge * self.slip / likelihood
            )
            knowledge = posterior + (1 - posterior) * self.learn
            risks.append(float(np.clip(1 - knowledge, 0.001, 0.999)))
        risks = np.asarray(risks)
        return np.column_stack((1 - risks, risks))


def load_oulad_features(raw_dir: str | Path) -> tuple[pd.DataFrame, pd.Series]:
    """Aggregate the OULAD CSV files into the predictor's four input features."""
    raw_dir = Path(raw_dir)
    required = ["studentInfo.csv", "studentAssessment.csv", "assessments.csv", "studentVle.csv"]
    missing = [name for name in required if not (raw_dir / name).exists()]
    if missing:
        raise FileNotFoundError(f"Missing OULAD file(s) in {raw_dir}: {', '.join(missing)}")

    info = pd.read_csv(raw_dir / "studentInfo.csv")
    submissions = pd.read_csv(raw_dir / "studentAssessment.csv")
    assessments = pd.read_csv(raw_dir / "assessments.csv")
    clicks = pd.read_csv(raw_dir / "studentVle.csv", usecols=["id_student", "code_module", "code_presentation", "sum_click"])

    info["is_weak"] = info["final_result"].isin(["Fail", "Withdrawn"]).astype(int)
    info["prior_attempts"] = info["num_of_prev_attempts"].fillna(0).astype(int)
    merged_assessments = submissions.merge(assessments, on="id_assessment", how="inner")
    assessment_scores = merged_assessments.groupby(
        ["code_module", "code_presentation", "id_student"], as_index=False
    )["score"].mean().rename(columns={"score": "assessment_score"})
    click_totals = clicks.groupby(
        ["code_module", "code_presentation", "id_student"], as_index=False
    )["sum_click"].sum().rename(columns={"sum_click": "vle_clicks_total"})
    frame = info.merge(assessment_scores, on=["code_module", "code_presentation", "id_student"], how="left")
    frame = frame.merge(click_totals, on=["code_module", "code_presentation", "id_student"], how="left")
    frame["assessment_score"] = frame["assessment_score"].fillna(0.0)
    frame["vle_clicks"] = (frame["vle_clicks_total"].fillna(0) / 8.0).round(0).astype(int)
    frame["study_hours"] = (frame["vle_clicks"] * 0.05 + 1.0).round(1)
    return frame[FEATURES], frame["is_weak"]


def _scores(targets: pd.Series, probabilities: np.ndarray) -> dict[str, float]:
    predictions = (probabilities >= 0.5).astype(int)
    return {
        "log_loss": round(float(log_loss(targets, probabilities, labels=[0, 1])), 6),
        "brier_score": round(float(brier_score_loss(targets, probabilities)), 6),
        "accuracy": round(float(accuracy_score(targets, predictions)), 6),
        "roc_auc": round(float(roc_auc_score(targets, probabilities)), 6),
    }


def benchmark_models(raw_dir: str | Path, report_file: str | Path = REPORT_FILE) -> dict:
    """Train both models on an 80/20 split and persist their evaluation report."""
    features, targets = load_oulad_features(raw_dir)
    if targets.nunique() != 2 or targets.value_counts().min() < 2:
        raise ValueError("OULAD benchmark requires at least two examples of each outcome.")
    x_train, x_test, y_train, y_test = train_test_split(
        features, targets, test_size=0.2, random_state=42, stratify=targets
    )
    bkt = BKTWeakRiskModel().fit(x_train, y_train)
    forest = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, class_weight="balanced")
    forest.fit(x_train, y_train)
    report = {
        "model_version": "weak-topic-benchmark-v1",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_rows": len(features),
        "test_rows": len(x_test),
        "bkt": _scores(y_test, bkt.predict_proba(x_test)[:, 1]),
        "random_forest": _scores(y_test, forest.predict_proba(x_test)[:, 1]),
    }
    report_path = Path(report_file)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return report


def main() -> None:
    raw_dir = find_raw_dataset_dir()
    if not raw_dir:
        raise SystemExit("OULAD data not found. Set OULAD_DATASET_DIR or add CSVs under backend/data/raw/oulad/.")
    benchmark_models(raw_dir)


if __name__ == "__main__":
    main()
