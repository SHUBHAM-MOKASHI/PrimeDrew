import React, { useRef, useEffect, useState, useCallback } from 'react';

export const DamageCanvasOverlay = ({ imageUrl, detections = [], selectedDetectionIndex, onSelectDetection }) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getDamageColor = (damageType) => {
    const type = (damageType || '').toLowerCase();
    if (type.includes('scratch')) return { stroke: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', badgeBg: '#F59E0B' };
    if (type.includes('dent')) return { stroke: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', badgeBg: '#EF4444' };
    if (type.includes('crack') || type.includes('structural')) return { stroke: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', badgeBg: '#8B5CF6' };
    return { stroke: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', badgeBg: '#EF4444' };
  };

  const renderOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas dimensions to the displayed image dimensions
    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;
    const naturalWidth = img.naturalWidth || displayWidth || 800;
    const naturalHeight = img.naturalHeight || displayHeight || 600;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;

    detections.forEach((det, index) => {
      const bbox = det.boundingBox || det.bbox || { xMin: 50, yMin: 50, xMax: 200, yMax: 200 };
      
      // Determine if coordinates are normalized [0..1] or pixel-based
      const isNormalized = bbox.xMax <= 1 && bbox.yMax <= 1;
      
      let xMin = isNormalized ? bbox.xMin * displayWidth : bbox.xMin * scaleX;
      let yMin = isNormalized ? bbox.yMin * displayHeight : bbox.yMin * scaleY;
      let xMax = isNormalized ? bbox.xMax * displayWidth : bbox.xMax * scaleX;
      let yMax = isNormalized ? bbox.yMax * displayHeight : bbox.yMax * scaleY;

      const width = xMax - xMin;
      const height = yMax - yMin;

      const isSelected = selectedDetectionIndex === index || hoveredIndex === index;
      const colors = getDamageColor(det.damageType);

      // Draw bounding box background rectangle
      ctx.fillStyle = colors.bg;
      ctx.fillRect(xMin, yMin, width, height);

      // Draw bounding box border
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      if (isSelected) {
        ctx.setLineDash([6, 3]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeRect(xMin, yMin, width, height);

      // Draw pill badge for label & confidence
      const labelText = `${det.damageType || 'Damage'} ${Math.round((det.confidence || 0.9) * 100)}%`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const badgePaddingX = 8;
      const badgeHeight = 20;

      const badgeX = Math.max(0, Math.min(xMin, displayWidth - textWidth - badgePaddingX * 2));
      const badgeY = yMin - badgeHeight - 4 > 0 ? yMin - badgeHeight - 4 : yMin + 4;

      // Badge container background
      ctx.fillStyle = colors.badgeBg;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, textWidth + badgePaddingX * 2, badgeHeight, 6);
      ctx.fill();

      // Badge text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, badgeX + badgePaddingX, badgeY + 14);
    });
  }, [detections, imageLoaded, selectedDetectionIndex, hoveredIndex]);

  useEffect(() => {
    renderOverlay();
    window.addEventListener('resize', renderOverlay);
    return () => window.removeEventListener('resize', renderOverlay);
  }, [renderOverlay]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !imageRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const displayWidth = canvasRef.current.width;
    const displayHeight = canvasRef.current.height;
    const img = imageRef.current;
    const naturalWidth = img.naturalWidth || displayWidth;
    const naturalHeight = img.naturalHeight || displayHeight;
    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;

    let clickedIndex = null;

    detections.forEach((det, index) => {
      const bbox = det.boundingBox || det.bbox || { xMin: 0, yMin: 0, xMax: 100, yMax: 100 };
      const isNormalized = bbox.xMax <= 1 && bbox.yMax <= 1;
      let xMin = isNormalized ? bbox.xMin * displayWidth : bbox.xMin * scaleX;
      let yMin = isNormalized ? bbox.yMin * displayHeight : bbox.yMin * scaleY;
      let xMax = isNormalized ? bbox.xMax * displayWidth : bbox.xMax * scaleX;
      let yMax = isNormalized ? bbox.yMax * displayHeight : bbox.yMax * scaleY;

      if (clickX >= xMin && clickX <= xMax && clickY >= yMin && clickY <= yMax) {
        clickedIndex = index;
      }
    });

    if (clickedIndex !== null && onSelectDetection) {
      onSelectDetection(clickedIndex);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Damage Inspection Scanner"
        onLoad={() => setImageLoaded(true)}
        className="w-full h-auto max-h-[500px] object-contain block mx-auto"
      />
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-pointer z-10"
      />
    </div>
  );
};

export default DamageCanvasOverlay;
