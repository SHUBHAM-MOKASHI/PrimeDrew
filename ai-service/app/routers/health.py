from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "api_version": "v1",
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "face_match_threshold": settings.FACE_MATCH_THRESHOLD
    }
