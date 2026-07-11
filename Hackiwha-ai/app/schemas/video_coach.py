from pydantic import BaseModel
from app.schemas.brand import BrandImage
from app.schemas.post import Post

class VideoCoachRequest(BaseModel):
    brand: BrandImage
    posts: list[Post] = []
    prompt: str = ""
    
class VideoCoachResponse(BaseModel):
    analysis: str = ""
    script: str = ""
    hook: str = ""
    platform: str = ""
    is_loop: bool = False
    suggested_vfx: str = ""
    suggested_sfx: str = ""
    design_direction: str = ""