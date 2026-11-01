"""Seed or update Cipherium's local vector store from backend/data/docs."""

from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.services.rag import ingest_documents  # noqa: E402


def main() -> None:
    docs_dir = BACKEND_DIR / "data" / "docs"
    count = ingest_documents(docs_dir)
    print(f"Upserted {count} document chunks from {docs_dir}")


if __name__ == "__main__":
    main()
