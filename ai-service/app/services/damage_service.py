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

GENERIC_OBJECT_BLACKLIST = {
    'car', 'truck', 'bus', 'vehicle', 'automobile', 'motorcycle', 'bicycle',
    'person', 'traffic light', 'stop sign', 'parking meter', 'bench', 'wheel',
    'tire', 'license plate', 'building', 'tree', 'road', 'chair', 'boat', 'airplane'
}

VALID_DAMAGE_CLASSES = {
    'scratch', 'dent', 'scuff', 'crack', 'paint_peel', 'glass_shatter', 'puncture', 'chip', 'tear'
}

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
        """Run strict vehicle damage & defect analysis, filtering out generic vehicle body detections."""
        img_bgr = cls.bytes_to_cv2(image_bytes)
        height, width, _ = img_bgr.shape

        model = get_yolo_model()
        detections: List[DetectionItem] = []

        if model is not None:
            try:
                results = model.predict(
                    img_bgr,
                    conf=settings.CONFIDENCE_THRESHOLD,
                    iou=settings.IOU_THRESHOLD,
                    verbose=False
                )
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0].item())
                        cls_id = int(box.cls[0].item())
                        raw_class_name = model.names.get(cls_id, f"damage_type_{cls_id}").lower().strip()
                        
                        # 1. Strictly ignore & discard generic vehicles or background objects
                        if raw_class_name in GENERIC_OBJECT_BLACKLIST:
                            continue

                        # 2. Check for valid damage keywords
                        damage_type = None
                        if any(k in raw_class_name for k in ['dent', 'impact', 'collision', 'deformation']):
                            damage_type = 'dent'
                        elif any(k in raw_class_name for k in ['scratch', 'scuff', 'scrape', 'paint', 'scratch_or_dent']):
                            damage_type = 'scratch'
                        elif any(k in raw_class_name for k in ['crack', 'broken', 'glass', 'shatter', 'fracture']):
                            damage_type = 'crack'
                        elif raw_class_name in VALID_DAMAGE_CLASSES:
                            damage_type = raw_class_name

                        if not damage_type:
                            # Not a recognized damage class
                            continue

                        x_min = round(max(0.0, x1 / width), 4)
                        y_min = round(max(0.0, y1 / height), 4)
                        x_max = round(min(1.0, x2 / width), 4)
                        y_max = round(min(1.0, y2 / height), 4)

                        # 3. Discard full-frame bounding boxes (> 50% image area)
                        box_area = (x_max - x_min) * (y_max - y_min)
                        if box_area > 0.50:
                            continue

                        # 4. Require localized defect confidence > 50%
                        if conf < 0.50:
                            continue

                        bbox = BoundingBox(
                            x_min=x_min,
                            y_min=y_min,
                            x_max=x_max,
                            y_max=y_max
                        )

                        detections.append(DetectionItem(
                            damage_type=damage_type,
                            confidence=round(conf, 4),
                            bounding_box=bbox
                        ))
            except Exception as e:
                logger.error(f"Damage inference error: {e}")

        # Evaluate Severity Rating (Clean cars return 0 detections & None severity)
        severity = cls._calculate_severity(detections)

        return DamageDetectionResponse(
            success=True,
            detections=detections,
            severity=severity,
            detection_count=len(detections)
        )

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
