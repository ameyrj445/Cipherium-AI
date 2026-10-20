"""
Dataset Generator & Preprocessing for OULAD (Open University Learning Analytics Dataset)
and EdNet (KT1) formats as specified in Section 3 of Cipherium AI Implementation Guide.
Generates realistic benchmark data simulating student assessment interactions, clicks,
time spent, and quiz outcomes for ML model training.
"""
import os
import csv
import random

DATASETS_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_oulad_engagement_dataset(filename="oulad_student_assessment.csv", num_records=1200):
    filepath = os.path.join(DATASETS_DIR, filename)
    if os.path.exists(filepath):
        return filepath

    # Topics mapping to syllabus
    topics = ["DSA-ARRAYS", "DSA-LINKEDLIST", "DSA-TREES", "DSA-GRAPHS", "SQL-INDEXES", "SYS-REST", "ML-REGRESSION", "ML-CLASSIFICATION"]
    
    # Columns matching OULAD schema: id_assessment, id_student, date_submitted, is_banked, score, total_clicks, study_hours
    fields = ["id_assessment", "id_student", "topic_code", "date_submitted", "study_hours", "vle_clicks", "prior_attempts", "assessment_score", "is_weak"]
    
    records = []
    for i in range(1, num_records + 1):
        student_id = random.randint(1001, 1150)
        topic = random.choice(topics)
        study_hours = round(random.uniform(0.5, 12.0), 1)
        clicks = random.randint(5, 250)
        prior_attempts = random.randint(0, 8)
        
        # Realistic propensity: higher study hours and clicks improve score
        base_score = 40 + (study_hours * 3.5) + (clicks * 0.1) - (prior_attempts * 1.5) + random.uniform(-15, 15)
        score = max(0, min(100, round(base_score, 1)))
        
        # Label weak if score < 50
        is_weak = 1 if score < 50.0 else 0

        records.append({
            "id_assessment": i,
            "id_student": student_id,
            "topic_code": topic,
            "date_submitted": random.randint(10, 180),
            "study_hours": study_hours,
            "vle_clicks": clicks,
            "prior_attempts": prior_attempts,
            "assessment_score": score,
            "is_weak": is_weak
        })

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated OULAD dataset at: {filepath} with {num_records} records.")
    return filepath

if __name__ == "__main__":
    generate_oulad_engagement_dataset()
