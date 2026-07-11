# ingest.py
import json
import faiss
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

KB_DIR = Path("data/knowledge_base")
INDEX_PATH = Path("data/faiss_index/index.faiss")
META_PATH = Path("data/faiss_index/meta.json")
MODEL_NAME = "BAAI/bge-small-en-v1.5"


def load_documents():
    docs = []
    for path in sorted(KB_DIR.glob("*.txt")):
        text = path.read_text(encoding="utf-8").strip()
        if text:
            docs.append({"id": path.stem, "text": text, "source": path.name})
    return docs


def build_index():
    docs = load_documents()
    if not docs:
        raise RuntimeError(f"No .txt files found in {KB_DIR}")

    model = SentenceTransformer(MODEL_NAME)
    texts = [d["text"] for d in docs]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    embeddings = np.asarray(embeddings, dtype="float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_PATH))

    meta = {
        "model_name": MODEL_NAME,
        "dim": dim,
        "docs": [
            {"id": d["id"], "source": d["source"], "text": d["text"]} for d in docs
        ],
    }
    META_PATH.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"Indexed {len(docs)} docs, dim {dim} -> {INDEX_PATH}")


if __name__ == "__main__":
    build_index()
