'use client';

import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Search } from 'lucide-react';
import PrimeDrewParticleTitle from '../PrimeDrewParticleTitle';
import PerspectiveGrid from '../PerspectiveGrid';

/**
 * Clean BMW M4 Model Component
 * Preserves 100% of original factory colors, baked textures, LED lights, carbon fiber, and badges.
 */
function M4Car() {
  const { scene } = useGLTF('/models/bmw_m4.glb');
  const carRef = useRef();

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.envMapIntensity = 1.8;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene]);

  return (
    <primitive
      ref={carRef}
      object={scene}
      scale={1.35}
      position={[0, -0.45, 0]}
      rotation={[0, -Math.PI / 4.2, 0]}
    />
  );
}

/**
 * Circular 3D Showroom Pedestal / Turntable
 */
function ShowroomPedestal() {
  return (
    <group position={[0, -0.48, 0]}>
      {/* Inner Pedestal Top Surface (Reflective Deep Blue / Obsidian Tarmac) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.8, 64]} />
        <meshStandardMaterial
          color="#0b1329"
          roughness={0.25}
          metalness={0.85}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Outer Glowing Cyan/Electric Blue Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[3.82, 3.95, 64]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Secondary Outer Subtle Glow Accent Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[4.1, 4.14, 64]} />
        <meshBasicMaterial color="#1e3a8a" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Centered 3D Car Model Viewer Component
 */
export function CarViewer() {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [0, 1.8, 7.6], fov: 36 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      {/* Studio Lighting Setup */}
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-10, 10, -5]} intensity={1.2} color="#38bdf8" />
      <spotLight position={[0, 14, 0]} intensity={1.8} angle={0.6} penumbra={1} color="#60a5fa" />

      <Environment preset="city" environmentIntensity={0.7} />

      {/* Circular Showroom Platform */}
      <ShowroomPedestal />

      {/* 3D Car Model */}
      <Suspense
        fallback={
          <Html center>
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(56,189,248,0.2)] text-white font-semibold text-xs animate-pulse whitespace-nowrap">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              Illuminating Showroom Stage...
            </div>
          </Html>
        }
      >
        <M4Car />
      </Suspense>

      {/* Soft Ground Contact Shadows */}
      <ContactShadows
        position={[0, -0.47, 0]}
        opacity={0.75}
        scale={12}
        blur={1.8}
        far={4}
        color="#020617"
      />

      {/* Smooth Auto-Rotation & 360 Inspection */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.7}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={Math.PI / 3.6}
      />
    </Canvas>
  );
}

/**
 * Main Hero Experience Component
 * Balanced Vertical Stack: PrimeDrew Particle Branding + 3D Car Viewer + Search Dock
 */
export default function ThreeM4Experience() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full h-[90vh] md:h-[94vh] min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#05070d] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* LAYER 0: 3D Perspective Grid Background (Behind all elements) */}
      <PerspectiveGrid className="z-0 opacity-70" fadeRadius={75} gridSize={32} />

      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

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

      {/* Layer 3 (z-40): Floating Glassmorphic Search Dock */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-auto">
        <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-3 sm:p-4 shadow-2xl shadow-black/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-white">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location</span>
              <input
                type="text"
                defaultValue="Mumbai, MH"
                className="bg-transparent text-xs font-bold text-white focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pickup</span>
              <input
                type="text"
                defaultValue="Today, 04:00 PM"
                className="bg-transparent text-xs font-bold text-white focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dropoff</span>
              <input
                type="text"
                defaultValue="Tomorrow, 08:00 PM"
                className="bg-transparent text-xs font-bold text-white focus:outline-none w-full"
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/vehicles')}
            className="h-full min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.35)] transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4 text-white" />
            <span>Search Fleet</span>
          </button>
        </div>
      </div>
    </section>
  );
}

useGLTF.preload('/models/bmw_m4.glb');
