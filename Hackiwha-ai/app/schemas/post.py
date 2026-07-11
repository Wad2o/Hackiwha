
from pydantic import BaseModel


class Post(BaseModel):
    idea: str = ""
    script: str = ""
    hook: str = ""
    platform: str = ""
    is_loop: bool = False