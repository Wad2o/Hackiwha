# Chatbot de conseils vidéo (RAG local)

Chatbot qui conseille sur le **choix des sound effects** et le **choix des
références visuelles** selon le moment d'une vidéo, à partir d'une base de
connaissances locale. Les anciens posts servent uniquement au mode de
vérification de cohérence.

## Stack

| Composant     | Choix                                          |
|---------------|-------------------------------------------------|
| Embedding     | `sentence-transformers/all-mpnet-base-v2`        |
| LLM           | `mistralai/Mistral-7B-Instruct-v0.3` (HF Inference API, gratuit) |
| Vector DB     | FAISS (local)                                    |
| Framework     | LangChain + HuggingFace                          |

Deux index FAISS séparés :
- **knowledge_base** → conseils techniques (sound design, refs, rythme)
- **user_style** → anciens posts de l'utilisateur (ton, univers visuel)

Les questions normales utilisent uniquement `knowledge_base`. Le mode `fit:`
utilise `user_style` pour estimer la cohérence d'un thème avec l'identité du
créateur.

## Installation

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

## Configuration

1. Crée un compte gratuit sur https://huggingface.co et génère un token
   (Settings → Access Tokens).
2. Copie `.env.example` en `.env` et colle ton token :
   ```
   HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Charge le `.env` avant de lancer (ou installe `python-dotenv` et
   ajoute `from dotenv import load_dotenv; load_dotenv()` en haut de
   `chatbot.py` si tu préfères l'automatiser).

## Alimenter le chatbot avec tes données

- **Conseils techniques** : ajoute/édite des fichiers `.txt` dans
  `data/knowledge_base/`. Deux fichiers d'exemple sont déjà là (sound
  effects, références visuelles).
- **Ton identité** : remplace `data/user_posts/example_posts.json` par tes
  vrais posts (Instagram, TikTok, YouTube, X...) si tu veux améliorer le mode
  `fit:`. Tu peux ajouter plusieurs fichiers `.json`, ils seront tous ingérés.
  Format attendu :
  ```json
  [
    {
      "id": "post_042",
      "date": "2026-07-01",
      "platform": "tiktok",
      "text": "Le texte de ton post ici..."
    }
  ]
  ```

## Construire les index

```bash
python ingest.py
```
À relancer à chaque fois que tu ajoutes des posts ou des conseils.

## Lancer le chatbot

```bash
python chatbot.py
```

Exemple de question :
```
Toi > Je fais un short sur mon setup de dev IA, quel SFX pour l'intro et quel style de cut ?
```

## Prochaines étapes possibles

- **Approche hybride** : ajouter un module de ranking (ex. règles simples ou
  un petit modèle de scoring) si tu veux classer plusieurs suggestions plutôt
  qu'une seule réponse.
- **Métriques** : pour évaluer la qualité, tu peux logguer les réponses et
  faire du A/B testing manuel (est-ce que le conseil correspond vraiment à
  ton style ?), ou calculer un score de similarité cosinus entre la réponse
  générée et ton corpus de style pour vérifier la cohérence.
- **Interface** : brancher ce backend sur une petite UI (Streamlit ou React +
  FastAPI, vu que tu en as déjà fait pour ton agent de code review).
