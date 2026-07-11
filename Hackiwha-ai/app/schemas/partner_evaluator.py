from pydantic import BaseModel, Field

from app.schemas.brand import BrandImage


class PartnerEvaluatorRequest(BaseModel):
    partner_brand: str = ""
    brand: BrandImage = (Field(default_factory=BrandImage),)
    prompt: str = ""


class PartnerEvaluatorResponse(BaseModel):
    analysis: str = ""
    compatibility: int = 0
    shared_interests: list[str] = []
    conflict_interests: list[str] = []
