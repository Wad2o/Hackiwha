import httpx
from fastapi import Request
from app.models.schemas import VideoCoachRequest, VideoCoachResponse, PartnerEvaluationRequest, PartnerEvaluationResponse, CriticVideoRequest, CriticVideoResponse

AI_SERVICE_URL = "http://localhost:8001"  # URL de l'AI Service


async def get_ai_client(request: Request) -> httpx.AsyncClient:
    """Récupère le client HTTP partagé depuis l'app FastAPI"""
    return request.app.state.ai_client


async def call_video_coach(client: httpx.AsyncClient, payload: VideoCoachRequest) -> VideoCoachResponse:
    """Appelle l'AI Service pour générer une stratégie virale."""
    response = await client.post(
        f"{AI_SERVICE_URL}/video-coach",
        json=payload.model_dump(),
        timeout=60.0
    )
    response.raise_for_status()
    return VideoCoachResponse(**response.json())


async def call_partner_evaluation(client: httpx.AsyncClient, payload: PartnerEvaluationRequest) -> PartnerEvaluationResponse:
    """Appelle l'AI Service pour évaluer un partenariat."""
    response = await client.post(
        f"{AI_SERVICE_URL}/partner-evaluation",
        json=payload.model_dump(),
        timeout=30.0
    )
    response.raise_for_status()
    return PartnerEvaluationResponse(**response.json())


async def call_critic_video(client: httpx.AsyncClient, payload: dict) -> CriticVideoResponse:
    """
    Appelle l'AI Service pour critiquer une vidéo.
    Payload est un dict car on envoie aussi le chemin du fichier vidéo.
    """
    response = await client.post(
        f"{AI_SERVICE_URL}/critic-video",
        json=payload,
        timeout=60.0
    )
    response.raise_for_status()
    return CriticVideoResponse(**response.json())
