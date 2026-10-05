"use client";

import React, { useEffect, useState, useMemo } from "react";
import { cn } from "../utils/cn";

export function PerspectiveGrid({
  className = "",
  gridSize = 35,
  showOverlay = true,
  fadeRadius = 80,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tiles = useMemo(() => Array.from({ length: gridSize * gridSize }), [gridSize]);

  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-transparent",
        "[--fade-stop:#05070d]",
        className
      )}
      style={{
        perspective: "2000px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute w-[90rem] aspect-square grid origin-center"
        style={{
          left: "50%",
          top: "45%",
          transform:
            "translate(-50%, -50%) rotateX(55deg) rotateY(-5deg) rotateZ(15deg) scale(1.6)",
          transformStyle: "preserve-3d",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {mounted &&
          tiles.map((_, i) => (
            <div
              key={i}
              className="tile min-h-[1px] min-w-[1px] border border-cyan-500/10 hover:border-cyan-400/40 bg-transparent transition-colors duration-[1500ms] hover:duration-0"
            />
          ))}
      </div>

      {showOverlay && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle, transparent 20%, #05070d ${fadeRadius}%)`,
          }}
        />
      )}
    </div>
  );
}

export default PerspectiveGrid;
