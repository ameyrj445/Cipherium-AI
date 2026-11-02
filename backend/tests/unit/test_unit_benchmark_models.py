import json

import pandas as pd

from scripts.benchmark_models import benchmark_models


def test_benchmark_models_writes_expected_report_keys(tmp_path):
    raw_dir = tmp_path / "oulad"
    raw_dir.mkdir()
    rows = []
    for student_id in range(1, 21):
        rows.append({
            "code_module": "AAA", "code_presentation": "2013J", "id_student": student_id,
            "final_result": "Fail" if student_id % 2 else "Pass",
            "num_of_prev_attempts": student_id % 3,
        })
    pd.DataFrame(rows).to_csv(raw_dir / "studentInfo.csv", index=False)
    pd.DataFrame({"id_assessment": list(range(1, 21)), "code_module": "AAA", "code_presentation": "2013J"}).to_csv(raw_dir / "assessments.csv", index=False)
    pd.DataFrame({"id_assessment": list(range(1, 21)), "id_student": list(range(1, 21)), "score": [20 if i % 2 else 80 for i in range(1, 21)]}).to_csv(raw_dir / "studentAssessment.csv", index=False)
    pd.DataFrame({"id_student": list(range(1, 21)), "code_module": "AAA", "code_presentation": "2013J", "sum_click": list(range(10, 30))}).to_csv(raw_dir / "studentVle.csv", index=False)

    report_path = tmp_path / "benchmark_report.json"
    report = benchmark_models(raw_dir, report_path)

    assert report_path.exists()
    persisted = json.loads(report_path.read_text(encoding="utf-8"))
    assert set(persisted) >= {"model_version", "trained_at", "bkt", "random_forest"}
    assert set(report["bkt"]) == {"log_loss", "brier_score", "accuracy", "roc_auc"}
    assert set(report["random_forest"]) == {"log_loss", "brier_score", "accuracy", "roc_auc"}
