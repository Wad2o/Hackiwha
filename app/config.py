from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "ViralContent AI Coach"
    DEBUG: bool = False
    AI_SERVICE_URL: str = "http://localhost:8001"
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/viralcoach"
    UPLOAD_DIR: str = "uploads"

    # API Keys plateformes
    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    YOUTUBE_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
