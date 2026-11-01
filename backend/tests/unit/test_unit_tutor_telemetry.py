from app.services import tutor
from app.models import TutorMessage


def test_tutor_response_populates_telemetry(monkeypatch):
    monkeypatch.setattr(
        tutor,
        "retrieve_context_with_ids",
        lambda _query: (["A graph note: BFS uses a queue."], ["chunk-bfs-1"]),
    )

    response, latency_ms, token_count, retrieval_ids = tutor.generate_tutor_response(
        "Explain BFS", mode="direct"
    )

    assert response
    assert latency_ms >= 0
    assert token_count == len(response.split())
    assert retrieval_ids == ["chunk-bfs-1"]


def test_tutor_endpoint_persists_telemetry(client, auth_headers, db_session):
    response = client.post(
        "/tutor/chat",
        headers=auth_headers,
        json={"message": "Explain arrays", "mode": "direct"},
    )

    assert response.status_code == 200
    saved = (
        db_session.query(TutorMessage)
        .filter(TutorMessage.role == "assistant")
        .order_by(TutorMessage.id.desc())
        .first()
    )
    assert saved.latency_ms is not None
    assert saved.token_count == len(saved.message.split())
    assert saved.retrieval_chunk_ids is not None
