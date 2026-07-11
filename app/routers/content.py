import json
import shutil
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Brand, Post as PostModel, User, UserProfileModel
from app.models.schemas import (
    BrandCreate, BrandOut,
    CriticVideoResponse,
    Experience, Location,
    PartnerEvaluationRequest, PartnerEvaluationResponse,
    PostCreate, PostOut,
    UserCreate, UserOut, UserProfile,
    VideoCoachRequest, VideoCoachRequestSimple, VideoCoachResponse,
)
from app.services.ai_client import (
    call_critic_video,
    call_partner_evaluation,
    call_video_coach,
    get_ai_client,
)

router = APIRouter(prefix="/content", tags=["Content Generation"])
UPLOAD_DIR = Path("uploads")


# ========== HELPER ==========

async def _get_user_profile(user_id: str, db: AsyncSession) -> UserProfile:
    """Recharge un UserProfile depuis la DB à partir du userId."""
    result = await db.execute(
        select(UserProfileModel).where(UserProfileModel.userId == user_id)
    )
    db_profile = result.scalar_one_or_none()
    if not db_profile:
        raise HTTPException(
            status_code=404,
            detail="Profil introuvable. Lance d'abord POST /content/form-user."
        )
    return UserProfile(
        userId=db_profile.userId,
        name=db_profile.name,
        description=db_profile.description,
        content_type=db_profile.content_type or [],
        age=db_profile.age,
        gender=db_profile.gender,
        location=Location(
            country=db_profile.country,
            city=db_profile.city,
            timezone=db_profile.timezone or "",
        ),
        experience=Experience(
            years=db_profile.experience_years,
            months=db_profile.experience_months,
            days=db_profile.experience_days,
        ),
    )


# ========== AI ENDPOINTS ==========

@router.post("/form-user", response_model=UserProfile)
async def user_form(
    name: str = Form(""),
    description: str = Form(""),
    content_type: str = Form(""),
    age: int = Form(0),
    gender: str = Form(""),
    country: str = Form(""),
    city: str = Form(""),
    years: int = Form(0),
    months: int = Form(0),
    days: int = Form(0),
    db: AsyncSession = Depends(get_db),
):
    """
    Reçoit le formulaire user, construit un UserProfile et le persiste en DB.
    Retourne le profil avec son userId — à stocker côté frontend pour les appels suivants.
    """
    try:
        parsed_content_type = json.loads(content_type) if content_type.strip() else []
        if isinstance(parsed_content_type, str):
            parsed_content_type = [parsed_content_type]
    except json.JSONDecodeError:
        parsed_content_type = [c.strip() for c in content_type.split(",") if c.strip()]

    profile = UserProfile(
        name=name,
        description=description,
        content_type=parsed_content_type,
        age=age,
        gender=gender,
        location=Location(country=country, city=city),
        experience=Experience(years=years, months=months, days=days),
    )

    # Sauvegarde en DB
    db_profile = UserProfileModel(
        userId=profile.user_id,
        name=profile.name,
        description=profile.description,
        content_type=profile.content_type,
        age=profile.age,
        gender=profile.gender,
        country=profile.location.country,
        city=profile.location.city,
        timezone=profile.location.timezone,
        experience_years=profile.experience.years,
        experience_months=profile.experience.months,
        experience_days=profile.experience.days,
    )
    db.add(db_profile)
    await db.commit()

    return profile


