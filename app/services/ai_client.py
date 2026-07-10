import httpx
from fastapi import Request
from app.models.schemas import AIServiceRequest, AIServiceResponse, AIAnalyzeRequest, AIAnalyzeResponse

AI_SERVICE_URL = "http://localhost:8001"  # URL de l'AI Service


async def get_ai_client(request: Request) -> httpx.AsyncClient:
    """Récupère le client HTTP partagé depuis l'app FastAPI"""
    return request.app.state.ai_client


async def call_ai_generate(client: httpx.AsyncClient, payload: AIServiceRequest) -> AIServiceResponse:
    """
    Appelle l'AI Service pour générer une stratégie virale.
    """
    response = await client.post(
        f"{AI_SERVICE_URL}/ai/generate",
        json=payload.model_dump(),
        timeout=30.0
    )
    response.raise_for_status()
    return AIServiceResponse(**response.json())


async def call_ai_analyze(client: httpx.AsyncClient, payload: AIAnalyzeRequest) -> AIAnalyzeResponse:
    """
    Appelle l'AI Service pour analyser une vidéo uploadée.
    """
    response = await client.post(
        f"{AI_SERVICE_URL}/ai/analyze",
        json=payload.model_dump(),
        timeout=60.0
    )
    response.raise_for_status()
    return AIAnalyzeResponse(**response.json())
