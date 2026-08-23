from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.schemas.damage_schema import DamageDetectionResponse
from app.services.damage_service import DamageService
from app.core.logger import logger

router = APIRouter(prefix="/api/v1/ai", tags=["Vehicle Damage Inspection"])

@router.post("/detect-damage", response_model=DamageDetectionResponse)
async def detect_vehicle_damage(file: UploadFile = File(...)):
    """
    Accepts vehicle photo upload file, runs YOLOv8 damage detection,
    and returns bounding boxes with severity classification.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File provided is not a valid image format."
        )

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file uploaded."
            )

        response = DamageService.analyze_damage(contents)
        return response

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing damage detection request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while executing vehicle damage inspection."
        )
