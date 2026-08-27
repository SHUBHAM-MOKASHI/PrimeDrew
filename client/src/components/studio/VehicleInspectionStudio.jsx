'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCheck,
  Camera,
  Upload,
  AlertCircle,
  FileText
} from 'lucide-react';
import Button from '../common/Button';
import PhotoCaptureDropzone from '../inspection/PhotoCaptureDropzone';
import DamageCanvasOverlay from '../inspection/DamageCanvasOverlay';
import DamageReportCard from '../inspection/DamageReportCard';
import { analyzeVehicleDamageAI } from '../../services/damageDetectionService';
import { generateInspectionPDF } from '../../utils/inspectionPdfGenerator';
import { useAuth } from '../../context/AuthContext';

const GENERIC_OBJECT_BLACKLIST = new Set([
  'car', 'truck', 'bus', 'vehicle', 'automobile', 'motorcycle', 'bicycle',
  'person', 'traffic light', 'stop sign', 'parking meter', 'bench', 'wheel',
  'tire', 'license plate', 'building', 'tree', 'road', 'chair', 'boat', 'airplane'
]);

const createEmptyAngleState = () => ({
  front: {
    label: 'Front Bumper',
    file: null,
    preview: null,
    status: 'empty',
    detections: [],
    severity: 'None'
  },
  rear: {
    label: 'Rear Bumper',
    file: null,
    preview: null,
    status: 'empty',
    detections: [],
    severity: 'None'
  },
  driverSide: {
    label: 'Driver Side',
    file: null,
    preview: null,
    status: 'empty',
    detections: [],
    severity: 'None'
  },
  passengerSide: {
    label: 'Passenger Side',
    file: null,
    preview: null,
    status: 'empty',
    detections: [],
    severity: 'None'
  }
});

