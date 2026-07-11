import uuid
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ========== BRAND IMAGE ==========


class Typography(BaseModel):
    titles: str = ""
    texts: str = ""
    extra: str = ""
    highlight: str = ""


class VisualIdentity(BaseModel):
    logo: str = ""
    typography: Typography = Field(default_factory=Typography)
    photography: str = ""
    color_palette: List[str] = Field(default_factory=list)


class BrandTone(BaseModel):
    vocabulary: Literal["natural", "academic", "simplified", "sophisticated"] = "natural"
    humor_level: Literal["none", "occasional_pun", "humour_first"] = "none"
    formality: Literal["casual", "business_professional", "friendly", "hyper_formal"] = "casual"
    sentence_rhythm: Literal["fast", "slow", "efficient", "repetitive"] = "efficient"


class BrandPositioning(BaseModel):
    target_audience: str = ""
    problem_statement: str = ""
    flare: str = ""


class BrandImage(BaseModel):
    """Identité de marque complète"""
    visual: VisualIdentity = Field(default_factory=VisualIdentity)
    tone: BrandTone = Field(default_factory=BrandTone)
    positioning: BrandPositioning = Field(default_factory=BrandPositioning)


# ========== POST ==========


class Post(BaseModel):
    """Un post / campagne"""
    idea: str = ""
    script: str = ""
    hook: str = ""
    platform: Literal["tiktok", "instagram_reels", "youtube_shorts", "facebook_reels"] = "tiktok"
    is_loop: bool = False
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)
    suggested_vfx: str = ""
    suggested_sfx: str = ""


# ========== AI SERVICE ==========


class Experience(BaseModel):
    years: int = Field(default=0, ge=0)
    months: int = Field(default=0, ge=0, le=11)
    days: int = Field(default=0, ge=0, le=30)

    @field_validator("months")
    @classmethod
    def months_range(cls, v: int) -> int:
        if v > 11:
            raise ValueError("months doit être entre 0 et 11")
        return v

    @field_validator("days")
    @classmethod
    def days_range(cls, v: int) -> int:
        if v > 30:
            raise ValueError("days doit être entre 0 et 30")
        return v


class Location(BaseModel):
    country: str = ""
    city: str = ""
    timezone: str = ""


class UserProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    user_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        alias="userId"
    )
    name: str = ""
    description: str = ""
    content_type: List[str] = Field(default_factory=list)
    age: int = Field(default=0, ge=0)
    gender: str = ""
    location: Location = Field(default_factory=Location)
    experience: Experience = Field(default_factory=Experience)


class VideoCoachRequest(BaseModel):
    """POST /video-coach — version complète (usage interne)"""
    user: UserProfile = Field(default_factory=UserProfile)
    brand: BrandImage
    posts: List[Post] = Field(default_factory=list)
    prompt: str = Field(..., description="Ce que l'utilisateur veut promouvoir")


class VideoCoachRequestSimple(BaseModel):
    """
    POST /video-coach — version frontend.
    Le frontend envoie juste userId + brand + prompt.
    Le profil complet est rechargé depuis la DB automatiquement.
    """
    model_config = ConfigDict(populate_by_name=True)
    
    user_id: str = Field(alias="userId")
    brand: BrandImage
    posts: List[Post] = Field(default_factory=list)
    prompt: str = Field(..., description="Ce que l'utilisateur veut promouvoir")


class VideoCoachResponse(BaseModel):
    """Réponse de /video-coach"""
    analysis: str = ""
    script: str = ""
    hook: str = ""
    platform: str = ""
    is_loop: bool = False
    suggested_vfx: str = ""
    suggested_sfx: str = ""
    design_direction: VisualIdentity = Field(default_factory=VisualIdentity)


class PartnerEvaluationRequest(BaseModel):
    """POST /partner-evaluation"""
    user: UserProfile = Field(default_factory=UserProfile)
    partner_brand: str = ""
    brand: BrandImage
    prompt: str = ""


class PartnerEvaluationResponse(BaseModel):
    """Réponse de /partner-evaluation"""
    analysis: str = ""
    compatibility: int = Field(..., ge=0, le=100)
    shared_interests: List[str] = Field(default_factory=list)
    conflict_interests: List[str] = Field(default_factory=list)


class CriticVideoRequest(BaseModel):
    """POST /critic-video — le fichier vidéo est uploadé séparément (multipart)"""
    user: UserProfile = Field(default_factory=UserProfile)
    brand: BrandImage
    posts: List[Post] = Field(default_factory=list)
    prompt: str = ""


class CriticVideoResponse(BaseModel):
    """Réponse de /critic-video"""
    analysis: str = ""
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    critics: str = ""
    solution: str = ""


# ========== DATABASE (CRUD) ==========


class UserCreate(BaseModel):
    email: str


class UserOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(alias="userId")
    email: str
    created_at: datetime


class BrandCreate(BrandImage):
    """Hérite de BrandImage — ajoute juste l'association utilisateur"""
    user_id: str = Field(alias="userId")


class BrandOut(BrandImage):
    model_config = ConfigDict(populate_by_name=True)

    brand_id: str = Field(alias="brandId")
    user_id: str = Field(alias="userId")
    created_at: datetime
    updated_at: datetime


class PostCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str = Field(alias="userId")
    idea: Optional[str] = None
    script: Optional[str] = None
    hook: Optional[str] = None
    platform: str = "tiktok"
    is_loop: bool = False
    suggested_vfx: Optional[str] = None
    suggested_sfx: Optional[str] = None
    design_direction: Optional[VisualIdentity] = None
    analysis: Optional[str] = None
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)


class PostOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    post_id: str = Field(alias="postId")
    user_id: str = Field(alias="userId")
    idea: Optional[str] = None
    script: Optional[str] = None
    hook: Optional[str] = None
    platform: str
    is_loop: bool
    suggested_vfx: Optional[str] = None
    suggested_sfx: Optional[str] = None
    design_direction: Optional[VisualIdentity] = None
    analysis: Optional[str] = None
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)
    created_at: datetime