@router.post("/video-coach", response_model=VideoCoachResponse)
async def video_coach(
    request: VideoCoachRequestSimple,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Génère une stratégie virale.
    Frontend envoie { userId, brand, posts, prompt } — le profil est rechargé depuis la DB.
    """
    user_profile = await _get_user_profile(request.user_id, db)

    full_request = VideoCoachRequest(
        user=user_profile,
        brand=request.brand,
        posts=request.posts,
        prompt=request.prompt,
    )

    try:
        client = await get_ai_client(req)
        return await call_video_coach(client, full_request)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI Service error: {str(e)}")


@router.post("/partner-evaluation", response_model=PartnerEvaluationResponse)
async def partner_evaluation(
    request: PartnerEvaluationRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    """Évalue la compatibilité avec un partenaire."""
    try:
        client = await get_ai_client(req)
        return await call_partner_evaluation(client, request)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI Service error: {str(e)}")


@router.post("/critic-video", response_model=CriticVideoResponse)
async def critic_video(
    req: Request,
    video: UploadFile = File(...),
    user_id: str = Form(...),              # juste l'userId, on recharge depuis DB
    brand: str = Form(...),
    posts: str = Form("[]"),
    prompt: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload une vidéo pour critique par l'IA. Recharge le profil via userId."""
    user_profile = await _get_user_profile(user_id, db)

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    video_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{video_id}_{video.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    payload = {
        "video_path": str(file_path),
        "user": user_profile.model_dump(by_alias=True),
        "brand": json.loads(brand),
        "posts": json.loads(posts),
        "prompt": prompt,
    }

    try:
        client = await get_ai_client(req)
        return await call_critic_video(client, payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI Service error: {str(e)}")


# ========== CRUD USERS ==========

@router.post("/users", response_model=UserOut)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = User(email=user.email)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.get("/users/{userId}", response_model=UserOut)
async def get_user(userId: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.userId == userId))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ========== CRUD BRANDS ==========

def _brand_to_flat(brand: BrandCreate) -> dict:
    return {
        "userId":                brand.user_id,
        "logo":                  brand.visual.logo,
        "photography":           brand.visual.photography,
        "color_palette":         brand.visual.color_palette,
        "title_typography":      brand.visual.typography.titles,
        "text_typography":       brand.visual.typography.texts,
        "extras_typography":     brand.visual.typography.extra,
        "highlights_typography": brand.visual.typography.highlight,
        "vocabulary":            brand.tone.vocabulary,
        "humor_level":           brand.tone.humor_level,
        "formality":             brand.tone.formality,
        "sentence_rhythm":       brand.tone.sentence_rhythm,
        "target_audience":       brand.positioning.target_audience,
        "problem_statement":     brand.positioning.problem_statement,
        "flare":                 brand.positioning.flare,
    }


@router.post("/brands", response_model=BrandOut)
async def create_brand(brand: BrandCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.userId == brand.user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(select(Brand).where(Brand.userId == brand.user_id))
    existing = result.scalar_one_or_none()
    flat = _brand_to_flat(brand)

    if existing:
        for key, value in flat.items():
            if key != "userId" and value is not None:
                setattr(existing, key, value)
        await db.commit()
        await db.refresh(existing)
        return existing

    db_brand = Brand(**flat)
    db.add(db_brand)
    await db.commit()
    await db.refresh(db_brand)
    return db_brand


@router.get("/brands/{userId}", response_model=BrandOut)
async def get_brand(userId: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).where(Brand.userId == userId))
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


# ========== CRUD POSTS ==========

@router.post("/posts", response_model=PostOut)
async def create_post(post: PostCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.userId == post.user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    db_post = PostModel(**post.model_dump(by_alias=False))
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    return db_post


@router.post("/posts/form", response_model=PostOut)
async def create_post_from_form(
    userId: str = Form(...),
    idea: str = Form(""),
    script: str = Form(""),
    hook: str = Form(""),
    platform: str = Form("tiktok"),
    is_loop: bool = Form(False),
    suggested_vfx: str = Form(""),
    suggested_sfx: str = Form(""),
    design_direction: str = Form("{}"),
    analysis: str = Form(""),
    confidence_score: float = Form(None),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.userId == userId))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    try:
        parsed_design = json.loads(design_direction) if design_direction else None
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="design_direction doit être un JSON valide")

    db_post = PostModel(
        userId=userId,
        idea=idea or None,
        script=script or None,
        hook=hook or None,
        platform=platform,
        is_loop=is_loop,
        suggested_vfx=suggested_vfx or None,
        suggested_sfx=suggested_sfx or None,
        design_direction=parsed_design,
        analysis=analysis or None,
        confidence_score=confidence_score,
    )
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    return db_post


@router.get("/posts/{userId}", response_model=List[PostOut])
async def get_user_posts(userId: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PostModel).where(PostModel.userId == userId))
    return result.scalars().all()


@router.delete("/posts/{postId}")
async def delete_post(postId: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PostModel).where(PostModel.postId == postId))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.commit()
    return {"deleted": True}