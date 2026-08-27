'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Maximize2,
  X,
  Camera
} from 'lucide-react';

export const VehicleGallery = ({
  images = [],
  title = 'Vehicle',
  isVerified = true,
  className = ''
}) => {
  const galleryImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=1200'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const prevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextImage, prevImage, isFullscreen]);

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* 1. Main Feature Image Stage */}
      <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/80 bg-slate-950 group">
        
        {/* Main High-Res Image */}
        <img
          src={activeImage}
          alt={`${title} - Angle ${activeImageIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
        />

        {/* Ambient Dark Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

        {/* Top-Left Verified Host Listing Badge */}
        {isVerified && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-lg shadow-black/60 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Host Listing
            </span>
          </div>
        )}

        {/* Top-Right Fullscreen Lightbox Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/90 shadow-lg shadow-black opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
          title="Open Fullscreen Gallery"
          aria-label="Expand image"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Floating Next & Prev Arrow Controls (Always visible & enhanced on hover) */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900/95 text-slate-200 hover:text-cyan-400 border border-slate-800 backdrop-blur-md shadow-2xl transition-all cursor-pointer group-hover:scale-110 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900/95 text-slate-200 hover:text-cyan-400 border border-slate-800 backdrop-blur-md shadow-2xl transition-all cursor-pointer group-hover:scale-110 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Bottom-Right Image Counter Badge */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <span className="bg-slate-950/85 backdrop-blur-md text-slate-200 font-mono text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            📸 {activeImageIndex + 1} / {galleryImages.length}
          </span>
        </div>

        {/* Bottom-Left Image Angle Label */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:block">
          <span className="text-xs font-bold text-slate-300 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
            {activeImageIndex === 0 ? 'Front 45° Angle (Hero)' : `Multi-Angle Perspective #${activeImageIndex + 1}`}
          </span>
        </div>
      </div>

      {/* 2. Interactive 6-Photo Thumbnail Rail */}
      {galleryImages.length > 1 && (
        <div className="grid grid-cols-6 gap-2 sm:gap-3 mt-3">
          {galleryImages.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group ${
                activeImageIndex === idx
                  ? 'border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                  : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
              }`}
              aria-label={`Select angle ${idx + 1}`}
            >
              <img
                src={imgUrl}
                alt={`Angle ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {activeImageIndex === idx && (
                <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none" />
              )}
              <span className="absolute bottom-1 right-1 bg-slate-950/80 backdrop-blur-xs text-[9px] font-mono text-slate-300 px-1 rounded">
                #{idx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Close & Counter Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between pb-4">
            <span className="text-sm font-bold text-slate-300 font-mono flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              {title} — 📸 {activeImageIndex + 1} of {galleryImages.length}
            </span>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2.5 rounded-2xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors"
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Fullscreen Stage */}
          <div className="relative w-full max-w-6xl max-h-[75vh] flex items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
            <img
              src={activeImage}
              alt={`${title} fullscreen angle ${activeImageIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-4 p-3 rounded-2xl bg-slate-950/80 text-white hover:text-cyan-400 border border-slate-800 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-4 p-3 rounded-2xl bg-slate-950/80 text-white hover:text-cyan-400 border border-slate-800 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Fullscreen Thumbnails */}
          <div className="flex items-center gap-2 sm:gap-3 mt-4 overflow-x-auto max-w-4xl py-2">
            {galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-20 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-cyan-400 shadow-md shadow-cyan-500/40 scale-105'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleGallery;
