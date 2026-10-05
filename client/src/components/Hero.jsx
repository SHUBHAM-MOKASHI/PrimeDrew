import React from 'react';
import ThreeM4Experience, { CarViewer } from './home/ThreeM4Experience';
import PrimeDrewParticleTitle from './PrimeDrewParticleTitle';
import PerspectiveGrid from './PerspectiveGrid';

export { PrimeDrewParticleTitle, CarViewer, PerspectiveGrid };

export const Hero = () => (
  <section className="relative w-full h-[90vh] md:h-[94vh] min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#05070d]">
    {/* LAYER 0: 3D Perspective Grid Background (Behind all elements) */}
    <PerspectiveGrid className="z-0 opacity-70" fadeRadius={75} gridSize={32} />

    {/* Layer 1 (z-10): 3D Car Viewer - Pulled up to vertical center */}
    <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10 pointer-events-auto pt-8 md:pt-12">
      <div className="w-full max-w-6xl h-[480px] md:h-[580px] flex items-center justify-center">
        {/* Existing 3D Car Model / Viewer */}
        <CarViewer />
      </div>
    </div>

    {/* PrimeDrew Particle Title - Positioned in the upper headroom */}
    <div className="absolute top-[2%] md:top-[4%] left-0 right-0 w-full flex items-center justify-center z-30 pointer-events-none">
      <div className="w-full max-w-6xl h-[240px] md:h-[280px] pointer-events-auto">
        <PrimeDrewParticleTitle />
      </div>
    </div>
  </section>
);

export default ThreeM4Experience;

