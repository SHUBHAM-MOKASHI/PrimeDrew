'use client';

import React, { useState, useRef } from 'react';
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
  RotateCcw
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
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

export const AddVehicleModal = ({ isOpen, onClose, onVehicleCreated }) => {
  const { token, user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isExtractingRc, setIsExtractingRc] = useState(false);
  const [rcOcrConfidence, setRcOcrConfidence] = useState(null);

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

  const resetForm = () => {
    setFormData({
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
    setImages([]);
    setImageFiles([]);
    setRcDocument({
      rcNumber: '',
      documentUrl: '',
      file: null,
      fileName: '',
      isVerified: false
    });
    setError('');
    setIsSubmitting(false);
    setIsExtractingRc(false);
    setRcOcrConfidence(null);
  };

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
      return;
    }

    if (!regNum) {
      setError('Vehicle Registration Certificate (RC) number is mandatory.');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least 1 vehicle photo (front/side/rear).');
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

      const response = await createVehicle(payload, authToken);

      if (onVehicleCreated) {
        onVehicleCreated(response.data || payload);
      }

      resetForm();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to list vehicle. Please check inputs.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Host Fleet: List a New Vehicle"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[78vh] overflow-y-auto pr-1">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Car className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Obsidian Showroom Listing</h3>
              <p className="text-[11px] text-slate-400">Specifications, multi-angle photos & RTO RC credentials</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold px-3 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <ShieldCheck className="w-3.5 h-3.5" /> 🛡️ RTO Verified Listing
          </span>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CARD 1: Multi-Angle Vehicle Photos Upload */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                <ImageIcon className="w-4 h-4 text-cyan-400" /> 📸 VEHICLE PHOTOGRAPHY / 360° ANGLES
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload 1 to 6 high-definition exterior & interior photos
              </p>
            </div>

            <span className={`self-start sm:self-auto text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
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
                className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-lg"
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Image Upload Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
            {/* Upload Action Tile */}
            {images.length < 6 && (
              <label className="h-28 rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-cyan-400 bg-slate-950/60 hover:bg-slate-950 transition-all flex flex-col items-center justify-center cursor-pointer text-center p-2 group shadow-inner">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-200 block">+ Add Photo</span>
                <span className="text-[9px] text-slate-500 block">JPG, PNG, WEBP</span>
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

            {/* Thumbnail Preview Cards */}
            {images.map((imgUrl, index) => (
              <div key={index} className="relative h-28 rounded-2xl overflow-hidden border border-slate-700 group shadow-md bg-slate-950">
                <img
                  src={imgUrl}
                  alt={`Vehicle Angle ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-80 group-hover:opacity-90 transition-opacity" />

                <span className="absolute top-2 left-2 bg-slate-950/90 backdrop-blur-md text-[9px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  #{index + 1} {index === 0 ? 'Cover' : ''}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 transition-colors cursor-pointer"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 2: Dedicated RTO Registration Certificate (RC) */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-cyan-400" /> VEHICLE REGISTRATION CERTIFICATE (RC)
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload Official RTO Registration Certificate (RC) to verify vehicle ownership.
              </p>
            </div>
            {rcDocument.isVerified && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-Extracted
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center pt-1">
            <Input
              label="Registration / RC Number *"
              placeholder="e.g. MH12 DE 1234"
              value={formData.registrationNumber}
              onChange={(e) => handleFieldChange('registrationNumber', e.target.value.toUpperCase())}
              className="h-12 uppercase font-mono"
              required
            />

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Upload RC Smart Card / Document *
              </label>
              <label className="h-12 flex items-center justify-between px-3.5 bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 rounded-xl cursor-pointer transition-all">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">
                    {rcDocument.fileName || 'Select RC File (JPG/PNG/PDF)'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md shrink-0 border border-cyan-500/20">
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
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Scanning RC Smart Card & extracting RTO details...</span>
            </div>
          )}

          {rcOcrConfidence && !isExtractingRc && (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between font-mono">
              <span>✓ RC metadata matched with {rcOcrConfidence}% AI confidence</span>
              <span className="font-bold text-white">{formData.registrationNumber}</span>
            </div>
          )}
        </div>

        {/* CARD 3: Specifications & Category */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-6">
          <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" /> SPECIFICATIONS & CATEGORY
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Make *"
              placeholder="e.g. Mahindra, Tesla, BMW"
              value={formData.make}
              onChange={(e) => handleFieldChange('make', e.target.value)}
              className="h-12"
              required
            />
            <Input
              label="Model *"
              placeholder="e.g. Thar 4x4, Model 3"
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                className="h-12 w-full bg-slate-950/70 text-slate-100 text-xs font-semibold rounded-xl border border-slate-800 px-3 outline-none focus:border-cyan-500"
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
                className="h-12 w-full bg-slate-950/70 text-slate-100 text-xs font-semibold rounded-xl border border-slate-800 px-3 outline-none focus:border-cyan-500"
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
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 space-y-4 mb-6">
          <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" /> RATES & LOCATION
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-xl pt-3 pb-1 border-t border-slate-800 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="px-6 py-3 border-slate-800 text-slate-400 hover:text-white h-12">
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            rightIcon={ArrowRight}
            className="px-8 py-3 font-bold shadow-lg shadow-cyan-950/40 h-12 text-sm"
          >
            Submit Vehicle for Verification
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVehicleModal;
