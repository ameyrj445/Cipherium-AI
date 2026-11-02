from app.models import User, UserSettings


def _settings_for_student(db_session):
    user = db_session.query(User).filter(User.email == "student@cipherium.ai").first()
    settings = db_session.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if settings is None:
        settings = UserSettings(user_id=user.id)
        db_session.add(settings)
        db_session.flush()
    return settings


def test_tutor_rejects_user_at_monthly_quota(client, auth_headers, db_session):
    settings = _settings_for_student(db_session)
    settings.monthly_token_used = 50_000
    settings.token_quota = 50_000
    db_session.commit()

    response = client.post("/tutor/chat", headers=auth_headers, json={"message": "Explain arrays"})

    assert response.status_code == 429
    assert response.json()["detail"] == "Monthly AI quota exceeded. Upgrade or wait until next month."


def test_tutor_allows_user_under_monthly_quota_and_charges_tokens(client, auth_headers, db_session):
    settings = _settings_for_student(db_session)
    settings.monthly_token_used = 0
    settings.token_quota = 50_000
    db_session.commit()

    response = client.post("/tutor/chat", headers=auth_headers, json={"message": "Explain arrays", "mode": "direct"})

    assert response.status_code == 200
    db_session.refresh(settings)
    assert settings.monthly_token_used > 0
