import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, CheckCircle2, RefreshCw, X, Video } from 'lucide-react';
import Button from '../common/Button';

export const PhotoCaptureDropzone = ({
  angles,
  setAngles,
  activeAngleKey = 'front',
  onSelectAngle,
  onAnalyzeAngle,
  isAnalyzing
}) => {
  const [activeCameraAngle, setActiveCameraAngle] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async (key) => {
    try {
      setActiveCameraAngle(key);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err.message);
      alert('Camera access unavailable. Please use the file upload option.');
      setActiveCameraAngle(null);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setActiveCameraAngle(null);
  };

  const capturePhoto = (key) => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    if (setAngles) {
      setAngles((prev) => ({
        ...prev,
        [key]: { ...prev[key], preview: dataUrl, status: 'uploaded' }
      }));
    }

    stopCamera();
  };

  const handleFileDrop = (key, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    if (setAngles) {
      setAngles((prev) => ({
        ...prev,
        [key]: { ...prev[key], file, preview: url, status: 'uploaded' }
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (key, e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileDrop(key, e.dataTransfer.files[0]);
    }
  };

  const handleTriggerAnalysis = (key) => {
    const angleData = angles[key];
    if (angleData && onAnalyzeAngle) {
      onAnalyzeAngle(key, angleData.file, angleData.preview);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4-Angle Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(angles || {}).map(([key, angle]) => {
          const isSelected = activeAngleKey === key;
          const hasImage = !!angle.preview;

          return (
            <div
              key={key}
              onClick={() => onSelectAngle && onSelectAngle(key)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(key, e)}
              className={`relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between h-64 ${
                isSelected
                  ? 'border-cyan-500/80 bg-slate-900/90 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-2 ring-cyan-500/30'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              {/* Header Label */}
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> {angle.label}
                </span>
                {hasImage && (
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ready
                  </span>
                )}
              </div>

              {/* Upload Dropzone / Thumbnail Preview */}
              <div className="my-2 relative flex-1 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-dashed border-slate-800 bg-slate-950/60">
                {hasImage ? (
                  <div className="relative w-full h-full group">
                    <img src={angle.preview} alt={angle.label} className="w-full h-full object-cover" />

                    {/* Scanning radar pulse overlay if analyzing */}
                    {isAnalyzing && isSelected && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2 z-20">
                        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-2" />
                        <span className="text-[11px] font-bold text-cyan-300 animate-pulse">Running Gemini 3.6 Vision...</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startCamera(key);
                        }}
                        title="Retake with Live Camera"
                        className="p-2 rounded-full bg-slate-900 text-cyan-300 hover:bg-slate-800 border border-slate-700 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                      </button>

                      <label
                        title="Upload New Photo"
                        className="cursor-pointer p-2 rounded-full bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileDrop(key, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startCamera(key);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Live Camera
                      </button>

                      <label className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5" /> Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileDrop(key, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <span className="text-[10px] text-slate-500">Capture with webcam or upload file</span>
                  </div>
                )}
              </div>

              {/* Angle Action Trigger Button */}
              {hasImage && (
                <Button
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  isLoading={isAnalyzing && isSelected}
                  leftIcon={Sparkles}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectAngle) onSelectAngle(key);
                    handleTriggerAnalysis(key);
                  }}
                  className="w-full text-xs font-bold py-1.5 mt-1 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                >
                  Analyze Damage
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Camera Capture Modal */}
      {activeCameraAngle && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" /> Live Capture: {angles[activeCameraAngle]?.label}
              </span>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => videoRef.current?.play()}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={stopCamera}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={Camera}
                onClick={() => capturePhoto(activeCameraAngle)}
                className="font-bold px-6 shadow-lg shadow-cyan-500/20"
              >
                Capture Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoCaptureDropzone;
