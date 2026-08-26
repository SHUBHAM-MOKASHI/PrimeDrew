'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Upload, Camera, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, AlertOctagon, RotateCcw, Check, FileText } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export const KYCModal = ({ isOpen, onClose }) => {
  const { user, token, updateUser, updateKycStatus } = useAuth();
  const [step, setStep] = useState(1); // 1: Document Upload, 2: WebCam Selfie, 3: AI Processing & Result

  // Step 1: Document & Editable Fields State
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [extractedData, setExtractedData] = useState({
    name: '',
    idType: 'Driving License',
    docNumber: '',
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
    const existingName = (user?.fullName && !user.fullName.startsWith('User ') ? user.fullName : null) ||
      (user?.name && !user.name.startsWith('User ') ? user.name : '') ||
      '';
    setStep(1);
    setDocFile(null);
    setDocPreview(null);
    setIsOcrLoading(false);
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
    setExtractedData({
      name: existingName,
      idType: user?.kyc?.idType || 'Driving License',
      docNumber: user?.kyc?.dlNumber || '',
      expiryDate: ''
    });
  };

  const validateStep1 = (data = extractedData, file = docFile) => {
    const errors = {};
    if (!file) {
      errors.docFile = 'Mandatory: Please upload a clear photo of your ID document.';
    }
    if (!data.name || !data.name.trim()) {
      errors.name = 'Mandatory: Full Name as on ID document is required.';
    }
    if (!data.idType || !data.idType.trim()) {
      errors.idType = 'Mandatory: Please select an ID Document Type.';
    }
    if (!data.docNumber || !data.docNumber.trim()) {
      errors.docNumber = 'Mandatory: ID / Document number is required.';
    }
    return errors;
  };

  const isStep1Valid = Boolean(
    docFile &&
    extractedData.name &&
    extractedData.name.trim().length > 0 &&
    extractedData.idType &&
    extractedData.idType.trim().length > 0 &&
    extractedData.docNumber &&
    extractedData.docNumber.trim().length > 0
  );

  const handleFieldChange = (field, value) => {
    const updated = { ...extractedData, [field]: value };
    setExtractedData(updated);

    if (hasAttemptedStep1Next || validationErrors[field]) {
      const errs = validateStep1(updated, docFile);
      setValidationErrors(errs);
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
      setCameraError('Camera access unavailable. You can upload a selfie photo file instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleDocumentSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));
    setIsOcrLoading(true);

    if (validationErrors.docFile) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next.docFile;
        return next;
      });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      let response;
      const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');

      try {
        response = await axios.post('/api/v1/kyc/extract-id', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: authToken ? `Bearer ${authToken}` : ''
          }
        });
      } catch {
        response = await axios.post('http://localhost:8000/api/v1/ai/extract-id', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response?.data) {
        const d = response.data.ocr_data || response.data.data || response.data;
        const extractedName = (d.full_name || d.name || '').trim();
        const currentName = extractedData.name || (user?.name && !user.name.startsWith('User ') ? user.name : '');
        
        const finalName = extractedName || currentName;
        const finalDocNum = d.document_number || d.dlNumber || extractedData.docNumber || '';
        const finalExpiry = d.expiry_date || d.expiryDate || extractedData.expiryDate || '';
        const finalIdType = d.document_type || d.documentType || extractedData.idType || 'Driving License';

        const updatedData = {
          name: finalName,
          idType: finalIdType,
          docNumber: finalDocNum,
          expiryDate: finalExpiry
        };

        setExtractedData(updatedData);

        if (finalName) {
          updateUser({ name: finalName, fullName: finalName });
        }

        if (hasAttemptedStep1Next) {
          setValidationErrors(validateStep1(updatedData, file));
        }
      }
    } catch (err) {
      console.warn('OCR extraction warning:', err);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleStep1Next = () => {
    setHasAttemptedStep1Next(true);
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    const cleanName = extractedData.name.trim();
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

    const verifiedName = (extractedData?.name || user?.fullName || user?.name || '').trim();
    const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token') || '';

    try {
      const formData = new FormData();
      formData.append('id_card', docFile);
      formData.append('selfie', selfieBlob, 'selfie.jpg');
      if (verifiedName) {
        formData.append('name', verifiedName);
        formData.append('fullName', verifiedName);
      }
      if (extractedData?.idType) {
        formData.append('idType', extractedData.idType);
      }
      if (extractedData?.docNumber) {
        formData.append('idNumber', extractedData.docNumber);
        formData.append('dlNumber', extractedData.docNumber);
      }
      formData.append('extractedData', JSON.stringify(extractedData));

      let resData = null;

      // Primary: Route through Express backend KYC controller
      try {
        const response = await axios.post('/api/v1/kyc/verify-face', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: authToken ? `Bearer ${authToken}` : ''
          }
        });
        resData = response.data;
      } catch (backendErr) {
        // Secondary fallback: Route directly to AI service if Express proxy had issue
        try {
          const directAiResponse = await axios.post('http://localhost:8000/api/v1/ai/verify-face', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          resData = directAiResponse.data;
        } catch {
          const msg = backendErr.response?.data?.message || backendErr.response?.data?.error || backendErr.message || 'Face verification service unavailable.';
          throw msg;
        }
      }

      setIsVerifying(false);

      const isVerified = Boolean(resData?.verified ?? resData?.is_match ?? (resData?.matchScore >= 50 || resData?.match_score >= 50));
      const score = Number(resData?.matchScore ?? resData?.match_score ?? resData?.faceMatchScore ?? (isVerified ? 94 : 0));
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
          idType: extractedData.idType,
          idNumber: extractedData.docNumber,
          dlNumber: extractedData.docNumber,
          extractedData: {
            ...extractedData,
            name: verifiedName
          }
        };

        // If backend verify-face didn't return updatedUser, patch database directly
        if (!updatedUser) {
          try {
            const patchRes = await axios.patch('/api/v1/users/kyc-status', patchPayload, {
              headers: { Authorization: authToken ? `Bearer ${authToken}` : '' }
            }).catch(() => null);

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
            idType: extractedData.idType,
            dlNumber: extractedData.docNumber || updatedUser?.kyc?.dlNumber,
            faceMatchScore: score
          },
          kycDetails: {
            extractedData: {
              ...extractedData,
              name: verifiedName
            },
            verifiedAt: new Date(),
            similarityScore: score
          }
        };

        // Instantly sync across all context and local storage
        updateUser(finalUserObj);
        updateKycStatus('verified', { faceMatchScore: score, kycConfidenceScore: score });
        localStorage.setItem('user', JSON.stringify(finalUserObj));
        localStorage.setItem('primedrew_user', JSON.stringify(finalUserObj));

        // Auto close after brief celebration
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setVerificationSuccess(false);
        setVerificationError(
          errorMsg || `Facial match score (${score}%) is below required threshold (50%). Please upload a clear photo ID and retake your selfie.`
        );
      }
    } catch (err) {
      setIsVerifying(false);
      setVerificationSuccess(false);
      const errMsg = typeof err === 'string' ? err : err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Face not detected in one of the uploaded images. Please upload a clear photo ID and take a clear selfie.';
      setVerificationError(errMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="60-Second AI Biometric KYC Onboarding"
      maxWidth="max-w-md"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Interactive Progress Stepper Navigation */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800/80">
        {[
          { num: 1, label: 'ID Document' },
          { num: 2, label: 'Live Selfie' },
          { num: 3, label: 'AI Verification' }
        ].map((s) => {
          const canGoToStep2 = s.num === 2 && isStep1Valid;
          const isClickable = s.num === 1 || canGoToStep2;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num === 1) {
                  setStep(1);
                } else if (s.num === 2) {
                  if (isStep1Valid) {
                    setStep(2);
                  } else {
                    setHasAttemptedStep1Next(true);
                    setValidationErrors(validateStep1());
                  }
                }
              }}
              disabled={s.num === 3 && step !== 3}
              className={`flex items-center gap-1.5 transition-all ${
                isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'
              }`}
              title={s.num === 2 && !isStep1Valid ? 'Complete Step 1 fields to proceed' : `Go to Step ${s.num}: ${s.label}`}
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
            </button>
          );
        })}
      </div>

      {/* STEP 1: Upload Driving License / ID Document & Mandatory Form Fields */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center">
            <h3 className="text-base font-bold text-zinc-100">Upload ID Document & Confirm Details</h3>
            <p className="text-xs text-zinc-400 mt-1">All fields are strictly mandatory for biometric KYC</p>
          </div>

          {/* Document Upload Area */}
          <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${
            validationErrors.docFile
              ? 'border-rose-500/80 bg-rose-950/10'
              : 'border-zinc-800 hover:border-cyan-500/50 bg-zinc-900/40'
          }`}>
            {docPreview ? (
              <div className="space-y-2">
                <img src={docPreview} alt="ID Document" className="h-28 object-contain mx-auto rounded-xl border border-zinc-700/60" />
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Document Attached
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
                <span className="text-xs font-bold text-zinc-200 block">Select ID Document Photo *</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Driving License, National ID, Passport (JPEG, PNG, WEBP)</span>
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

          {isOcrLoading && (
            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>EasyOCR extracting credentials in real-time...</span>
            </div>
          )}

          {/* Form Fields: ID Type, Full Name, ID Number, Expiry Date */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <span className="text-xs font-bold text-zinc-400 block">Identification Details (Required):</span>
            
            {/* ID Document Type Dropdown */}
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                ID Document Type *
              </label>
              <select
                value={extractedData.idType}
                onChange={(e) => handleFieldChange('idType', e.target.value)}
                className={`w-full bg-slate-950/70 text-slate-100 text-sm rounded-xl border px-4 py-2.5 outline-none transition-all duration-200 focus:bg-slate-900 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 ${
                  validationErrors.idType ? 'border-rose-500/80' : 'border-slate-800'
                }`}
              >
                <option value="Driving License">Driving License (DL)</option>
                <option value="Aadhaar / National ID">Aadhaar / National ID Card</option>
                <option value="Passport">Passport</option>
                <option value="RC Book">Vehicle RC Book</option>
                <option value="Voter ID">Voter ID</option>
              </select>
              {validationErrors.idType && (
                <span className="text-xs font-medium text-rose-400">{validationErrors.idType}</span>
              )}
            </div>

            {/* Full Name Input */}
            <Input
              label="Full Name (as printed on ID) *"
              placeholder="e.g. Shubham Mokashi"
              value={extractedData.name}
              error={validationErrors.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />

            {/* Document Number and Expiry Date */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Document ID Number *"
                placeholder="e.g. MH022021008921"
                value={extractedData.docNumber}
                error={validationErrors.docNumber}
                onChange={(e) => handleFieldChange('docNumber', e.target.value)}
              />
              <Input
                label="Expiry Date"
                placeholder="DD/MM/YYYY"
                value={extractedData.expiryDate}
                onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
              />
            </div>
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
              Please provide an ID Document photo, Full Name, ID Type, and Document Number to continue.
            </p>
          )}
        </div>
      )}

      {/* STEP 2: Live Selfie Capture */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-center">
            <h3 className="text-base font-bold text-zinc-100">Biometric 1:1 Face Verification</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Matching face for <strong className="text-cyan-400">{extractedData.name}</strong> against ID photo
            </p>
          </div>

          <div className="relative h-64 bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-inner">
            {selfiePreview ? (
              <img src={selfiePreview} alt="Live Selfie Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                {/* Futuristic HUD Scanning Target Brackets */}
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
              <Button variant="outline" leftIcon={RotateCcw} onClick={() => setSelfiePreview(null)} className="py-2.5 text-xs border-zinc-800">
                Retake
              </Button>
              <Button variant="primary" size="sm" rightIcon={ArrowRight} onClick={handleRunFaceVerification} className="flex-1 py-2.5 font-bold shadow-lg shadow-cyan-950/40">
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
                className={verificationError ? 'text-rose-500 transition-all duration-300' : 'text-emerald-400 transition-all duration-300'}
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
              <p className="text-xs text-zinc-400 mt-1">Comparing ID document facial vectors against live selfie</p>
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
                Your identity record and face match confidence score ({Math.round(matchScore)}%) exceed required thresholds.
              </p>

              <Button variant="primary" onClick={onClose} className="w-full py-3.5 mt-4 font-bold shadow-lg shadow-emerald-950/40">
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
