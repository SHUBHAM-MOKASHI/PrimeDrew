from typing import List, Literal
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x_min: float = Field(..., description="Normalized minimum X coordinate [0.0, 1.0]")
    y_min: float = Field(..., description="Normalized minimum Y coordinate [0.0, 1.0]")
    x_max: float = Field(..., description="Normalized maximum X coordinate [0.0, 1.0]")
    y_max: float = Field(..., description="Normalized maximum Y coordinate [0.0, 1.0]")

class DetectionItem(BaseModel):
    damage_type: str = Field(..., description="Classified damage category (e.g. scratch, dent, glass_crack)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bounding_box: BoundingBox = Field(..., description="Normalized bounding box location")

class DamageDetectionResponse(BaseModel):
    success: bool = True
    detections: List[DetectionItem] = Field(default_factory=list)
    severity: Literal["None", "Moderate", "High"] = Field("None", description="Overall evaluated vehicle damage severity")
    detection_count: int = Field(0, description="Total number of detected damage regions")
