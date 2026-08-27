from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class OCRData(BaseModel):
    document_type: Literal["AADHAAR", "DRIVING_LICENSE", "REGISTRATION_CERTIFICATE", "UNKNOWN"] = "UNKNOWN"
    document_number: Optional[str] = Field(None, description="Extracted Aadhaar, DL, or RC registration number")
    id_number: Optional[str] = Field(None, description="Normalized document number")
    full_name: Optional[str] = Field(None, description="Extracted cardholder name")
    dob: Optional[str] = Field(None, description="Extracted Date of Birth (DD/MM/YYYY)")
    expiry_date: Optional[str] = Field(None, description="Extracted expiry date string")
    valid_till: Optional[str] = Field(None, description="Extracted validity string")
    confidence_score: float = Field(0.0, ge=0.0, le=100.0, description="Average OCR confidence percentage")
    raw_text: List[str] = Field(default_factory=list, description="Raw OCR extracted text blocks")

class KYCOCRResponse(BaseModel):
    success: bool = True
    ocr_data: OCRData

class FaceVerifyResponse(BaseModel):
    success: bool = True
    verified: bool = Field(False, description="True if face verification passed distance and similarity threshold")
    is_match: bool = Field(False, description="True if face match distance is below configured cutoff threshold")
    match_score: float = Field(0.0, ge=0.0, le=100.0, description="Computed similarity percentage (0-100%)")
    distance: float = Field(0.0, description="Computed facial embedding distance metric")
    threshold: float = Field(0.4, description="Acceptance cutoff threshold applied")
    error: Optional[str] = Field(None, description="Error message if face detection or verification failed")
