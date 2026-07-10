# ViralContent AI Coach — Backend FastAPI

Gateway FastAPI qui orchestre le frontend, le dataset local et l'AI Service externe.

## Architecture

```
FRONTEND ──HTTP──► BACKEND (Port 8000) ──HTTP──► AI SERVICE (Port 8001)
                      │
                      ▼
                data/viral_posts.json
                uploads/
```

## Structure

```
backend/
├── app/
│   ├── main.py              # Serveur FastAPI + client HTTP vers AI
│   ├── config.py            # Variables d'environnement
│   ├── models/
│   │   └── schemas.py       # Pydantic (inputs/outputs)
│   ├── routers/
│   │   └── content.py       # Endpoints publics
│   └── services/
│       ├── ai_client.py     # Client HTTP vers AI Service
│       └── dataset_service.py # Gestion dataset local
├── data/
│   └── viral_posts.json     # Dataset viral (vide pour l'instant)
├── uploads/                 # Vidéos uploadées par les utilisateurs
├── requirements.txt
├── .env.example
└── .gitignore
```

## Installation

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

pip install -r requirements.txt

cp .env.example .env
```

## Démarrage

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/content/strategy` | Génère stratégie virale |
| POST | `/content/analyze-video` | Analyse vidéo uploadée |
| GET | `/content/trends/{platform}/{niche}` | Tendances dataset |
| GET | `/health` | Health check |

## Inputs du Frontend (obligatoires minimum)

| Champ | Type | Description |
|-------|------|-------------|
| `video_length` | int | Durée de la vidéo en secondes |
| `text_content` | string | Texte / script de l'utilisateur |

## Communication avec l'AI Service

Le backend appelle l'AI Service sur `AI_SERVICE_URL` (défaut: `http://localhost:8001`) :

- `POST /ai/generate` — envoie le brief + dataset_insights, reçoit la stratégie
- `POST /ai/analyze` — envoie le chemin vidéo + brief, reçoit l'analyse

Configure l'URL dans `.env` :
```
AI_SERVICE_URL=http://localhost:8001
```