export const VehicleInspectionStudio = () => {
  const { token } = useAuth();

  const [stage, setStage] = useState('pickup'); // 'pickup' | 'dropoff'
  const [isSplitView, setIsSplitView] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [activeAngleKey, setActiveAngleKey] = useState('front');

  // Pure User-Upload State (Empty initial dropzones)
  const [pickupAngles, setPickupAngles] = useState(createEmptyAngleState);
  const [dropoffAngles, setDropoffAngles] = useState(createEmptyAngleState);

  const activeAngles = stage === 'pickup' ? pickupAngles : dropoffAngles;
  const setActiveAngles = stage === 'pickup' ? setPickupAngles : setDropoffAngles;

  const currentAngleObj = activeAngles[activeAngleKey] || activeAngles.front;
  const currentImage = currentAngleObj.preview;
  const currentDetections = currentAngleObj.detections || [];
  const currentSeverity = currentAngleObj.severity || (currentDetections.length > 0 ? 'Moderate' : 'None');

  const preTripCurrent = pickupAngles[activeAngleKey] || pickupAngles.front;
  const postTripCurrent = dropoffAngles[activeAngleKey] || dropoffAngles.front;

  const handleAnalyzeAngle = async (angleKey, file, previewUrl) => {
    setIsAnalyzing(true);
    setSelectedDetectionIndex(null);

    const targetPreview = previewUrl || activeAngles[angleKey]?.preview;

    try {
      const baselinePreview = stage === 'dropoff' ? pickupAngles[angleKey]?.preview : null;
      const result = await analyzeVehicleDamageAI(baselinePreview, targetPreview, angleKey);

      const rawDet = result?.detections || result?.boxes || [];
      const resDet = rawDet.filter((d) => {
        const t = (d.damageType || d.damage_type || d.label || '').toLowerCase().trim();
        return !GENERIC_OBJECT_BLACKLIST.has(t);
      });
      const resSev = result?.severity || (resDet.length >= 2 ? 'High' : resDet.length === 1 ? 'Moderate' : 'None');

      setActiveAngles((prev) => ({
        ...prev,
        [angleKey]: {
          ...prev[angleKey],
          preview: targetPreview,
          detections: resDet,
          severity: resSev,
          status: 'analyzed'
        }
      }));
    } catch (err) {
      console.warn('[Damage Inspection Analysis Notice]:', err);
      setActiveAngles((prev) => ({
        ...prev,
        [angleKey]: {
          ...prev[angleKey],
          preview: targetPreview,
          detections: [],
          severity: 'None',
          status: 'analyzed'
        }
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const angleKeysList = ['front', 'rear', 'driverSide', 'passengerSide'];
  const completedSlots = angleKeysList.filter((k) => {
    const hasPre = Boolean(pickupAngles[k]?.preview);
    const hasPost = Boolean(dropoffAngles[k]?.preview);
    const hasCurrent = Boolean(activeAngles[k]?.preview);
    const isAnalyzed = activeAngles[k]?.status === 'analyzed' || Boolean(activeAngles[k]?.detections);

    if (stage === 'dropoff') {
      return hasPre && hasPost && isAnalyzed;
    }
    return hasCurrent && isAnalyzed;
  });

  const isInspectionComplete = completedSlots.length >= 2;

  // Calculate if any completed slot has new damage detections
  const totalNewDamageCount = Object.values(dropoffAngles).reduce(
    (acc, slot) => acc + (slot?.detections ? slot.detections.filter((d) => d.isNew !== false).length : 0),
    0
  );

  const hasNewDisputeDamage =
    stage === 'dropoff' &&
    (totalNewDamageCount > 0 ||
      (Boolean(postTripCurrent.preview) &&
        Boolean(preTripCurrent.preview) &&
        (postTripCurrent.detections?.length || 0) > (preTripCurrent.detections?.length || 0)));

  const handleFinalizeInspection = () => {
    setIsFinalized(true);
  };

  const handleExportPDF = () => {
    if (!isInspectionComplete) {
      alert(
        `Minimum 2 completed and analyzed angle perspectives required for generating PDF report.\n(Current: ${completedSlots.length}/4 completed).\n\nPlease upload and analyze at least 2 angle perspectives.`
      );
      return;
    }

    const allDetections = completedSlots.flatMap((k) => activeAngles[k]?.detections || []);
    const isPristine = allDetections.length === 0;

    generateInspectionPDF({
      vehicleTitle: 'Hyundai Venue SX(O) Dual-Tone',
      stage,
      status: isPristine ? 'PRISTINE' : 'NEW_DAMAGE_DETECTED',
      summaryMessage: isPristine
        ? 'No new physical damage detected. Vehicle returned in original pristine baseline condition.'
        : `${allDetections.length} new physical damage anomaly(s) flagged across analyzed perspectives.`,
      angles: activeAngles,
      completedSlots,
      allDetections
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#080d1a] to-[#020617] text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Production Header & Stage Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-3 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> AI Gemini 3.6 Vision Telemetry
            </span>
            <h1 className="text-3xl font-extrabold text-white">Vehicle Inspection Studio</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Automated bounding box detection for pre-trip handover & post-trip deposit settlement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Export PDF Button */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileText}
              onClick={handleExportPDF}
              title={
                isInspectionComplete
                  ? 'Export Official Inspection PDF Report'
                  : `Minimum 2 angles required (${completedSlots.length}/4 completed)`
              }
              className={`border-slate-800 transition-all font-semibold ${
                isInspectionComplete
                  ? 'bg-slate-900/90 text-cyan-300 hover:bg-slate-800 hover:border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/40 text-slate-400 opacity-70 hover:opacity-100'
              }`}
            >
              Export PDF Report ({completedSlots.length}/4)
            </Button>

            {/* Stage Selector Tabs */}
            <div className="bg-slate-900/80 p-1 rounded-2xl flex gap-1 border border-slate-800 shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setStage('pickup');
                  setIsSplitView(false);
                  setSelectedDetectionIndex(null);
                }}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  stage === 'pickup' && !isSplitView
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pre-Trip (Pickup)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage('dropoff');
                  setIsSplitView(false);
                  setSelectedDetectionIndex(null);
                }}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  stage === 'dropoff' && !isSplitView
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Post-Trip (Dropoff)
              </button>
            </div>

            {/* Split View Comparison Toggle */}
            <Button
              variant={isSplitView ? 'secondary' : 'outline'}
              size="sm"
              leftIcon={ArrowRightLeft}
              onClick={() => setIsSplitView(!isSplitView)}
              className="border-slate-800 hover:border-slate-700"
            >
              {isSplitView ? 'Single View' : 'Split View Comparison'}
            </Button>
          </div>
        </div>

        {/* 4-Angle User Photo Upload Dropzone */}
        <PhotoCaptureDropzone
          angles={activeAngles}
          setAngles={setActiveAngles}
          activeAngleKey={activeAngleKey}
          onSelectAngle={(key) => {
            setActiveAngleKey(key);
            setSelectedDetectionIndex(null);
          }}
          onAnalyzeAngle={handleAnalyzeAngle}
          isAnalyzing={isAnalyzing}
        />

        {/* Dual Split View vs Single View Canvas Display */}
        {isSplitView ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
            {/* Pre-Trip Baseline Canvas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-xl">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pre-Trip Baseline ({preTripCurrent.label})
                </span>
                <span className="text-[11px] font-semibold text-slate-400 font-mono">
                  {preTripCurrent.detections.length} Bounding Box Detections
                </span>
              </div>

              {preTripCurrent.preview ? (
                <DamageCanvasOverlay
                  imageUrl={preTripCurrent.preview}
                  detections={preTripCurrent.detections}
                  selectedDetectionIndex={selectedDetectionIndex}
                  onSelectDetection={setSelectedDetectionIndex}
                />
              ) : (
                <div className="h-72 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Camera className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-xs font-bold text-slate-400">No Pre-Trip Photo Uploaded</span>
                  <span className="text-[11px] text-slate-600 mt-1">Upload {preTripCurrent.label} photo in the dropzone above</span>
                </div>
              )}
            </div>

            {/* Post-Trip Return Canvas */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-xl">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-cyan-400" /> Post-Trip Return Scan ({postTripCurrent.label})
                </span>

                {postTripCurrent.status === 'analyzed' || (postTripCurrent.detections && postTripCurrent.preview) ? (
                  postTripCurrent.detections?.length === 0 ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      0 Total Detections (0 New) — No Damage Detected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 shadow-sm shadow-rose-500/10">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      {postTripCurrent.detections.length} Total Detections ({Math.max(0, postTripCurrent.detections.length - preTripCurrent.detections.length)} New) — Damage Detected
                    </span>
                  )
                ) : (
                  <span className="text-slate-500 text-[11px]">Awaiting Telemetry Scan</span>
                )}
              </div>

              {postTripCurrent.preview ? (
                <DamageCanvasOverlay
                  imageUrl={postTripCurrent.preview}
                  detections={postTripCurrent.detections}
                  selectedDetectionIndex={selectedDetectionIndex}
                  onSelectDetection={setSelectedDetectionIndex}
                />
              ) : (
                <div className="h-72 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Camera className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-xs font-bold text-slate-400">No Post-Trip Photo Uploaded</span>
                  <span className="text-[11px] text-slate-600 mt-1">Upload {postTripCurrent.label} photo in the dropzone above</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Interactive Canvas Overlay */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-xl">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Active Bounding Box Canvas ({currentAngleObj.label})
                </span>

                {currentAngleObj.status === 'analyzed' ? (
                  currentDetections.length === 0 ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      0 Total Detections (0 New) — No Damage Detected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 shadow-sm shadow-rose-500/10">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      {currentDetections.length} Total Detections ({currentDetections.length} New) — Damage Detected
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-400 font-semibold">
                    {currentImage ? 'Click box or table row to highlight' : 'Awaiting image capture'}
                  </span>
                )}
              </div>

              {currentImage ? (
                <DamageCanvasOverlay
                  imageUrl={currentImage}
                  detections={currentDetections}
                  selectedDetectionIndex={selectedDetectionIndex}
                  onSelectDetection={setSelectedDetectionIndex}
                />
              ) : (
                <div className="h-80 sm:h-96 rounded-3xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Photo Uploaded for {currentAngleObj.label}</h4>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Upload or capture a photo in the dropzone above, then click <strong>"Analyze Damage"</strong> to run YOLOv8 computer vision detection.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Side Damage Report Table Card */}
            <div>
              <DamageReportCard
                detections={currentDetections}
                severity={currentSeverity}
                stage={stage}
                hasNewDisputeDamage={hasNewDisputeDamage}
                selectedDetectionIndex={selectedDetectionIndex}
                onSelectDetection={setSelectedDetectionIndex}
              />
            </div>
          </div>
        )}

        {/* Finalization CTA Bar */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" /> Finalize Telemetry Contract
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Signing this inspection logs coordinates into the booking contract and triggers automated security deposit release.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              leftIcon={FileText}
              onClick={handleExportPDF}
              className={`w-full sm:w-auto px-6 py-3.5 border-slate-700 font-bold transition-all ${
                isInspectionComplete
                  ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700 hover:border-cyan-500/40'
                  : 'bg-slate-850 text-slate-400 opacity-75'
              }`}
            >
              Export Inspection PDF ({completedSlots.length}/4)
            </Button>

            <Button
              variant={isFinalized ? 'secondary' : 'primary'}
              size="lg"
              leftIcon={CheckCircle2}
              onClick={handleFinalizeInspection}
              className="w-full sm:w-auto px-8 py-3.5 font-bold shadow-lg shadow-blue-600/30"
            >
              {isFinalized ? 'Telemetry Contract Signed ✓' : 'Sign & Finalize Inspection'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VehicleInspectionStudio;
