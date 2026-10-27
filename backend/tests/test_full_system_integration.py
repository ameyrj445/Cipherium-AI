import pytest

def test_full_student_lifecycle_integration(client):
    """
    Simulates a student's complete journey through Cipherium AI:
    1. Register new student account
    2. Authenticate and obtain JWT token
    3. Verify profile (/auth/me)
    4. Fetch topics catalogue
    5. Fetch adaptive question & submit answer
    6. Generate timed mock diagnostic exam & submit attempts
    7. Inspect mastery analytics and dynamic streak
    8. Check AI recommendations and flashcards
    9. Create and save a custom study plan
    10. Fetch subject roadmaps
    11. Fetch and toggle daily tasks
    12. Read and modify learner settings & Gemini status
    13. Send AI tutor question and read back conversation history
    """
    # 1. Register new student
    student_email = "newstudent@cipherium.ai"
    reg_res = client.post("/auth/register", json={
        "name": "Alex Mercer",
        "email": student_email,
        "password": "StrongPassword123!"
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Re-login to verify credentials
    login_res = client.post("/auth/login", json={
        "email": student_email,
        "password": "StrongPassword123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 3. Verify user profile
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == student_email

    # 4. Fetch topics catalogue
    topics_res = client.get("/topics", headers=headers)
    assert topics_res.status_code == 200
    topics = topics_res.json()
    assert len(topics) >= 4
    first_topic_id = topics[0]["id"]

    # 5. Adaptive Quiz Question & Attempt
    q_res = client.get(f"/quizzes/next?topic_id={first_topic_id}", headers=headers)
    assert q_res.status_code == 200
    q = q_res.json()
    assert "id" in q
    assert len(q["options"]) >= 2

    attempt_res = client.post("/quizzes/attempts", headers=headers, json={
        "question_id": q["id"],
        "selected_answer": q["options"][0],
        "time_taken_seconds": 20
    })
    assert attempt_res.status_code == 200
    att_data = attempt_res.json()
    assert "is_correct" in att_data
    assert "new_mastery_score" in att_data

    # 6. Timed Mock Exam Generation & Completion
    exam_res = client.post("/quizzes/exam?question_count=5&time_limit_minutes=15&max_difficulty=3", headers=headers)
    assert exam_res.status_code == 200
    exam = exam_res.json()
    assert len(exam["questions"]) == 5
    for eq in exam["questions"]:
        assert "correct_answer" in eq
        assert "explanation" in eq
        # Submit attempt for each exam question
        client.post("/quizzes/attempts", headers=headers, json={
            "question_id": eq["id"],
            "selected_answer": eq["correct_answer"],
            "time_taken_seconds": 10
        })

    # 7. Mastery Analytics & Dynamic Streak
    mastery_res = client.get("/analytics/mastery", headers=headers)
    assert mastery_res.status_code == 200
    mastery_data = mastery_res.json()
    assert mastery_data["total_quizzes_taken"] >= 6
    assert mastery_data["day_streak"] >= 1

    streak_res = client.get("/analytics/streak", headers=headers)
    assert streak_res.status_code == 200
    assert streak_res.json()["day_streak"] >= 1
    assert streak_res.json()["is_active_today"] is True

    # 8. Recommendations & Flashcards
    recs_res = client.get("/recommendations", headers=headers)
    assert recs_res.status_code == 200
    assert len(recs_res.json()) > 0

    flash_res = client.get("/analytics/flashcards", headers=headers)
    assert flash_res.status_code == 200
    assert len(flash_res.json()) > 0

    # 9. Custom Study Plan Lifecycle
    create_plan_res = client.post("/roadmaps/custom", headers=headers, json={
        "subject": "Data Structures & Algorithms",
        "duration_weeks": 6,
        "target_hours_per_week": 10,
        "skill_level": "Intermediate",
        "learning_goal": "Technical Interviews"
    })
    assert create_plan_res.status_code == 200
    plan_draft = create_plan_res.json()
    assert len(plan_draft["milestones"]) >= 2

    # Save to Learn
    save_plan_res = client.post("/roadmaps/custom/save", headers=headers, json={"plan": plan_draft})
    assert save_plan_res.status_code == 200
    saved_plan = save_plan_res.json()
    assert saved_plan["is_added_to_learn"] is True

    # Read current plan
    current_plan_res = client.get("/roadmaps/current", headers=headers)
    assert current_plan_res.status_code == 200
    assert current_plan_res.json()["id"] == saved_plan["id"]

    # 10. Subject Roadmaps
    subjects_res = client.get("/roadmaps/subjects", headers=headers)
    assert subjects_res.status_code == 200
    assert len(subjects_res.json()) >= 1

    # 11. Daily Tasks Checklist & Toggle
    tasks_res = client.get("/tasks/today", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) >= 3
    first_task = tasks[0]

    # Toggle task to True
    toggle_res1 = client.put(f"/tasks/{first_task['id']}/toggle", headers=headers, json={"is_done": True})
    assert toggle_res1.status_code == 200
    assert toggle_res1.json()["is_done"] is True

    # Toggle task without body (inverts)
    toggle_res2 = client.put(f"/tasks/{first_task['id']}/toggle", headers=headers)
    assert toggle_res2.status_code == 200
    assert toggle_res2.json()["is_done"] is False

    # 12. Settings Profile & Gemini Key
    settings_res = client.get("/settings/profile", headers=headers)
    assert settings_res.status_code == 200

    update_settings_res = client.put("/settings/profile", headers=headers, json={
        "target_role": "Senior Distributed Systems Engineer",
        "weekly_hours": 12,
        "difficulty_mode": "challenging",
        "daily_streak_reminder": True,
        "custom_gemini_api_key": "AIzaSyFakeKeyForIntegrationTesting123"
    })
    assert update_settings_res.status_code == 200
    updated_settings = update_settings_res.json()
    assert updated_settings["target_role"] == "Senior Distributed Systems Engineer"
    assert updated_settings["has_custom_api_key"] is True

    gemini_status_res = client.get("/settings/gemini-status", headers=headers)
    assert gemini_status_res.status_code == 200
    assert gemini_status_res.json()["gemini_key_set"] is True

    # 13. AI Tutor Dialogue & Session History
    chat_res = client.post("/tutor/chat", headers=headers, json={
        "message": "Can you explain how Dijkstra's algorithm finds the shortest path?",
        "topic_id": first_topic_id
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "response" in chat_data
    assert len(chat_data["response"]) > 20

    history_res = client.get("/tutor/history?limit=10", headers=headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 2  # user message and assistant reply
