/**
 * High-Accuracy Instant Indian ID Document OCR Parsing Engine
 * Supports Aadhaar Card (12 Digits + DOB) and Driving License (Standard Indian DL Format + Validity)
 */

/**
 * Aadhaar Card Parser (12 Digits, DOB: DD/MM/YYYY, Full Name)
 */
export const parseAadhaar = (rawText) => {
  if (!rawText) return { idNumber: '', dob: '', name: '', confidence: 0 };
  const cleanText = rawText.replace(/\r?\n/g, ' ');

  // 12-digit Aadhaar pattern (e.g. 1234 5678 9012 or 123456789012)
  const aadhaarMatch = cleanText.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/) ||
                       cleanText.match(/\b\d{12}\b/);

  // DOB pattern (DOB: DD/MM/YYYY or Year of Birth / YOB: YYYY)
  const dobMatch = cleanText.match(/(?:DOB|Date of Birth|Birth|DOB\s*:?)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) ||
                   cleanText.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);

  // Extract Name Heuristic: Looks for text before "DOB" or lines containing name
  let name = '';
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/Government of India|Unique Identification|UIDAI|ENROLMENT/i.test(line)) continue;
    if (/DOB|Date of Birth|Year of Birth|Male|Female|Father|To/i.test(line)) break;
    if (line.length >= 3 && /^[A-Za-z\s]+$/.test(line) && line.split(' ').length >= 2) {
      name = line;
      break;
    }
  }

  return {
    idNumber: aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, '') : '',
    dob: dobMatch ? dobMatch[1] : '',
    name: name || '',
    confidence: aadhaarMatch ? 0.95 : 0.60
  };
};

/**
 * Driving License Parser (Standard Indian DL Format e.g., MH12 20220012345, Expiry, DOB)
 */
export const parseDrivingLicense = (rawText) => {
  if (!rawText) return { idNumber: '', dob: '', validTill: '', name: '', confidence: 0 };
  const cleanText = rawText.replace(/\r?\n/g, ' ');

  // Standard Indian DL Regex (State Code + 13-15 Digits / alphanumeric format)
  const dlMatch = cleanText.match(/[A-Z]{2}[-\s]?\d{2}[-\s]?(?:\d{4}|\d{11}|\d{13})\b/i) ||
                  cleanText.match(/([A-Z]{2}\d{2}\s?\d{11,13})/i) ||
                  cleanText.match(/([A-Z]{2}[-\s]?\d{2}[-\s]?[0-9A-Z]{7,13})/i);

  const dobMatch = cleanText.match(/(?:DOB|Date of Birth|DOB\s*:?)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) ||
                   cleanText.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);

  const validityMatch = cleanText.match(/(?:Valid Till|Validity|NT|Expiry|Valid Upto|EXP)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);

  // Extract Name Heuristics for DL
  let name = '';
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:Name|Holder|Driver|Name\s*:)\s*([A-Za-z\s]+)/i.test(line)) {
      const match = line.match(/(?:Name|Holder|Driver|Name\s*:)\s*([A-Za-z\s]+)/i);
      if (match && match[1]) {
        name = match[1].trim();
        break;
      }
    }
  }

  return {
    idNumber: dlMatch ? dlMatch[0].replace(/\s|-/g, '') : '',
    dob: dobMatch ? dobMatch[1] : '',
    validTill: validityMatch ? validityMatch[1] : '',
    name: name || '',
    confidence: dlMatch ? 0.95 : 0.60
  };
};

/**
 * Universal Unified Parser based on selected ID type
 */
export const parseDocumentText = (rawText, idType = 'Driving License') => {
  if (idType === 'Aadhaar Card' || idType === 'Aadhaar' || idType === 'AADHAAR') {
    return {
      type: 'Aadhaar Card',
      ...parseAadhaar(rawText)
    };
  }
  return {
    type: 'Driving License',
    ...parseDrivingLicense(rawText)
  };
};
