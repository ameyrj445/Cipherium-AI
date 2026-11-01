"""Small, optional Chroma-backed retrieval service for course notes.

Imports of the embedding and database libraries are deliberately lazy: the API
can still start and the tutor can still answer when the vector dependencies have
not yet been installed or a persisted database is unavailable.
"""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import List


EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
COLLECTION_NAME = "cipherium_docs"
BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_PERSIST_DIRECTORY = BACKEND_DIR / "data" / "chroma"


def chunk_document(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping character windows, omitting empty windows."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be non-negative and smaller than chunk_size")

    text = (text or "").strip()
    if not text:
        return []

    step = chunk_size - overlap
    return [text[start : start + chunk_size] for start in range(0, len(text), step)]


def _collection():
    """Return the persistent collection, raising only inside this private helper."""
    import chromadb
    from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

    DEFAULT_PERSIST_DIRECTORY.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(DEFAULT_PERSIST_DIRECTORY))
    embedding_function = SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_function,
    )


def ingest_documents(docs_dir: Path) -> int:
    """Chunk and upsert every Markdown note below *docs_dir*.

    Stable IDs make this operation safe to rerun after notes are edited.  The
    return value is the number of chunks submitted, which is useful to the CLI.
    """
    docs_dir = Path(docs_dir)
    if not docs_dir.exists():
        raise FileNotFoundError(f"Documentation directory does not exist: {docs_dir}")

    collection = _collection()
    ids: List[str] = []
    documents: List[str] = []
    metadatas: List[dict] = []
    for document_path in sorted(docs_dir.rglob("*.md")):
        source = document_path.read_text(encoding="utf-8")
        for index, chunk in enumerate(chunk_document(source)):
            identity = f"{document_path.resolve()}:{index}:{chunk}"
            ids.append(hashlib.sha256(identity.encode("utf-8")).hexdigest())
            documents.append(chunk)
            metadatas.append({"source": str(document_path.relative_to(docs_dir)), "chunk_index": index})

    if ids:
        collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    return len(ids)


def retrieve_context(query: str, top_k: int = 3) -> List[str]:
    """Return the most relevant note chunks, or no chunks when RAG is unavailable."""
    if not query or top_k <= 0:
        return []
    try:
        results = _collection().query(query_texts=[query], n_results=top_k)
        documents = results.get("documents", [])
        return [text for text in (documents[0] if documents else []) if text]
    except Exception:
        # Vector retrieval enhances the tutor but must never make it unavailable.
        return []
