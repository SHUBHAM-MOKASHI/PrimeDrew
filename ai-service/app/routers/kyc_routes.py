from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.schemas.kyc_schema import KYCOCRResponse, FaceVerifyResponse
from app.services.ocr_service import OCRService
from app.services.face_service import FaceService
from app.core.logger import logger

router = APIRouter(prefix="/api/v1/ai", tags=["KYC Identity Verification"])

@router.post("/extract-id", response_model=KYCOCRResponse)
async def extract_kyc_document(file: UploadFile = File(...)):
    """
    Extracts text, document type (DL/RC), document number, name, and expiry date
    from an uploaded ID card or vehicle registration document image.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File uploaded is not a valid image file."
        )

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file received."
            )

        response = OCRService.extract_document_info(contents)
        return response

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error during KYC document OCR extraction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract document metadata."
        )

@router.post("/verify-face", response_model=FaceVerifyResponse)
async def verify_user_face(
    id_card: UploadFile = File(...),
    selfie: UploadFile = File(...)
):
    """
    Performs 1:1 biometric identity comparison between an ID card photo
    and a selfie image, returning similarity metrics.
    """
    if not id_card.content_type.startswith("image/") or not selfie.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both id_card and selfie must be valid image files."
        )

    try:
        id_bytes = await id_card.read()
        selfie_bytes = await selfie.read()

        if not id_bytes or not selfie_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or both uploaded files are empty."
            )

        response = FaceService.verify_biometric_faces(id_bytes, selfie_bytes)
        return response

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error during biometric face verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Biometric verification failed."
        )
