import React, { useState } from 'react';
import { Camera, Upload, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

export const PhotoCaptureDropzone = ({ onAnalyzeAngle, isAnalyzing }) => {
  const [angles, setAngles] = useState({
    front: { label: 'Front Bumper', file: null, preview: null, status: 'empty' },
    rear: { label: 'Rear Bumper', file: null, preview: null, status: 'empty' },
    driverSide: { label: 'Driver Side', file: null, preview: null, status: 'empty' },
    passengerSide: { label: 'Passenger Side', file: null, preview: null, status: 'empty' }
  });

  const [activeAngleKey, setActiveAngleKey] = useState('front');

  const handleFileDrop = (key, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setAngles((prev) => ({
      ...prev,
      [key]: { ...prev[key], file, preview: url, status: 'uploaded' }
    }));
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
    if (angleData.file && onAnalyzeAngle) {
      onAnalyzeAngle(key, angleData.file, angleData.preview);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4-Angle Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(angles).map(([key, angle]) => {
          const isSelected = activeAngleKey === key;
          const hasImage = !!angle.preview;

          return (
            <div
              key={key}
              onClick={() => setActiveAngleKey(key)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(key, e)}
              className={`relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between h-60 ${
                isSelected
                  ? 'border-indigo-500/80 bg-zinc-900/80 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/20'
                  : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              {/* Header Label */}
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" /> {angle.label}
                </span>
                {hasImage && (
                  <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ready
                  </span>
                )}
              </div>

              {/* Upload Dropzone / Thumbnail Preview */}
              <div className="my-2 relative flex-1 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-dashed border-zinc-800 bg-zinc-950/60">
                {hasImage ? (
                  <div className="relative w-full h-full group">
                    <img src={angle.preview} alt={angle.label} className="w-full h-full object-cover" />
                    
                    {/* Scanning radar pulse overlay if analyzing */}
                    {isAnalyzing && isSelected && (
                      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                        <div className="w-10 h-10 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mb-2" />
                        <span className="text-[11px] font-bold text-indigo-300 animate-pulse">Running YOLOv8...</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer p-2 rounded-full bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-700 transition-colors">
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
                  <label className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full mb-1.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-zinc-200">Upload Photo</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Drag & drop or capture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileDrop(key, e.target.files[0])}
                      className="hidden"
                    />
                  </label>
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
                    setActiveAngleKey(key);
                    handleTriggerAnalysis(key);
                  }}
                  className="w-full text-xs font-bold py-1.5 mt-1 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                >
                  Analyze Damage
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoCaptureDropzone;

