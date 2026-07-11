from fastapi import APIRouter

from app.schemas.partner_evaluator import (
    PartnerEvaluatorRequest,
    PartnerEvaluatorResponse,
)
from prompts.partner_evaluator import PARTNER_EVALUATOR_SYSTEM_PROMPT
from services.llm import LLMClient
from services.partial_prompts import build_brand_image_prompt, build_posts_history
from services.tools import partner_evaluator_tools
from app.settings import settings

router = APIRouter()


@router.post("/partner-evaluation", response_model=PartnerEvaluatorResponse)
def partner_evaluation(request: PartnerEvaluatorRequest):
    llm_client = LLMClient(token=settings.hf_token)
    brand_image = build_brand_image_prompt(request.brand)

    user_prompt = f"""
        I need your help to see if {request.partner_brand} is a good fit to be a partner, 
        
        partner name: {request.partner_brand}
        partner reasoning:
        {request.prompt}
        
        Context:
        
        {brand_image}
    """

    response = llm_client.run(
        system_prompt=PARTNER_EVALUATOR_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        tools=partner_evaluator_tools,
    )

    return PartnerEvaluatorResponse(**response)
