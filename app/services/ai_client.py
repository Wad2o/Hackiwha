import os
import httpx
from fastapi import Request
from app.models.schemas import (
    VideoCoachRequest, VideoCoachResponse,
    PartnerEvaluationRequest, PartnerEvaluationResponse,
    CriticVideoResponse
)

AI_SERVICE_URL = "http://localhost:8001"
MOCK_AI = os.getenv("MOCK_AI", "true") == "true"  # true par défaut en dev


async def get_ai_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.ai_client


async def call_video_coach(client: httpx.AsyncClient, payload: VideoCoachRequest) -> VideoCoachResponse:
    if MOCK_AI:
        return VideoCoachResponse(
            analysis="## Analyse mock\nTon contenu gaming a un fort potentiel viral.",
            script="Intro choc → Démo gameplay → CTA abonnement",
            hook="POV : tu découvres le glitch qui change tout 👀",
            platform="tiktok",
            is_loop=True,
            suggested_vfx="zoom rapide + flash blanc",
            suggested_sfx="son trending TikTok gaming",
        )
    response = await client.post(
        f"{AI_SERVICE_URL}/video-coach",
        json=payload.model_dump(),
        timeout=60.0
    )
    response.raise_for_status()
    return VideoCoachResponse(**response.json())


async def call_partner_evaluation(client: httpx.AsyncClient, payload: PartnerEvaluationRequest) -> PartnerEvaluationResponse:
    if MOCK_AI:
        return PartnerEvaluationResponse(
            analysis="Bonne compatibilité détectée.",
            compatibility=78,
            shared_interests=["gaming", "jeunes 18-25"],
            conflict_interests=["positionnement prix"],
        )
    response = await client.post(
        f"{AI_SERVICE_URL}/partner-evaluation",
        json=payload.model_dump(),
        timeout=30.0
    )
    response.raise_for_status()
    return PartnerEvaluationResponse(**response.json())


async def call_critic_video(client: httpx.AsyncClient, payload: dict) -> CriticVideoResponse:
    if MOCK_AI:
        return CriticVideoResponse(
            analysis="Vidéo solide mais le hook arrive trop tard.",
            pros=["bonne qualité image", "son clair"],
            cons=["hook après 3 secondes", "pas de CTA"],
            critics="Le viewer décroche avant le moment fort.",
            solution="Commence directement par le moment le plus impactant.",
        )
    response = await client.post(
        f"{AI_SERVICE_URL}/critic-video",
        json=payload,
        timeout=60.0
    )
    response.raise_for_status()
    return CriticVideoResponse(**response.json())