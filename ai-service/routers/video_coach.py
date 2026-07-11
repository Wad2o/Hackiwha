from fastapi import APIRouter
from app.schemas.video_coach import VideoCoachRequest, VideoCoachResponse
from prompts.video_coach import VIDEO_CRASH_SYSTEM_PROMPT
from services.llm import LLMClient
from services.partial_prompts import build_brand_image_prompt, build_posts_history
from services.tools import video_coach_tools
from app.settings import settings

router = APIRouter()


@router.post("/video-coach", response_model=VideoCoachResponse)
def video_coach(request: VideoCoachRequest) -> VideoCoachResponse:
    llm_client = LLMClient(token=settings.hf_token)
    brand_image = build_brand_image_prompt(request.brand)
    posts = build_posts_history(request.posts)

    user_prompt = f"""
        I need your help to create a video about the following:
        
        {request.prompt}
        
        
        Context:
        
        {brand_image}
        
        ## Previous Posts (Last 3 Posts)
        
        {posts}
    """

    response = llm_client.run(
        system_prompt=VIDEO_CRASH_SYSTEM_PROMPT,
        tools=video_coach_tools,
        user_prompt=user_prompt,
    )

    return VideoCoachResponse(**response)
