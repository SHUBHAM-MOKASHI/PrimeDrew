import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart P2P Rental AI Service"
    API_V1_STR: str = "/api/v1/ai"
    PORT: int = 8000
    CONFIDENCE_THRESHOLD: float = 0.25
    IOU_THRESHOLD: float = 0.45
    FACE_MATCH_THRESHOLD: float = 0.40  # Cosine distance cutoff
    MODEL_PATH: str = "yolov8n.pt"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
