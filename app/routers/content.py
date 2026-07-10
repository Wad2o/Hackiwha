from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request
import shutil
import uuid
from pathlib import Path

from app.models.schemas import (
    ContentBrief, ViralStrategy, VideoAnalysis,
    AIServiceRequest, AIAnalyzeRequest
)
from app.services.dataset_service import DatasetService
from app.services.ai_client import get_ai_client, call_ai_generate, call_ai_analyze

router = APIRouter(prefix="/content", tags=["Content Generation"])
dataset_service = DatasetService()
UPLOAD_DIR = Path("uploads")


@router.post("/strategy", response_model=ViralStrategy)
async def generate_strategy(brief: ContentBrief, request: Request):
    """
    Génère une stratégie virale complète à partir du brief utilisateur.

    Inputs du frontend (obligatoires minimum) :
    - video_length : durée de la vidéo en secondes
    - text_content : texte / script de l'utilisateur
    """
    # 1. Récupère les données du dataset
    trending_hooks = dataset_service.get_trending_hooks(
        brief.target_platform,
        brief.account_niche
    )
    sound_trends = dataset_service.get_sound_trends(
        brief.target_platform,
        brief.account_niche
    )
    duration_stats = dataset_service.get_optimal_duration(
        brief.target_platform,
        "shock_statement"
    )

    dataset_insights = {
        "trending_hooks": trending_hooks,
        "sound_trends": sound_trends,
        "optimal_duration": duration_stats
    }

    # 2. Prépare la requête pour l'AI Service
    ai_request = AIServiceRequest(
        brief=brief,
        dataset_insights=dataset_insights
    )

    # 3. Appelle l'AI Service via HTTP
    try:
        client = await get_ai_client(request)
        ai_response = await call_ai_generate(client, ai_request)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI Service error: {str(e)}"
        )

    # 4. Construit la réponse finale pour le frontend
    return ViralStrategy(
        content_brief=brief,
        hook=ai_response.hook,
        sound=ai_response.sound,
        effects=ai_response.effects,
        total_duration=ai_response.total_duration,
        text_overlays=ai_response.text_overlays,
        call_to_action=ai_response.call_to_action,
        confidence_score=ai_response.confidence_score,
        similar_viral_examples=ai_response.similar_viral_examples,
        identity_check=ai_response.identity_check,
    )


@router.post("/analyze-video", response_model=VideoAnalysis)
async def analyze_video(
    video: UploadFile = File(...),
    platform: str = Form("tiktok"),
    niche: str = Form("tech"),
    video_length: int = Form(...),
    text_content: str = Form(...),
    request: Request = None
):
    """
    Upload une vidéo pour analyse par l'IA.

    Inputs du frontend :
    - video : fichier vidéo uploadé
    - platform, niche, video_length, text_content
    """
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    video_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{video_id}_{video.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    brief = ContentBrief(
        product_name="unknown",
        target_platform=platform,
        account_niche=niche,
        tone="hype",
        video_length=video_length,
        text_content=text_content
    )

    # Appelle l'AI Service pour analyse
    ai_request = AIAnalyzeRequest(
        video_path=str(file_path),
        brief=brief
    )

    try:
        client = await get_ai_client(request)
        ai_response = await call_ai_analyze(client, ai_request)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"AI Service error: {str(e)}"
        )

    return VideoAnalysis(
        video_id=video_id,
        detected_hook=ai_response.detected_hook,
        hook_score=ai_response.hook_score,
        pacing_score=ai_response.pacing_score,
        audio_sync_score=ai_response.audio_sync_score,
        identity_check=ai_response.identity_check,
        improvements=ai_response.improvements,
        ai_verdict=ai_response.ai_verdict
    )


@router.get("/trends/{platform}/{niche}")
async def get_trends(platform: str, niche: str):
    """Récupère les tendances actuelles du dataset pour une niche"""
    return {
        "trending_hooks": dataset_service.get_trending_hooks(platform, niche, limit=5),
        "sound_trends": dataset_service.get_sound_trends(platform, niche),
        "optimal_durations": {
            "question": dataset_service.get_optimal_duration(platform, "question"),
            "shock_statement": dataset_service.get_optimal_duration(platform, "shock_statement")
        }
    }
