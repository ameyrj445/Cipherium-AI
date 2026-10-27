# Cipherium AI - Datasets & Telemetry Store

This directory organizes raw and processed datasets used by Cipherium AI's Machine Learning and Knowledge Tracing pipelines.

## Directory Structure

```
backend/data/
+-- README.md               # Directory documentation
+-- raw/                    # Raw external datasets (GITIGNORED)
    +-- oulad/              # Open University Learning Analytics Dataset (OULAD)
        +-- assessments.csv
        +-- courses.csv
        +-- studentAssessment.csv
        +-- studentInfo.csv
        +-- studentRegistration.csv
        +-- studentVle.csv  # 10.6M clickstream logs (~453 MB)
        +-- vle.csv
```

## Git & Storage Policy
* Large raw CSV files in `raw/` (>100MB) are explicitly ignored by `.gitignore` to comply with GitHub storage constraints and maintain lightweight repo clones.
* A portable, clean 2,000-record sample is committed to `backend/app/datasets/oulad_student_assessment.csv` for CI/CD test execution and offline fallback.

## Running the Training Pipeline
To run the automated data ingestion, cleaning, and model training pipeline across all 32,593 students and 10.6M clickstream records:

```bash
cd backend
python -m app.ml.train_pipeline
```

Expected benchmark metrics:
* **Accuracy:** 82.8%
* **ROC-AUC:** 91.4%
* **Runtime:** ~6.0s (memory-efficient stream chunking)
