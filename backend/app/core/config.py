"""
FAHIN — Application Configuration
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "FAHIN"
    DEBUG: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Google Gemini
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # OpenAI (Legacy fallback / Not used)
    OPENAI_API_KEY: str = ""

    # Flower FL Server
    FLOWER_SERVER_ADDRESS: str = "0.0.0.0:8080"

    # External APIs
    OPENAQ_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""

    # Alert thresholds
    OUTBREAK_ALERT_THRESHOLD: float = 0.70  # 70% probability triggers alert
    ANOMALY_ALERT_THRESHOLD: float = 3.0    # 3 sigma above baseline

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    ALLOWED_HOSTS: List[str] = ["*"]

    # ML Model paths
    MODEL_DIR: str = "../ml/models"
    DISEASE_CLASSIFIER_PATH: str = "../ml/models/disease_classifier/ensemble.pkl"
    OUTBREAK_FORECASTER_PATH: str = "../ml/models/outbreak_forecast/lstm.pt"
    ANOMALY_DETECTOR_PATH: str = "../ml/models/anomaly_detection/autoencoder.pt"
    SYMPTOM_EMBEDDER_PATH: str = "../ml/models/symptom_embedding/model.pt"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
