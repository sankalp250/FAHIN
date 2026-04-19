from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "FAHIN"
    DEBUG: bool = True
    
    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    # Database
    DATABASE_URL: str
    
    # AI Keys
    GEMINI_API_KEY: str
    SARVAM_API_KEY: str = ""
    SARVAM_OCR_URL: str = "https://api.sarvam.ai/ocr/v1/extract"
    
    # Supabase (for storage/auth secondary)
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    # Outbreak Alert Thresholds
    OUTBREAK_ALERT_THRESHOLD: float = 0.70
    
    # External APIs
    OPENWEATHER_API_KEY: str = ""
    OPENAQ_API_KEY: str = ""
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"
    )

settings = Settings()
