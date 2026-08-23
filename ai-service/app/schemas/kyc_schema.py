from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class OCRData(BaseModel):
    document_type: Literal["DRIVING_LICENSE", "REGISTRATION_CERTIFICATE", "UNKNOWN"] = "UNKNOWN"
    document_number: Optional[str] = Field(None, description="Extracted DL or RC registration number")
    full_name: Optional[str] = Field(None, description="Extracted cardholder or vehicle owner name")
    expiry_date: Optional[str] = Field(None, description="Extracted expiry date string (DD/MM/YYYY or YYYY-MM-DD)")
    confidence_score: float = Field(0.0, ge=0.0, le=100.0, description="Average OCR confidence percentage")
    raw_text: List[str] = Field(default_factory=list, description="Raw OCR extracted text blocks")

class KYCOCRResponse(BaseModel):
    success: bool = True
    ocr_data: OCRData

class FaceVerifyResponse(BaseModel):
    success: bool = True
    is_match: bool = Field(..., description="True if face match distance is below configured cutoff threshold")
    match_score: float = Field(..., ge=0.0, le=100.0, description="Computed match percentage confidence (0-100%)")
    distance: float = Field(..., description="Computed facial embedding metric (e.g. cosine distance)")
    threshold: float = Field(..., description="Acceptance cutoff threshold applied")
