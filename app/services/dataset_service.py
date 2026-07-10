import json
from pathlib import Path
from typing import List, Dict, Optional

DATASET_PATH = Path("data/viral_posts.json")


class DatasetService:
    def __init__(self):
        self.data: List[dict] = []
        self._load_dataset()

    def _load_dataset(self):
        if DATASET_PATH.exists():
            with open(DATASET_PATH, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        else:
            self.data = []

    def get_trending_hooks(
        self,
        platform: str,
        niche: str,
        product_category: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        filtered = [
            post for post in self.data
            if post.get("platform") == platform
            and post.get("niche", "").lower() == niche.lower()
        ]
        if product_category:
            filtered = [p for p in filtered if p.get("product_category") == product_category]
        filtered.sort(
            key=lambda p: (p.get("likes", 0) + p.get("shares", 0)) / max(p.get("views", 1), 1),
            reverse=True
        )
        return filtered[:limit]

    def get_sound_trends(self, platform: str, niche: str) -> List[Dict]:
        from collections import Counter
        sounds = [
            post.get("sound_type") for post in self.data
            if post.get("platform") == platform and post.get("niche") == niche
        ]
        return Counter(sounds).most_common(5)

    def get_optimal_duration(self, platform: str, hook_type: str) -> Dict:
        relevant = [
            post for post in self.data
            if post.get("platform") == platform and post.get("hook_type") == hook_type
        ]
        if not relevant:
            return {"optimal": 15, "range": [10, 30]}
        durations = [p.get("duration", 15) for p in relevant]
        avg = sum(durations) / len(durations)
        return {
            "optimal": round(avg),
            "range": [min(durations), max(durations)],
            "sample_size": len(relevant)
        }

    def add_post(self, post: dict):
        self.data.append(post)
        self._persist()

    def _persist(self):
        with open(DATASET_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, default=str)
