import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * DamageCanvasOverlay
 * Strictly anchors bounding boxes directly over the rendered vehicle image frame,
 * completely eliminating letterbox/pillarbox coordinate drift.
 */
export const DamageCanvasOverlay = ({
  imageUrl,
  detections = [],
  selectedDetectionIndex,
  onSelectDetection
}) => {
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getNormalizedBox = (det) => {
    const rawBox = det.boundingBox || det.bounding_box || det.bbox || det.box || {};
    const xMin = det.x ?? rawBox.x ?? rawBox.xMin ?? rawBox.x_min ?? rawBox.xmin ?? 0;
    const yMin = det.y ?? rawBox.y ?? rawBox.yMin ?? rawBox.y_min ?? rawBox.ymin ?? 0;

    let width = det.width ?? rawBox.width;
    let height = det.height ?? rawBox.height;

    if (width === undefined) {
      const xMax = rawBox.xMax ?? rawBox.x_max ?? rawBox.xmax ?? xMin + 0.15;
      width = Math.max(0.04, xMax - xMin);
    }
    if (height === undefined) {
      const yMax = rawBox.yMax ?? rawBox.y_max ?? rawBox.ymax ?? yMin + 0.08;
      height = Math.max(0.04, yMax - yMin);
    }

    return {
      x: Number(xMin),
      y: Number(yMin),
      width: Number(width),
      height: Number(height),
      label: det.label || det.damageType || 'SCRATCH',
      confidence: Number(det.confidence) || 0.88
    };
  };

  const handleContainerClick = (e) => {
    if (!imageRef.current || detections.length === 0) return;

    const imgRect = imageRef.current.getBoundingClientRect();
    const clickX = (e.clientX - imgRect.left) / imgRect.width;
    const clickY = (e.clientY - imgRect.top) / imgRect.height;

    let matchedIdx = null;

    detections.forEach((det, idx) => {
      const box = getNormalizedBox(det);
      if (
        clickX >= box.x &&
        clickX <= box.x + box.width &&
        clickY >= box.y &&
        clickY <= box.y + box.height
      ) {
        matchedIdx = idx;
      }
    });

    if (matchedIdx !== null && onSelectDetection) {
      onSelectDetection(matchedIdx);
    }
  };

  return (
    <div className="relative w-full flex items-center justify-center bg-slate-950/90 rounded-3xl overflow-hidden border border-slate-800 p-2 sm:p-4 shadow-2xl">
      {/* Tight Wrapper Anchored Exactly to Image Render Bounds (No Pillarbox Drift) */}
      <div
        className="relative max-w-full inline-flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
        onClick={handleContainerClick}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Vehicle Damage Telemetry"
          onLoad={() => setImageLoaded(true)}
          className="max-h-[440px] w-auto max-w-full object-contain rounded-xl select-none block"
        />

        {/* Dynamic Bounding Box Overlay Strictly Pinned over Rendered Image */}
        {imageLoaded && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {detections.map((det, idx) => {
              const box = getNormalizedBox(det);
              const isSelected = selectedDetectionIndex === idx;

              return (
                <div
                  key={idx}
                  className={`absolute border-2 rounded-md transition-all duration-300 pointer-events-none ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/25 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse'
                      : 'border-rose-500 bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.45)]'
                  }`}
                  style={{
                    left: `${Math.max(0, Math.min(96, box.x * 100))}%`,
                    top: `${Math.max(0, Math.min(96, box.y * 100))}%`,
                    width: `${Math.max(4, Math.min(100 - box.x * 100, box.width * 100))}%`,
                    height: `${Math.max(4, Math.min(100 - box.y * 100, box.height * 100))}%`
                  }}
                >
                  <span
                    className={`absolute -top-5 left-0 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-md flex items-center gap-1 ${
                      isSelected ? 'bg-cyan-600 ring-1 ring-cyan-300' : 'bg-rose-600'
                    }`}
                  >
                    {box.label.toUpperCase()} {Math.round(box.confidence * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DamageCanvasOverlay;
