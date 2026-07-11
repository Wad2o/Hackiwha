from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "ViralContent AI Coach"
    DEBUG: bool = False
    AI_SERVICE_URL: str = "http://localhost:8001"
    
    UPLOAD_DIR: str = "uploads"

   

    class Config:
        env_file = ".env"


settings = Settings()
