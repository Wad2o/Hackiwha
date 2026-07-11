# search.py
import json
import faiss
import numpy as np
from pathlib import Path
from functools import lru_cache
from sentence_transformers import SentenceTransformer

INDEX_PATH = Path("data/faiss_index/index.faiss")
META_PATH = Path("data/faiss_index/meta.json")


@lru_cache(maxsize=1)
def _load():
    index = faiss.read_index(str(INDEX_PATH))
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    model = SentenceTransformer(meta["model_name"])
    return index, meta["docs"], model


def search(query: str, k: int = 3) -> list[dict]:
    index, docs, model = _load()
    q_emb = model.encode([query], normalize_embeddings=True)
    q_emb = np.asarray(q_emb, dtype="float32")
    scores, idxs = index.search(q_emb, k)

    results = []
    for score, idx in zip(scores[0], idxs[0]):
        if idx == -1:
            continue
        d = docs[idx]
        results.append(
            {
                "id": d["id"],
                "source": d["source"],
                "text": d["text"],
                "score": float(score),
            }
        )
    return results


def knowledge_base_query(query: str) -> str:
    print(f"[LOG] Knowledge Base Tool used, {query}")
    results = search(query)

    response = "Results of the knowledge Base Search Is as follows:" + "\n\n".join(
        f"{idx}. {res.source} ({res.score}):\n\n{res.text}"
        for idx, res in enumerate(results, start=1)
    )
    return response
