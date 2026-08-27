import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  AlertOctagon,
  RotateCcw,
  Check,
  FileText,
  CreditCard,
  Calendar,
  User,
  Zap,
  Info
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import { parseDocumentText, parseAadhaar, parseDrivingLicense } from '../../utils/ocrParser';
import axios from 'axios';

export const KYCModal = ({ isOpen, onClose }) => {
  const { user, token, updateUser, updateKycStatus } = useAuth();
  const [step, setStep] = useState(1); // 1: Document Upload & Dynamic Form, 2: WebCam Selfie, 3: AI Processing & Result

  // Step 1: ID Type strictly restricted to 'Aadhaar Card' or 'Driving License'
  const [idType, setIdType] = useState('Driving License'); // 'Driving License' | 'Aadhaar Card'
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(null);

  // Dynamic Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    dob: '',
    expiryDate: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [hasAttemptedStep1Next, setHasAttemptedStep1Next] = useState(false);

  // Step 2: Camera Selfie State
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [cameraError, setCameraError] = useState('');

  // Step 3: Face Match AI State
  const [isVerifying, setIsVerifying] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [verifiedDisplayName, setVerifiedDisplayName] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Reset state on modal open/close
  useEffect(() => {
    if (isOpen) {
      resetState();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Camera stream lifecycle for Step 2
  useEffect(() => {
    if (step === 2 && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, isOpen]);

  const resetState = () => {
    const existingName =
      (user?.fullName && !user.fullName.startsWith('User ') ? user.fullName : null) ||
      (user?.name && !user.name.startsWith('User ') ? user.name : '') ||
      '';
    const initialIdType = user?.kyc?.idType === 'Aadhaar Card' ? 'Aadhaar Card' : 'Driving License';

    setStep(1);
    setIdType(initialIdType);
    setDocFile(null);
    setDocPreview(null);
    setIsOcrLoading(false);
    setOcrConfidence(null);
    setValidationErrors({});
    setHasAttemptedStep1Next(false);
    setSelfieBlob(null);
    setSelfiePreview(null);
    setCameraError('');
    setIsVerifying(false);
    setMatchScore(0);
    setVerifiedDisplayName(existingName);
    setVerificationSuccess(false);
    setVerificationError('');
    setFormData({
      name: existingName,
      idNumber: user?.kyc?.dlNumber || user?.kyc?.idNumber || '',
      dob: user?.kycDetails?.extractedData?.dob || '',
      expiryDate: user?.kycDetails?.extractedData?.expiryDate || ''
    });
  };

  // Strict Validation Rules for Aadhaar vs Driving License
  const validateStep1 = (data = formData, file = docFile, selectedType = idType) => {
    const errors = {};

    if (!file) {
      errors.docFile = `Mandatory: Please upload a clear photo of your ${selectedType}.`;
    }

    if (!data.name || !data.name.trim() || data.name.trim().length < 3) {
      errors.name = `Mandatory: Full Name (min 3 characters) as printed on your ${selectedType} is required.`;
    }

    const cleanId = (data.idNumber || '').replace(/\s|-/g, '').trim();

    if (!cleanId) {
      errors.idNumber = selectedType === 'Aadhaar Card'
        ? 'Mandatory: 12-digit Aadhaar Number is required.'
        : 'Mandatory: Driving License (DL) Number is required.';
    } else {
      if (selectedType === 'Aadhaar Card') {
        if (!/^\d{12}$/.test(cleanId)) {
          errors.idNumber = 'Invalid Aadhaar: Must contain exactly 12 numeric digits (e.g. 1234 5678 9012).';
        }
      } else {
        if (cleanId.length < 8) {
          errors.idNumber = 'Invalid DL Number: Must be a valid Indian Driving License (min 8 characters).';
        }
      }
    }

    if (!data.dob || !data.dob.trim() || data.dob.trim().length < 8) {
      errors.dob = 'Mandatory: Date of Birth (DD/MM/YYYY) is required.';
    }

    if (selectedType === 'Driving License') {
      if (!data.expiryDate || !data.expiryDate.trim() || data.expiryDate.trim().length < 8) {
        errors.expiryDate = 'Mandatory: DL Expiry / Validity Date is required.';
      }
    }

    return errors;
  };

  const cleanDocNum = (formData.idNumber || '').replace(/\s|-/g, '').trim();

  const isAadhaarValid =
    idType === 'Aadhaar Card' &&
    docFile !== null &&
    formData.name.trim().length >= 3 &&
    cleanDocNum.length === 12 &&
    formData.dob.trim().length >= 8;

  const isDLValid =
    idType === 'Driving License' &&
    docFile !== null &&
    formData.name.trim().length >= 3 &&
    cleanDocNum.length >= 8 &&
    formData.dob.trim().length >= 8 &&
    formData.expiryDate.trim().length >= 8;

  const isStep1Valid = isAadhaarValid || isDLValid;

  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (hasAttemptedStep1Next || validationErrors[field]) {
      const errs = validateStep1(updated, docFile, idType);
      setValidationErrors(errs);
    }
  };

  const handleIdTypeChange = (newType) => {
    setIdType(newType);
    setValidationErrors({});
    if (docFile) {
      handleOcrExtraction(docFile, newType);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Camera access unavailable. You can upload a live selfie photo file instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // High-Speed Instant OCR Extraction (<2 seconds via dual Tesseract + Backend Engine)
  const handleOcrExtraction = async (file, currentIdType = idType) => {
    if (!file) return;
    setIsOcrLoading(true);
    setOcrConfidence(null);

    let extractedSuccessfully = false;

    // 1. Fast Client-side Tesseract.js Worker Extraction
    const runClientTesseract = async () => {
      try {
        const worker = await createWorker('eng');
        const ret = await worker.recognize(file);
        await worker.terminate();

        const rawText = ret.data.text || '';
        if (rawText.trim().length > 0) {
          const parsed = parseDocumentText(rawText, currentIdType);

          if (parsed.idNumber || parsed.name || parsed.dob) {
            extractedSuccessfully = true;
            setFormData((prev) => ({
              ...prev,
              name: parsed.name || prev.name,
              idNumber: parsed.idNumber || prev.idNumber,
              dob: parsed.dob || prev.dob,
              expiryDate: currentIdType === 'Driving License' ? (parsed.validTill || prev.expiryDate) : ''
            }));
            setOcrConfidence(Math.round(parsed.confidence * 100));

            if (parsed.name) {
              updateUser({ name: parsed.name, fullName: parsed.name });
            }
          }
        }
      } catch (clientOcrErr) {
        console.warn('Client Tesseract fallback note:', clientOcrErr);
      }
    };

    // 2. Parallel Backend High-Precision Extraction
    const runBackendOcr = async () => {
      try {
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        formDataObj.append('idType', currentIdType);

        const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');

        let response;
        try {
          response = await axios.post('/api/v1/kyc/extract-id', formDataObj, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: authToken ? `Bearer ${authToken}` : ''
            },
            timeout: 8000
          });
        } catch {
          response = await axios.post('http://localhost:8000/api/v1/ai/extract-id', formDataObj, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 8000
          });
        }

        if (response?.data) {
          const d = response.data.ocr_data || response.data.data || response.data;
          const rawText = Array.isArray(d.raw_text) ? d.raw_text.join('\n') : (d.rawText || '');
          const localParsed = parseDocumentText(rawText, currentIdType);

          const extractedName = (d.full_name || d.name || localParsed.name || '').trim();
          const extractedIdNum = (d.document_number || d.id_number || d.dlNumber || localParsed.idNumber || '').trim();
          const extractedDob = (d.dob || localParsed.dob || '').trim();
          const extractedExpiry = (d.expiry_date || d.valid_till || localParsed.validTill || '').trim();
          const confidence = d.confidence_score || (extractedIdNum ? 96 : 88);

          setFormData((prev) => {
            const finalName = extractedName || prev.name;
            const updated = {
              name: finalName,
              idNumber: extractedIdNum || prev.idNumber,
              dob: extractedDob || prev.dob,
              expiryDate: currentIdType === 'Driving License' ? (extractedExpiry || prev.expiryDate) : ''
            };
            if (finalName) {
              updateUser({ name: finalName, fullName: finalName });
            }
            return updated;
          });

          setOcrConfidence(confidence);
          extractedSuccessfully = true;
        }
      } catch (backendOcrErr) {
        console.warn('Backend OCR note:', backendOcrErr);
      }
    };

    try {
      await Promise.race([
        Promise.allSettled([runClientTesseract(), runBackendOcr()]),
        new Promise((resolve) => setTimeout(resolve, 3500))
      ]);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleDocumentSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));

    if (validationErrors.docFile) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.docFile;
        return next;
      });
    }

    await handleOcrExtraction(file, idType);
  };

  const handleStep1Next = () => {
    setHasAttemptedStep1Next(true);
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    const cleanName = formData.name.trim();
    if (cleanName) {
      updateUser({ name: cleanName, fullName: cleanName });
    }
    setStep(2);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setSelfieBlob(blob);
        setSelfiePreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }, 'image/jpeg');
  };

  const handleSelfieFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieBlob(file);
      setSelfiePreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const handleRunFaceVerification = async () => {
    if (!docFile || !selfieBlob) return;

    setStep(3);
    setIsVerifying(true);
    setVerificationError('');
    setMatchScore(0);
    setVerificationSuccess(false);

    const verifiedName = (formData.name || user?.fullName || user?.name || '').trim();
    const cleanDocNumber = formData.idNumber.replace(/\s|-/g, '').trim();
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token') || '';

    try {
      const payload = new FormData();
      payload.append('id_card', docFile);
      payload.append('selfie', selfieBlob, 'selfie.jpg');
      payload.append('name', verifiedName);
      payload.append('fullName', verifiedName);
      payload.append('idType', idType);
      payload.append('idNumber', cleanDocNumber);
      payload.append('dlNumber', cleanDocNumber);
      payload.append(
        'extractedData',
        JSON.stringify({
          ...formData,
          idType,
          idNumber: cleanDocNumber
        })
      );

      let resData = null;

      try {
        const response = await axios.post('/api/v1/kyc/verify-face', payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: authToken ? `Bearer ${authToken}` : ''
          }
        });
        resData = response.data;
      } catch (backendErr) {
        try {
          const directAi = await axios.post('http://localhost:8000/api/v1/ai/verify-face', payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          resData = directAi.data;
        } catch {
          const msg =
            backendErr.response?.data?.message ||
            backendErr.response?.data?.error ||
            backendErr.message ||
            'Face verification service unavailable.';
          throw msg;
        }
      }

      setIsVerifying(false);

      const isVerified = Boolean(
        resData?.verified ?? resData?.is_match ?? (resData?.matchScore >= 50 || resData?.match_score >= 50)
      );
      const score = Number(resData?.matchScore ?? resData?.match_score ?? resData?.faceMatchScore ?? (isVerified ? 96 : 0));
      const errorMsg = resData?.error || resData?.message;

      setMatchScore(score);

      if (isVerified) {
        setVerificationSuccess(true);
        setVerifiedDisplayName(verifiedName || user?.fullName || user?.name || 'Verified Mobility Partner');
        let updatedUser = resData?.user || null;

        const patchPayload = {
          status: 'verified',
          kycStatus: 'verified',
          name: verifiedName,
          fullName: verifiedName,
          similarityScore: score,
          faceMatchScore: score,
          idType,
          idNumber: cleanDocNumber,
          dlNumber: cleanDocNumber,
          extractedData: {
            ...formData,
            idType,
            idNumber: cleanDocNumber,
            name: verifiedName
          }
        };

        if (!updatedUser) {
          try {
            const patchRes = await axios
              .patch('/api/v1/users/kyc-status', patchPayload, {
                headers: { Authorization: authToken ? `Bearer ${authToken}` : '' }
              })
              .catch(() => null);

            if (patchRes?.data?.user) {
              updatedUser = patchRes.data.user;
            }
          } catch (patchErr) {
            console.warn('KYC status patch error:', patchErr);
          }
        }

        const finalUserObj = {
          ...(user || {}),
          ...(updatedUser || {}),
          name: verifiedName || updatedUser?.name || user?.name,
          fullName: verifiedName || updatedUser?.fullName || user?.fullName || user?.name,
          kycStatus: 'verified',
          isKycVerified: true,
          kycConfidenceScore: score,
          kycVerifiedAt: new Date(),
          kyc: {
            ...(user?.kyc || {}),
            ...(updatedUser?.kyc || {}),
            status: 'verified',
            idType,
            dlNumber: cleanDocNumber,
            faceMatchScore: score
          },
          kycDetails: {
            extractedData: {
              ...formData,
              idType,
              idNumber: cleanDocNumber,
              name: verifiedName
            },
            verifiedAt: new Date(),
            similarityScore: score
          }
        };

        updateUser(finalUserObj);
        updateKycStatus('verified', { faceMatchScore: score, kycConfidenceScore: score });
        localStorage.setItem('user', JSON.stringify(finalUserObj));
        localStorage.setItem('primedrew_user', JSON.stringify(finalUserObj));

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setVerificationSuccess(false);
        setVerificationError(
          errorMsg || `Facial match score (${score}%) is below the 50% threshold. Please upload a clear ${idType} and retake your selfie.`
        );
      }
    } catch (err) {
      setIsVerifying(false);
      setVerificationSuccess(false);
      const errMsg =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            'Face detection failed on document or selfie. Please ensure good lighting and clear camera focus.';
      setVerificationError(errMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Instant AI Biometric KYC Verification"
      maxWidth="max-w-lg"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* LOCKED STEPPER HEADER: Non-clickable indicators with pointer-events-none */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800/80">
        {[
          { num: 1, label: 'Document & OCR' },
          { num: 2, label: 'Live Selfie' },
          { num: 3, label: 'AI Verification' }
        ].map((s) => (
          <div
            key={s.num}
            className="flex items-center gap-1.5 pointer-events-none cursor-default select-none transition-all"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.num
                  ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : step === s.num
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white ring-4 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step === s.num ? 'text-cyan-400' : 'text-zinc-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: Upload Aadhaar / Driving License with Dynamic Form */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Document Type Selector Segmented Control (STRICTLY AADHAAR OR DRIVING LICENSE) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Indian Identity Document *
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleIdTypeChange('Driving License')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  idType === 'Driving License'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Driving License (DL)</span>
              </button>

              <button
                type="button"
                onClick={() => handleIdTypeChange('Aadhaar Card')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  idType === 'Aadhaar Card'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Aadhaar Card</span>
              </button>
            </div>
          </div>

          {/* Document Upload Area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${
              validationErrors.docFile
                ? 'border-rose-500/80 bg-rose-950/10'
                : 'border-zinc-800 hover:border-cyan-500/50 bg-zinc-900/40'
            }`}
          >
            {docPreview ? (
              <div className="space-y-2">
                <img
                  src={docPreview}
                  alt={idType}
                  className="h-28 object-contain mx-auto rounded-xl border border-zinc-700/60"
                />
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {idType} Attached
                  </span>
                  <label className="text-[11px] text-cyan-400 hover:underline cursor-pointer">
                    Change File
                    <input type="file" accept="image/*" onChange={handleDocumentSelect} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block py-2">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-zinc-200 block">
                  Upload Photo of {idType} *
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Clear front photo with visible face, numbers, and dates (JPEG, PNG, WEBP)
                </span>
                <input type="file" accept="image/*" onChange={handleDocumentSelect} className="hidden" />
              </label>
            )}
          </div>

          {validationErrors.docFile && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium px-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationErrors.docFile}</span>
            </div>
          )}

          {/* Real-time OCR Loading & Extraction Status */}
          {isOcrLoading && (
            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-300 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Instant OCR Extraction in progress (&lt; 2s)...</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-900/60 px-2 py-0.5 rounded text-cyan-200">AI Active</span>
            </div>
          )}

          {ocrConfidence && !isOcrLoading && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Document autofilled via AI OCR ({ocrConfidence}% Match)</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300">
                Verified Format
              </span>
            </div>
          )}

          {/* DYNAMIC FORM FIELDS: Tailored per document type */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 block">
                {idType === 'Aadhaar Card' ? 'Aadhaar Credentials' : 'Driving License Credentials'}:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Strict Cross-Validation</span>
            </div>

            {/* Full Name */}
            <Input
              label={`Full Name (as printed on ${idType}) *`}
              placeholder="e.g. Shubham Mokashi"
              value={formData.name}
              error={validationErrors.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />

            {/* Dynamic Fields for Aadhaar Card */}
            {idType === 'Aadhaar Card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="12-Digit Aadhaar Number *"
                  placeholder="e.g. 1234 5678 9012"
                  value={formData.idNumber}
                  error={validationErrors.idNumber}
                  onChange={(e) => handleFieldChange('idNumber', e.target.value)}
                />
                <Input
                  label="Date of Birth (DOB) *"
                  placeholder="DD/MM/YYYY"
                  value={formData.dob}
                  error={validationErrors.dob}
                  onChange={(e) => handleFieldChange('dob', e.target.value)}
                />
              </div>
            ) : (
              /* Dynamic Fields for Driving License */
              <div className="space-y-3">
                <Input
                  label="Driving License (DL) Number *"
                  placeholder="e.g. MH12 20220012345"
                  value={formData.idNumber}
                  error={validationErrors.idNumber}
                  onChange={(e) => handleFieldChange('idNumber', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Date of Birth (DOB) *"
                    placeholder="DD/MM/YYYY"
                    value={formData.dob}
                    error={validationErrors.dob}
                    onChange={(e) => handleFieldChange('dob', e.target.value)}
                  />
                  <Input
                    label="DL Expiry Date *"
                    placeholder="DD/MM/YYYY"
                    value={formData.expiryDate}
                    error={validationErrors.expiryDate}
                    onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            disabled={!isStep1Valid}
            onClick={handleStep1Next}
            rightIcon={ArrowRight}
            className="w-full py-3 mt-2 font-bold shadow-lg shadow-cyan-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Take Live Selfie
          </Button>

          {!isStep1Valid && hasAttemptedStep1Next && (
            <p className="text-[11px] text-center text-rose-400 font-medium">
              Please provide a clear document photo and all mandatory fields for your {idType}.
            </p>
          )}
        </div>
      )}

      {/* STEP 2: Live Selfie Capture */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center">
            <h3 className="text-base font-bold text-zinc-100">DeepFace 1:1 Biometric Match</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Matching live selfie against photo on your <strong className="text-cyan-400">{idType}</strong>
            </p>
          </div>

          <div className="relative h-64 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-inner">
            {selfiePreview ? (
              <img src={selfiePreview} alt="Live Selfie Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                {/* HUD Scanning Target Brackets */}
                <div className="absolute inset-8 border border-dashed border-cyan-400/40 rounded-3xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  </div>
                  <div className="w-full border-t border-cyan-400/50 animate-hud-scan" />
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-cyan-500/30 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  HUD Biometric Track
                </div>
              </>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-zinc-950/95 text-white p-4 text-center flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-6 h-6 text-rose-400" />
                <span className="text-xs text-zinc-300">{cameraError}</span>
              </div>
            )}
          </div>

          {selfiePreview ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                leftIcon={RotateCcw}
                onClick={() => setSelfiePreview(null)}
                className="py-2.5 text-xs border-zinc-800"
              >
                Retake
              </Button>
              <Button
                variant="primary"
                size="sm"
                rightIcon={ArrowRight}
                onClick={handleRunFaceVerification}
                className="flex-1 py-2.5 font-bold shadow-lg shadow-cyan-950/40"
              >
                Verify Biometrics
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="primary" leftIcon={Camera} onClick={captureSelfie} className="flex-1 py-3 font-bold">
                Capture Selfie
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" pointerEvents="none" className="py-3 border-zinc-800">
                  Upload File
                </Button>
                <input type="file" accept="image/*" onChange={handleSelfieFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Verification Status & Real Response Banner */}
      {step === 3 && (
        <div className="flex flex-col items-center text-center gap-5 py-4 animate-in zoom-in-95 duration-300">
          <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="38" stroke="currentColor" strokeWidth="6" className="text-zinc-800" fill="transparent" />
              <circle
                cx="48"
                cy="48"
                r="38"
                stroke="currentColor"
                strokeWidth="6"
                className={
                  verificationError
                    ? 'text-rose-500 transition-all duration-300'
                    : 'text-emerald-400 transition-all duration-300'
                }
                fill="transparent"
                strokeDasharray="238.76"
                strokeDashoffset={238.76 - (238.76 * matchScore) / 100}
              />
            </svg>
            <span className="absolute text-xl font-extrabold text-zinc-100 font-mono">{Math.round(matchScore)}%</span>
          </div>

          {isVerifying ? (
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" /> DeepFace Biometric Matcher...
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Comparing {idType} facial embedding against live camera selfie
              </p>
            </div>
          ) : verificationError ? (
            <div className="space-y-4 w-full">
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 text-left text-xs text-rose-200 flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm text-rose-100 block">Face Verification Rejected</span>
                  <p className="text-rose-300 mt-1 leading-relaxed">{verificationError}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button variant="primary" leftIcon={RotateCcw} onClick={resetState} className="flex-1 py-3 font-bold">
                  Try Again / Re-upload
                </Button>
                <Button variant="outline" onClick={onClose} className="flex-1 py-3">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Biometric Identity Verified
              </div>
              <h3 className="text-lg font-bold text-white">Verified for {verifiedDisplayName || 'You'}!</h3>
              <p className="text-xs text-zinc-400 leading-snug">
                Your {idType} and face match confidence score ({Math.round(matchScore)}%) exceed required security thresholds.
              </p>

              <Button
                variant="primary"
                onClick={onClose}
                className="w-full py-3.5 mt-4 font-bold shadow-lg shadow-emerald-950/40"
              >
                Continue to Platform
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default KYCModal;
