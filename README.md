# Hackiwha — Gateway Backend (port 8000)

Gateway FastAPI qui orchestre le frontend, le dataset local et l'AI Service.

## Architecture

```
FRONTEND ──HTTP──► Gateway (:8000) ──HTTP──► Hackiwha-ai (:8001)
                        │
                        └── DatasetService (data/viral_posts.json)
```

## Démarrage rapide

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
# Hackiwha-ai doit tourner sur :8001 avant de démarrer ce service
```

## Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/content/strategy` | Génère une stratégie virale complète |
| POST | `/content/analyze-video` | Analyse une vidéo uploadée |
| GET | `/content/trends/{platform}/{niche}` | Tendances du dataset |
| GET | `/health` | Health check |

### `POST /content/strategy`

**Corps minimum :**
```json
{
  "product_name": "nom du produit",
  "target_platform": "tiktok | instagram_reels | youtube_shorts",
  "account_niche": "tech",
  "tone": "hype | educational | storytelling | comedy",
  "video_length": 30,
  "text_content": "script ou idée de vidéo"
}
```

**Réponse (`ViralStrategy`) :**
```json
{
  "content_brief": { "...": "..." },
  "hook": {
    "hook_text": "J'ai dépensé 279€ pour tester l'ANC...",
    "hook_type": "shock_statement",
    "duration_seconds": 5,
    "should_loop": false,
    "why_this_works": "Chiffre précis + tension financière"
  },
  "sound": { "sound_type": "voice_over", "sound_description": "...", "bpm": null },
  "effects": [{ "effect_name": "zoom", "timing": "0:00-0:03", "intensity": "medium" }],
  "total_duration": 30,
  "text_overlays": ["ANC = -42dB"],
  "call_to_action": "Commente ton budget max",
  "confidence_score": 0.88,
  "similar_viral_examples": ["..."],
  "identity_check": {
    "niveau": "moyenne",
    "piliers_en_decalage": ["TON", "RYTHME"],
    "recommandation": "Garder les codes visuels habituels",
    "justification": "..."
  }
}
```

> Le champ de cohérence s'appelle **`identity_check`** (pas `coherence_alert`).

## Schéma CoherenceAlert (identity_check)

```json
{
  "niveau": "forte | moyenne | faible",
  "piliers_en_decalage": ["TON", "UNIVERS_VISUEL", "PROXIMITE", "SUJETS", "RYTHME"],
  "recommandation": "string",
  "justification": "string"
}
```

## Structure

```
Hackiwha/
├── app/
│   ├── main.py                  # FastAPI + lifespan (httpx client partagé)
│   ├── models/schemas.py        # CoherenceAlert, ViralStrategy, ContentBrief...
│   ├── routers/content.py       # Endpoints publics
│   └── services/
│       ├── ai_client.py         # Client HTTP vers Hackiwha-ai (:8001), timeout 90s
│       └── dataset_service.py   # Tendances dataset local
├── data/viral_posts.json
├── uploads/
└── requirements.txt
```
