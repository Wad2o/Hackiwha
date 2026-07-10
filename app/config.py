from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "ViralContent AI Coach — Backend"
    DEBUG: bool = False
    AI_SERVICE_URL: str = "http://localhost:8001"
    UPLOAD_DIR: str = "uploads"
    DATASET_PATH: str = "data/viral_posts.json"
    MAX_VIDEO_SIZE_MB: int = 100
    ALLOWED_VIDEO_TYPES: list = ["video/mp4", "video/quicktime", "video/webm"]

    class Config:
        env_file = ".env"


settings = Settings()
