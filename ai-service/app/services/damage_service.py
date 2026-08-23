import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List

from app.core.config import settings
from app.core.logger import logger
from app.schemas.damage_schema import DamageDetectionResponse, DetectionItem, BoundingBox

# Global cache for YOLO model instance
_model_instance = None

def get_yolo_model():
    global _model_instance
    if _model_instance is not None:
        return _model_instance

    try:
        from ultralytics import YOLO
        logger.info(f"Loading YOLOv8 model from weights path: {settings.MODEL_PATH}")
        _model_instance = YOLO(settings.MODEL_PATH)
        return _model_instance
    except Exception as e:
        logger.warning(f"Failed to load primary YOLOv8 model weights ({e}). Operating with vision heuristic fallback engine.")
        return None

class DamageService:
    @staticmethod
    def bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
        """Convert image bytes to OpenCV BGR image array."""
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            logger.error(f"Error decoding image buffer: {e}")
            raise ValueError("Invalid or corrupted image file format.")

    @classmethod
    def analyze_damage(cls, image_bytes: bytes) -> DamageDetectionResponse:
        """Run YOLOv8 inference or fallback heuristic damage detection on image buffer."""
        img_bgr = cls.bytes_to_cv2(image_bytes)
        height, width, _ = img_bgr.shape

        model = get_yolo_model()
        detections: List[DetectionItem] = []

        if model is not None:
            try:
                results = model.predict(img_bgr, conf=settings.CONFIDENCE_THRESHOLD, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        # Extract coordinates normalized
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0].item())
                        cls_id = int(box.cls[0].item())
                        class_name = model.names.get(cls_id, f"damage_type_{cls_id}")

                        # Normalize bounding box coordinates to [0.0, 1.0]
                        bbox = BoundingBox(
                            x_min=round(max(0.0, x1 / width), 4),
                            y_min=round(max(0.0, y1 / height), 4),
                            x_max=round(min(1.0, x2 / width), 4),
                            y_max=round(min(1.0, y2 / height), 4)
                        )

                        detections.append(DetectionItem(
                            damage_type=class_name,
                            confidence=round(conf, 4),
                            bounding_box=bbox
                        ))
            except Exception as e:
                logger.error(f"YOLOv8 inference execution error: {e}. Falling back to visual contour heuristic.")
                detections = cls._fallback_contour_analysis(img_bgr, width, height)
        else:
            detections = cls._fallback_contour_analysis(img_bgr, width, height)

        # Evaluate Severity Rating
        severity = cls._calculate_severity(detections)

        return DamageDetectionResponse(
            success=True,
            detections=detections,
            severity=severity,
            detection_count=len(detections)
        )

    @staticmethod
    def _fallback_contour_analysis(img_bgr: np.ndarray, width: int, height: int) -> List[DetectionItem]:
        """OpenCV contour-based heuristic fallback if neural model is uninitialized."""
        detections = []
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (width * height * 0.005): # Min area filter 0.5%
                x, y, w, h = cv2.boundingRect(cnt)
                bbox = BoundingBox(
                    x_min=round(x / width, 4),
                    y_min=round(y / height, 4),
                    x_max=round((x + w) / width, 4),
                    y_max=round((y + h) / height, 4)
                )
                detections.append(DetectionItem(
                    damage_type="scratch_or_dent",
                    confidence=0.75,
                    bounding_box=bbox
                ))
                if len(detections) >= 5: # Cap max detections
                    break
        return detections

    @staticmethod
    def _calculate_severity(detections: List[DetectionItem]) -> str:
        """
        Severity Rules:
        - None: 0 detections
        - High: >= 3 detections or confidence > 0.85 on structural/crack damages
        - Moderate: 1-2 minor detections
        """
        if not detections:
            return "None"

        has_high_confidence_crack = any(
            d.confidence > 0.85 and any(kw in d.damage_type.lower() for kw in ['crack', 'structural', 'glass', 'broken'])
            for d in detections
        )

        if len(detections) >= 3 or has_high_confidence_crack:
            return "High"
        
        return "Moderate"
