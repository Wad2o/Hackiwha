from pydantic import BaseModel, Field
from typing import Literal, Optional, List


# ========== REQUÊTES DU FRONTEND ==========

class ContentBrief(BaseModel):
    """Ce que l'utilisateur envoie depuis le frontend"""
    product_name: str = Field(..., description="Nom du produit")
    product_description: Optional[str] = Field(None, description="Description du produit")
    target_platform: Literal["tiktok", "instagram_reels", "youtube_shorts"] = Field(
        ..., description="Plateforme cible"
    )
    account_niche: str = Field(..., description="Niche du compte (tech/gaming/fashion/...)")
    tone: Literal["hype", "educational", "storytelling", "comedy"] = Field(
        ..., description="Ton de la vidéo"
    )
    duration_preference: Optional[int] = Field(
        None, description="Durée préférée en secondes (None = auto)"
    )
    video_length: int = Field(..., ge=5, le=180, description="Durée de la vidéo en secondes")
    text_content: str = Field(..., description="Texte / script de l'utilisateur")


class VideoUploadMeta(BaseModel):
    """Métadonnées quand l'utilisateur upload une vidéo"""
    platform: Literal["tiktok", "instagram_reels", "youtube_shorts"]
    niche: str
    video_length: int
    text_content: str


# ========== RÉPONSES AU FRONTEND ==========

class HookRecommendation(BaseModel):
    hook_text: str
    hook_type: Literal["question", "shock_statement", "challenge", "story", "visual"]
    duration_seconds: int
    should_loop: bool
    why_this_works: str


class SoundRecommendation(BaseModel):
    sound_type: Literal["trending", "original", "voice_over", "silent_with_text"]
    sound_description: str
    bpm: Optional[int] = None


class EffectRecommendation(BaseModel):
    effect_name: str
    timing: str
    intensity: Literal["subtle", "medium", "aggressive"]


class ViralStrategy(BaseModel):
    """La stratégie complète renvoyée au frontend"""
    content_brief: ContentBrief
    hook: HookRecommendation
    sound: SoundRecommendation
    effects: List[EffectRecommendation]
    total_duration: int
    text_overlays: List[str]
    call_to_action: str
    confidence_score: float = Field(..., ge=0, le=1)
    similar_viral_examples: List[str]


class IdentityCheck(BaseModel):
    is_on_brand: bool
    score: float = Field(..., ge=0, le=1)
    feedback: str
    risks: List[str] = []


class VideoAnalysis(BaseModel):
    video_id: str
    detected_hook: str
    hook_score: float
    pacing_score: float
    audio_sync_score: float
    identity_check: IdentityCheck
    improvements: List[str]
    ai_verdict: Literal["publish", "revise", "reject"]


# ========== COMMUNICATION BACKEND ↔ AI SERVICE ==========

class AIServiceRequest(BaseModel):
    """Ce que le backend envoie à l'AI Service"""
    brief: ContentBrief
    dataset_insights: dict


class AIServiceResponse(BaseModel):
    """Ce que l'AI Service renvoie au backend"""
    hook: dict
    sound: dict
    effects: List[dict]
    total_duration: int
    text_overlays: List[str]
    call_to_action: str
    confidence_score: float
    similar_viral_examples: List[str]


class AIAnalyzeRequest(BaseModel):
    """Ce que le backend envoie à l'AI Service pour analyse vidéo"""
    video_path: str
    brief: ContentBrief


class AIAnalyzeResponse(BaseModel):
    """Ce que l'AI Service renvoie après analyse vidéo"""
    detected_hook: str
    hook_score: float
    pacing_score: float
    audio_sync_score: float
    identity_check: dict
    improvements: List[str]
    ai_verdict: str
