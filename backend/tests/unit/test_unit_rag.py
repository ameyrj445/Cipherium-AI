"""Unit coverage for optional vector retrieval and tutor prompt grounding."""

from app.services import rag, tutor


def test_chunk_document_uses_overlapping_sliding_windows():
    chunks = rag.chunk_document("a" * 1_000, chunk_size=500, overlap=50)

    assert len(chunks) == 3
    assert [len(chunk) for chunk in chunks] == [500, 500, 100]


def test_retrieved_chunks_are_prepended_to_llm_prompt(monkeypatch):
    captured = {}

    class Collection:
        @staticmethod
        def query(query_texts, n_results):
            assert query_texts == ["How does BFS work?"]
            assert n_results == 3
            return {"documents": [["BFS uses a queue."]]}

    class Response:
        status_code = 200

        @staticmethod
        def json():
            return {"candidates": [{"content": {"parts": [{"text": "grounded answer"}]}}]}

    def fake_post(_url, json, timeout):
        captured["prompt"] = json["contents"][0]["parts"][0]["text"]
        return Response()

    monkeypatch.setattr(rag, "_collection", lambda: Collection())
    monkeypatch.setattr(tutor.requests, "post", fake_post)
    monkeypatch.setattr(tutor.settings, "GEMINI_API_KEY", "test-key")

    assert tutor.ask_ai_tutor("How does BFS work?", mode="direct") == "grounded answer"
    assert "[Reference Material]" in captured["prompt"]
    assert "BFS uses a queue." in captured["prompt"]


def test_chroma_unavailability_does_not_stop_tutor(monkeypatch):
    def unavailable():
        raise RuntimeError("Chroma is unavailable")

    monkeypatch.setattr(rag, "_collection", unavailable)

    assert rag.retrieve_context("linked list") == []
    answer = tutor.ask_ai_tutor("Explain linked lists", mode="direct")
    assert len(answer) > 50
