/**
 * Automated Document Authenticity & Cross-Verification Pipeline for Indian Identity & Vehicle Documents (DL & RC)
 */

/**
 * Standard Indian DL Validation
 * Format: State Code (2 letters) + RTO Code (2 digits) + Year/Unique Serial (11 digits) e.g., MH1420110012345
 */
export const validateDLNumber = (dlNumber) => {
  if (!dlNumber || typeof dlNumber !== 'string') return false;
  const clean = dlNumber.replace(/[\s-]/g, '').toUpperCase();
  // Standard 15-char DL or 13-16 char state variants
  const standardDlRegex = /^[A-Z]{2}[0-9]{2}[0-9]{11}$/;
  const relaxedDlRegex = /^[A-Z]{2}[0-9]{2}[0-9A-Z]{7,13}$/;
  return standardDlRegex.test(clean) || relaxedDlRegex.test(clean);
};

/**
 * Standard Indian Vehicle Registration Certificate (RC) Validation
 * Format: State Code (2 letters) + District Code (1-2 digits) + Series (1-3 letters) + Unique Number (4 digits)
 * e.g., MH12DE1234, DL3CCE4567, KA01AB1234, MH02EV9821
 */
export const validateRCNumber = (rcNumber) => {
  if (!rcNumber || typeof rcNumber !== 'string') return false;
  const clean = rcNumber.replace(/[\s-]/g, '').toUpperCase();
  const rcRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  return rcRegex.test(clean);
};

/**
 * Compute Levenshtein Edit Distance between two strings
 */
export const levenshteinDistance = (s1 = '', s2 = '') => {
  const a = String(s1).toLowerCase().trim();
  const b = String(s2).toLowerCase().trim();

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
};

/**
 * Calculate Levenshtein-based Name Similarity Percentage (0% - 100%)
 * Handles token re-ordering and initials (e.g., "Shubham Mokashi" vs "Mokashi Shubham")
 */
export const calculateNameSimilarity = (name1 = '', name2 = '') => {
  if (!name1 || !name2) return 0;

  const clean1 = name1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const clean2 = name2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  if (clean1 === clean2) return 100;

  // Direct Levenshtein similarity
  const maxLen = Math.max(clean1.length, clean2.length);
  if (maxLen === 0) return 100;
  const dist = levenshteinDistance(clean1, clean2);
  const directScore = Math.max(0, Math.round(((maxLen - dist) / maxLen) * 100));

  // Token-sorted similarity (handles "First Last" vs "Last First")
  const tokens1 = clean1.split(/\s+/).sort().join(' ');
  const tokens2 = clean2.split(/\s+/).sort().join(' ');
  const tokenMaxLen = Math.max(tokens1.length, tokens2.length);
  const tokenDist = levenshteinDistance(tokens1, tokens2);
  const tokenScore = Math.max(0, Math.round(((tokenMaxLen - tokenDist) / tokenMaxLen) * 100));

  return Math.max(directScore, tokenScore);
};

/**
 * Cross-Validate Document (RC / DL) against User's Verified KYC Identity
 * If match score < 80%, flag for Admin Review.
 */
export const crossValidateDocument = (docData = {}, userKycData = {}) => {
  const { docNumber, docType, extractedName } = docData;
  const { kycName, fullName, name } = userKycData;

  const userVerifiedName = (kycName || fullName || name || '').trim();
  const nameScore = calculateNameSimilarity(extractedName || userVerifiedName, userVerifiedName);

  let isFormatValid = true;
  let formatError = null;

  if (docType === 'RC' || docType === 'REGISTRATION_CERTIFICATE' || docType === 'RC Book') {
    isFormatValid = validateRCNumber(docNumber);
    if (!isFormatValid) formatError = 'Registration Certificate (RC) number format is invalid.';
  } else if (docType === 'DL' || docType === 'DRIVING_LICENSE' || docType === 'Driving License') {
    isFormatValid = validateDLNumber(docNumber);
    if (!isFormatValid) formatError = 'Driving License (DL) number format is invalid.';
  }

  const isNameMatch = nameScore >= 80;
  const isFlaggedForReview = !isNameMatch || !isFormatValid;

  let flagReason = null;
  if (!isFormatValid) {
    flagReason = formatError;
  } else if (!isNameMatch) {
    flagReason = `Document name ('${extractedName}') differs from KYC verified name ('${userVerifiedName}') - Match: ${nameScore}% (Threshold: 80%)`;
  }

  return {
    isValid: isFormatValid && isNameMatch,
    nameMatchScore: nameScore,
    isFormatValid,
    isNameMatch,
    isFlaggedForReview,
    flagReason,
    verifiedName: userVerifiedName,
    extractedName: extractedName || userVerifiedName,
    docNumber: docNumber || ''
  };
};

export default {
  validateDLNumber,
  validateRCNumber,
  levenshteinDistance,
  calculateNameSimilarity,
  crossValidateDocument
};
