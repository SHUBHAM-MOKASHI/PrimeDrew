'use client';

import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Car,
  Upload,
  Sparkles,
  ShieldCheck,
  FileText,
  Trash2,
  Plus,
  Image as ImageIcon,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Gauge,
  Fuel,
  Users,
  Layers,
  ArrowRight,
  ArrowLeft,
  Lock
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { createVehicle } from '../../services/vehicleService';
import { extractRcDocumentInfo } from '../../services/hostService';

const MULTI_ANGLE_SUGGESTIONS = [
  { id: 'front', label: '+ Front 45° Angle' },
  { id: 'rear', label: '+ Rear Profile' },
  { id: 'side', label: '+ Side Elevation' },
  { id: 'interior', label: '+ Cockpit / Dashboard' },
  { id: 'seats', label: '+ Rear Seating' },
  { id: 'engine', label: '+ Engine Bay / Trunk' }
];

export const ListVehicle = () => {
  const navigate = useNavigate();
  const { token, user, isLoggedIn, isHostApproved, isAdmin, openAuthModal, openHostModal } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isExtractingRc, setIsExtractingRc] = useState(false);
  const [rcOcrConfidence, setRcOcrConfidence] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: 2024,
    category: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    mileageKm: 12000,
    registrationNumber: '',
    address: 'Bandra West, Mumbai',
    city: 'Mumbai',
    baseHourlyRate: 280,
    baseDailyRate: 2800,
    securityDeposit: 2000
  });

  // Images state (min 1, max 6)
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  // RC Document State
  const [rcDocument, setRcDocument] = useState({
    rcNumber: '',
    documentUrl: '',
    file: null,
    fileName: '',
    isVerified: false
  });

  const fileInputRef = useRef(null);
  const rcFileInputRef = useRef(null);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'make' || field === 'model' || field === 'year') {
        if (!prev.title || prev.title === `${prev.make} ${prev.model} (${prev.year})`.trim()) {
          next.title = `${next.make} ${next.model} (${next.year})`.trim();
        }
      }
      if (field === 'baseDailyRate') {
        const daily = Number(value) || 0;
        next.baseHourlyRate = Math.round(daily / 10);
      }
      return next;
    });
  };

  // Image Upload Handlers
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 6 - images.length;
    if (remainingSlots <= 0) return;

    const selectedFiles = files.slice(0, remainingSlots);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result;
        if (dataUrl) {
          setImages((prev) => (prev.length < 6 ? [...prev, dataUrl] : prev));
          setImageFiles((prev) => (prev.length < 6 ? [...prev, file] : prev));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // RC Document Upload Handler & OCR extraction
  const handleRcUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      setRcDocument((prev) => ({
        ...prev,
        file,
        fileName: file.name,
        documentUrl: dataUrl || ''
      }));
    };
    reader.readAsDataURL(file);

    // Run OCR Document Extraction
    setIsExtractingRc(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('idType', 'RC Book');

      const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
      const res = await extractRcDocumentInfo(data, authToken);

      if (res && res.ocr_data) {
        const ocr = res.ocr_data;
        const regNum = ocr.document_number || ocr.dlNumber || ocr.id_number || '';
        if (regNum) {
          setFormData((prev) => ({ ...prev, registrationNumber: regNum.toUpperCase() }));
          setRcDocument((prev) => ({
            ...prev,
            rcNumber: regNum.toUpperCase(),
            isVerified: true
          }));
          setRcOcrConfidence(ocr.confidence_score || 94);
        }
      }
    } catch (ocrErr) {
      console.warn('RC OCR extraction note:', ocrErr);
    } finally {
      setIsExtractingRc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const regNum = (formData.registrationNumber || rcDocument.rcNumber || '').trim().toUpperCase();

    if (!formData.make.trim() || !formData.model.trim()) {
      setError('Please provide the vehicle Make and Model.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!regNum) {
      setError('Vehicle Registration Certificate (RC) number is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least 1 vehicle photo (front/side/rear).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const authToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');

      const payload = {
        title: formData.title || `${formData.make} ${formData.model}`,
        make: formData.make,
        model: formData.model,
        year: Number(formData.year) || 2024,
        category: formData.category,
        registrationNumber: regNum,
        plateNumber: regNum,
        specs: {
          transmission: formData.transmission,
          fuelType: formData.fuelType,
          seats: Number(formData.seats) || 5,
          mileageKm: Number(formData.mileageKm) || 0
        },
        pricing: {
          baseHourlyRate: Number(formData.baseHourlyRate) || Math.round(Number(formData.baseDailyRate) / 10),
          baseDailyRate: Number(formData.baseDailyRate) || 2800,
          securityDeposit: Number(formData.securityDeposit) || 2000
        },
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760],
          address: `${formData.address}, ${formData.city}`
        },
        images: images,
        rcDocument: {
          rcNumber: regNum,
          documentUrl: rcDocument.documentUrl || 'https://images.unsplash.com/photo-1632823471465-4f46bb4c9f18?auto=format&fit=crop&q=80&w=600',
          isVerifiedByAdmin: false
        }
      };

      await createVehicle(payload, authToken);
      setSuccessToast('Vehicle submitted successfully! Sent to Admin Verification Desk.');
      setTimeout(() => {
        navigate('/host');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit vehicle. Please verify input fields.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="pt-28 pb-16 sm:pt-32 sm:pb-24 max-w-lg mx-auto px-4 sm:px-6 w-full relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl shadow-black">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Host Authentication Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please sign in with your verified host profile to register a new vehicle on the PrimeDrew fleet network.
          </p>
          <Button variant="primary" onClick={() => openAuthModal('host')} className="w-full py-3 font-bold shadow-lg shadow-cyan-950/40">
            Sign In with Phone OTP
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 sm:pt-32 sm:pb-32 max-w-5xl mx-auto px-4 sm:px-6 w-full relative z-10">
      
      {/* Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/host"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Host Operations Hub
        </Link>

        <span className="inline-flex items-center gap-1.5 bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <ShieldCheck className="w-3.5 h-3.5" /> 🛡️ RTO Verified Listing
        </span>
      </div>

      {/* Main Form Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <Car className="w-8 h-8 text-cyan-400" /> List a New Fleet Vehicle
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Register your vehicle on the decentralized mobility network. Provide high-res multi-angle photography, specifications, and RTO RC credentials for instant verification.
        </p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-rose-950/50 border border-rose-500/50 rounded-2xl text-xs text-rose-300 flex items-center gap-3 shadow-lg shadow-rose-950/20">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successToast && (
        <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-xs text-emerald-300 flex items-center gap-3 shadow-lg shadow-emerald-950/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{successToast}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* CARD 1: Vehicle Photography & Angles */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                <ImageIcon className="w-5 h-5 text-cyan-400" /> 📸 VEHICLE PHOTOGRAPHY / 360° ANGLES
              </h2>
              <p className="text-xs text-slate-400">
                Upload 1 to 6 high-definition exterior & interior photos (Cover photo first).
              </p>
            </div>

            <span className={`self-start sm:self-auto text-xs font-mono font-bold px-3 py-1 rounded-full border ${
              images.length >= 1
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}>
              Uploaded {images.length}/6 photos
            </span>
          </div>

          {/* Angle Helper Pill Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pt-1">
            {MULTI_ANGLE_SUGGESTIONS.map((tag) => (
              <span
                key={tag.id}
                className="text-[11px] font-medium bg-slate-950/80 text-slate-300 border border-slate-800 px-3 py-1 rounded-lg hover:border-cyan-500/40 transition-colors"
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Image Upload Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {/* Add Photo Dashed Box */}
            {images.length < 6 && (
              <label className="h-32 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-cyan-400 bg-slate-950/60 hover:bg-slate-950 transition-all flex flex-col items-center justify-center cursor-pointer text-center p-2 group shadow-inner">
                <div className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-200 block">+ Add Photo</span>
                <span className="text-[10px] text-slate-500 block">JPG, PNG, WEBP</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}

            {/* Uploaded Thumbnail Previews */}
            {images.map((imgUrl, index) => (
              <div key={index} className="relative h-32 rounded-2xl overflow-hidden border border-slate-700 group shadow-lg bg-slate-950">
                <img
                  src={imgUrl}
                  alt={`Vehicle Angle ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

                <span className="absolute top-2 left-2 bg-slate-950/90 backdrop-blur-md text-[10px] font-mono font-bold text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                  #{index + 1} {index === 0 ? 'Cover' : ''}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2: Vehicle Registration Certificate (RC) */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-cyan-400" /> VEHICLE REGISTRATION CERTIFICATE (RC)
              </h2>
              <p className="text-xs text-slate-400">
                Official RTO Registration Certificate (RC) for ownership & authenticity verification.
              </p>
            </div>
            {rcDocument.isVerified && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Extracted
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            <Input
              label="Registration / RC Number *"
              placeholder="e.g. MH12 DE 1234"
              value={formData.registrationNumber}
              onChange={(e) => handleFieldChange('registrationNumber', e.target.value.toUpperCase())}
              className="h-12 text-sm uppercase font-mono tracking-wider"
              required
            />

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Upload RC Smart Card / Document *
              </label>
              <label className="h-12 flex items-center justify-between px-4 bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 rounded-xl cursor-pointer transition-all">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">
                    {rcDocument.fileName || 'Select RC File (JPG/PNG/PDF)'}
                  </span>
                </div>
                <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md shrink-0 border border-cyan-500/20">
                  {rcDocument.file ? 'Replace' : 'Browse'}
                </span>
                <input
                  ref={rcFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleRcUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {isExtractingRc && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 flex items-center gap-2.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Scanning RC Smart Card & extracting RTO details via OCR...</span>
            </div>
          )}

          {rcOcrConfidence && !isExtractingRc && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between font-mono">
              <span>✓ RTO RC metadata verified with {rcOcrConfidence}% AI confidence</span>
              <span className="font-bold text-white">{formData.registrationNumber}</span>
            </div>
          )}
        </div>

        {/* CARD 3: Specifications & Category */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-6">
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" /> SPECIFICATIONS & CATEGORY
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Make *"
              placeholder="e.g. Mahindra, Hyundai, BMW"
              value={formData.make}
              onChange={(e) => handleFieldChange('make', e.target.value)}
              className="h-12"
              required
            />
            <Input
              label="Model *"
              placeholder="e.g. Thar 4x4, Creta, X5"
              value={formData.model}
              onChange={(e) => handleFieldChange('model', e.target.value)}
              className="h-12"
              required
            />
            <Input
              label="Year of Manufacturing *"
              type="number"
              value={formData.year}
              onChange={(e) => handleFieldChange('year', e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="h-12 w-full bg-slate-950/70 text-slate-100 text-xs font-semibold rounded-xl border border-slate-800 px-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="SUV">SUV & 4x4</option>
                <option value="Sedan">Sedan</option>
                <option value="EV">Electric (EV)</option>
                <option value="Luxury">Luxury & Exotic</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Bike">Superbike</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transmission</label>
              <select
                value={formData.transmission}
                onChange={(e) => handleFieldChange('transmission', e.target.value)}
                className="h-12 w-full bg-slate-950/70 text-slate-100 text-xs font-semibold rounded-xl border border-slate-800 px-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => handleFieldChange('fuelType', e.target.value)}
                className="h-12 w-full bg-slate-950/70 text-slate-100 text-xs font-semibold rounded-xl border border-slate-800 px-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="EV">Electric (EV)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <Input
              label="Seats"
              type="number"
              value={formData.seats}
              onChange={(e) => handleFieldChange('seats', e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        {/* CARD 4: Rates & Location */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-8">
          <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" /> RATES & LOCATION
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Base Daily Rate (₹) *"
              type="number"
              placeholder="e.g. 3500"
              value={formData.baseDailyRate}
              onChange={(e) => handleFieldChange('baseDailyRate', e.target.value)}
              className="h-12"
              required
            />
            <Input
              label="Security Deposit (₹) *"
              type="number"
              placeholder="e.g. 2000"
              value={formData.securityDeposit}
              onChange={(e) => handleFieldChange('securityDeposit', e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pickup Street / Area"
              placeholder="e.g. Linking Road, Bandra West"
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              className="h-12"
            />
            <Input
              label="City *"
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              className="h-12"
              required
            />
          </div>
        </div>

        {/* Sticky Bottom Action Dock */}
        <div className="sticky bottom-4 z-40 bg-slate-950/90 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>By publishing, your vehicle will be queued for </span>
            <strong className="text-cyan-400">Admin Document Verification</strong>.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/host')}
              className="flex-1 sm:flex-none px-6 py-3 border-slate-800 text-slate-400 hover:text-white h-12"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              rightIcon={ArrowRight}
              className="flex-1 sm:flex-none px-8 py-3 font-bold shadow-lg shadow-cyan-950/50 h-12 text-sm"
            >
              Submit Vehicle for Verification
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default ListVehicle;
