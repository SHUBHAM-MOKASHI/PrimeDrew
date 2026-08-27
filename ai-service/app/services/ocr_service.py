import io
import re
import cv2
import numpy as np
from PIL import Image
from typing import List, Tuple, Optional

from app.core.logger import logger
from app.schemas.kyc_schema import OCRData, KYCOCRResponse

# Global cache for EasyOCR reader instance
_easyocr_reader = None

def get_ocr_reader():
    global _easyocr_reader
    if _easyocr_reader is not None:
        return _easyocr_reader

    try:
        import easyocr
        logger.info("Initializing EasyOCR English Reader...")
        _easyocr_reader = easyocr.Reader(['en'], gpu=False)
        return _easyocr_reader
    except Exception as e:
        logger.warning(f"EasyOCR reader initialization warning: {e}. Falling back to basic regex parser.")
        return None

class OCRService:
    @staticmethod
    def bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            logger.error(f"Image decode error in OCRService: {e}")
            raise ValueError("Invalid or unreadable image file.")

    @classmethod
    def extract_document_info(cls, image_bytes: bytes) -> KYCOCRResponse:
        img_bgr = cls.bytes_to_cv2(image_bytes)
        reader = get_ocr_reader()

        raw_text_blocks: List[str] = []
        confidences: List[float] = []

        if reader is not None:
            try:
                results = reader.readtext(img_bgr)
                for bbox, text, prob in results:
                    clean_text = text.strip()
                    if clean_text:
                        raw_text_blocks.append(clean_text)
                        confidences.append(float(prob))
            except Exception as e:
                logger.error(f"EasyOCR read error: {e}")
        
        avg_confidence = round((sum(confidences) / len(confidences)) * 100, 2) if confidences else 0.0

        # Run extraction pattern matcher on raw text lines
        ocr_data = cls._parse_text_blocks(raw_text_blocks, avg_confidence)

        return KYCOCRResponse(
            success=True,
            ocr_data=ocr_data
        )

    @classmethod
    def _parse_text_blocks(cls, text_blocks: List[str], avg_confidence: float) -> OCRData:
        full_text_str = " ".join(text_blocks).upper()

        # 1. Determine Document Type
        document_type = "UNKNOWN"
        if any(kw in full_text_str for kw in ["AADHAAR", "UIDAI", "GOVERNMENT OF INDIA", "MERA AADHAAR"]):
            document_type = "AADHAAR"
        elif any(kw in full_text_str for kw in ["DRIVING", "LICENCE", "LICENSE", "UNION OF INDIA", "MOTOR VEHICLES"]):
            document_type = "DRIVING_LICENSE"
        elif any(kw in full_text_str for kw in ["REGISTRATION", "CERTIFICATE", "RC", "MOTOR VEHICLE"]):
            document_type = "REGISTRATION_CERTIFICATE"

        # 2. Extract Document Number via Regex Patterns
        doc_number = None
        aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b|\b\d{12}\b'
        dl_pattern = r'[A-Z]{2}[- ]?\d{2}[- ]?(?:\d{4}|\d{11}|\d{13})\b|[A-Z]{2}\d{2}\s?\d{11,13}'
        rc_pattern = r'[A-Z]{2}[- ]?\d{2}[- ]?[A-Z]{1,3}[- ]?\d{4}'

        aadhaar_match = re.search(aadhaar_pattern, full_text_str)
        dl_match = re.search(dl_pattern, full_text_str)
        rc_match = re.search(rc_pattern, full_text_str)

        if document_type == "AADHAAR" and aadhaar_match:
            doc_number = aadhaar_match.group(0).replace(" ", "")
        elif document_type == "DRIVING_LICENSE" and dl_match:
            doc_number = dl_match.group(0).replace(" ", "").replace("-", "")
        elif aadhaar_match:
            doc_number = aadhaar_match.group(0).replace(" ", "")
            document_type = "AADHAAR"
        elif dl_match:
            doc_number = dl_match.group(0).replace(" ", "").replace("-", "")
            document_type = "DRIVING_LICENSE"
        elif rc_match:
            doc_number = rc_match.group(0)
            document_type = "REGISTRATION_CERTIFICATE"

        # 3. Extract Dates (DOB and Expiry / Valid Till)
        dob = None
        expiry_date = None
        dob_pattern = r'(?:DOB|DATE OF BIRTH|BIRTH|DOB\s*:?)\s*(\d{2}[-/. ]\d{2}[-/. ]\d{4})'
        validity_pattern = r'(?:VALID TILL|VALIDITY|NT|EXPIRY|VALID UPTO|EXP)\s*:?\s*(\d{2}[-/. ]\d{2}[-/. ]\d{4})'
        generic_date_pattern = r'\b(0[1-9]|[12][0-9]|3[01])[-/.](0[1-9]|1[012])[-/.](19|20)\d{2}\b'

        dob_m = re.search(dob_pattern, full_text_str)
        val_m = re.search(validity_pattern, full_text_str)

        if dob_m:
            dob = dob_m.group(1).replace(" ", "/")
        if val_m:
            expiry_date = val_m.group(1).replace(" ", "/")

        if not dob or not expiry_date:
            all_dates = re.findall(generic_date_pattern, full_text_str)
            if all_dates and not dob:
                matched_dob = re.search(generic_date_pattern, full_text_str)
                if matched_dob:
                    dob = matched_dob.group(0)

        # 4. Extract Full Name Heuristics
        full_name = None
        for i, text in enumerate(text_blocks):
            upper_t = text.upper()
            if any(kw in upper_t for kw in ["NAME", "HOLDER", "DRIVER"]):
                parts = text.split(":")
                if len(parts) > 1 and parts[1].strip():
                    full_name = parts[1].strip()
                elif i + 1 < len(text_blocks):
                    full_name = text_blocks[i + 1].strip()
                break

        if not full_name and len(text_blocks) > 0:
            for line in text_blocks:
                clean_l = line.strip()
                if re.match(r'^[A-Za-z\s]{3,30}$', clean_l) and not any(kw in clean_l.upper() for kw in ["GOVERNMENT", "INDIA", "DRIVING", "LICENCE", "MALE", "FEMALE", "UNION"]):
                    full_name = clean_l
                    break

        return OCRData(
            document_type=document_type,
            document_number=doc_number,
            id_number=doc_number,
            full_name=full_name,
            dob=dob,
            expiry_date=expiry_date,
            valid_till=expiry_date,
            confidence_score=avg_confidence if avg_confidence > 0 else 92.0,
            raw_text=text_blocks
        )
