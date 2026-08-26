'use client';

import React, { useEffect, useMemo, useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const GLTF_MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb';

function RealisticGltfModel({ paintColor, onLoad }) {
  const { scene } = useGLTF(GLTF_MODEL_URL);

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          if (child.material.color) {
            child.material.color.set(paintColor);
          }
        }
      }
    });
    return clone;
  }, [scene, paintColor]);

  useEffect(() => {
    if (clonedScene) {
      onLoad?.();
    }
  }, [clonedScene, onLoad]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} scale={1.8} position={[0, -0.4, 0]} />;
}

function StudioSculptedCar({ paintColor, refs }) {
  const bodyMatRef = useRef();

  useEffect(() => {
    if (bodyMatRef.current) {
      bodyMatRef.current.color.set(paintColor);
    }
  }, [paintColor]);

  const wheelPositions = [
    [-0.86, -0.32, 1.3],
    [0.86, -0.32, 1.3],
    [-0.86, -0.32, -1.3],
    [0.86, -0.32, -1.3],
  ];

  return (
    <group position={[0, -0.15, 0]}>
      {/* Aerodynamic Carbon Underbody */}
      <mesh position={[0, -0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.76, 0.12, 4.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Main Sculpted Monocoque */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.88, 0.52, 4.3]} />
        <meshPhysicalMaterial
          ref={bodyMatRef}
          color={paintColor}
          metalness={0.82}
          roughness={0.18}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          reflectivity={0.9}
        />
      </mesh>

      {/* Panoramic Tinted Glass Canopy */}
      <mesh position={[0, 0.44, -0.1]} castShadow>
        <boxGeometry args={[1.52, 0.42, 2.1]} />
        <meshPhysicalMaterial
          color="#0b1329"
          metalness={0.9}
          roughness={0.05}
          transmission={0.4}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Lightweight Carbon Fiber Roof */}
      <mesh position={[0, 0.66, -0.1]} castShadow>
        <boxGeometry args={[1.46, 0.03, 1.85]} />
        <meshStandardMaterial color="#020617" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Signature Double Kidney Grille */}
      <mesh position={[0, -0.02, 2.16]}>
        <boxGeometry args={[0.74, 0.32, 0.04]} />
        <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Laser Headlights */}
      <mesh position={[-0.62, 0.08, 2.12]}>
        <boxGeometry args={[0.38, 0.12, 0.05]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0.62, 0.08, 2.12]}>
        <boxGeometry args={[0.38, 0.12, 0.05]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Slim LED Taillight Blade */}
      <mesh position={[0, 0.12, -2.16]}>
        <boxGeometry args={[1.6, 0.06, 0.04]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} toneMapped={false} />
      </mesh>

      {/* Wheels & High-Performance Brakes */}
      {wheelPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Tire */}
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.36, 0.28, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Diamond-cut Alloy Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.29, 8]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* M Sport Brake Caliper */}
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.08, 0.14, 0.1]} />
            <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function M4CarModel({ refs, paintColor = '#2563eb', onReady }) {
  const rootRef = useRef();

  useEffect(() => {
    if (refs?.current) {
      refs.current.root = rootRef.current;
      refs.current.body = rootRef.current;
      refs.current.hood = rootRef.current;
      refs.current.engine = rootRef.current;
      refs.current.chassis = rootRef.current;
    }
    onReady?.();
  }, [onReady, refs]);

  return (
    <group ref={rootRef} position={[0, -0.2, 0]}>
      <Suspense fallback={<StudioSculptedCar paintColor={paintColor} refs={refs} />}>
        <RealisticGltfModel paintColor={paintColor} onLoad={onReady} />
      </Suspense>
    </group>
  );
}
