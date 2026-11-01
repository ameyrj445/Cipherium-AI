import json

from app.models import SubjectRoadmap, Topic


def test_topics_can_be_filtered_by_subject_topic_list(client, db_session):
    included, excluded = db_session.query(Topic).order_by(Topic.id).limit(2).all()
    subject = SubjectRoadmap(
        slug="filter-test-subject",
        roadmap_json=json.dumps({"topic_ids": [included.id]}),
    )
    db_session.add(subject)
    db_session.commit()

    response = client.get(f"/topics?subject_id={subject.id}")

    assert response.status_code == 200
    assert [topic["id"] for topic in response.json()] == [included.id]
    assert excluded.id not in [topic["id"] for topic in response.json()]
