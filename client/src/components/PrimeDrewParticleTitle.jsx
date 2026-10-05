import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { cn } from '../utils/cn';

/**
 * Generate in-memory high-contrast canvas texture with "PrimeDrew" text.
 * Enlarge offscreen canvas to 2400x650 and font to 240px for monumental hero branding.
 */
const createTextCanvas = (text = "PrimeDrew") => {
  const canvas = document.createElement("canvas");
  canvas.width = 3000;
  canvas.height = 700;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { dataUrl: "", canvas: null, ctx: null };

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient spanning across the centered text zone
  const gradient = ctx.createLinearGradient(500, 0, 2500, 0);
  gradient.addColorStop(0, "#38bdf8"); // Sky cyan
  gradient.addColorStop(0.5, "#ffffff"); // Pure white
  gradient.addColorStop(1, "#0ea5e9"); // Vibrant blue

  ctx.fillStyle = gradient;
  ctx.font = "900 280px Inter, Montserrat, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    canvas,
    ctx
  };
};

// Inlined GLSL Simplex 3D Noise by Stefan Gustavson / Ashima Arts
const simplexNoiseGLSL = `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// Vertex Shader with Simplex Noise & Viewport Dispersion Force
const vertexShader = `
${simplexNoiseGLSL}

uniform sampler2D uTexture;
uniform float uTime;
uniform vec3 uMouse;
uniform float uMouseRadius;
uniform float uScatterStrength;
uniform float uProgress;
uniform float uPointSize;

attribute vec3 aRandomPos;
attribute vec3 aOriginalPos;
attribute vec2 aUv;
attribute vec3 aColor;
attribute float aPindex;

varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vUv = aUv;
  vColor = aColor;

  // Intro transition: smoothly morph from dispersed nebula to exact text coordinates
  vec3 displaced = mix(aRandomPos, aOriginalPos, uProgress);

  // Subtle ambient breathing motion using 3D simplex noise
  float idleNoise = snoise(vec3(aOriginalPos.xy * 0.035, uTime * 0.4 + aPindex * 0.015));
  displaced.z += idleNoise * 2.2;
  displaced.x += snoise(vec3(aOriginalPos.xy * 0.02 + vec2(100.0), uTime * 0.3)) * 0.8;
  displaced.y += snoise(vec3(aOriginalPos.xy * 0.02 + vec2(200.0), uTime * 0.3)) * 0.8;

  // Pointer-move touch scattering with smooth falloff
  float dist = distance(displaced.xy, uMouse.xy);
  float maxDist = uMouseRadius;
  float scatterFactor = 0.0;

  if (dist < maxDist && maxDist > 0.0) {
    float normDist = dist / maxDist;
    float t = 1.0 - smoothstep(0.0, 1.0, normDist);
    scatterFactor = t;

    // Curl noise & angular displacement
    float angle = snoise(vec3(displaced.xy * 0.04, uTime * 1.5 + aPindex * 0.03)) * 6.2831853;
    float rndz = snoise(vec3(aOriginalPos.xy * 0.05, aPindex)) * 0.5 + 0.8;

    // Disperse freely across the viewport per physics tuning
    displaced.z += t * 50.0 * rndz;
    displaced.x += cos(angle) * t * 50.0 * rndz;
    displaced.y += sin(angle) * t * 50.0 * rndz;

    // Directional repulsion away from cursor
    vec2 pushDir = normalize(displaced.xy - uMouse.xy + vec2(0.0001, 0.0001));
    displaced.xy += pushDir * t * 25.0;
  }

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Point size multiplier: set size = 2.4 to maintain thick, glowing letter contours
  float size = 2.4;
  float sizeNoise = snoise(vec3(aOriginalPos.xy * 0.06, uTime * 0.6));
  float dynamicSize = uPointSize * size * (1.0 + sizeNoise * 0.2 + scatterFactor * 0.4);
  gl_PointSize = dynamicSize * (150.0 / -mvPosition.z);

  // Smooth dispersion fade: outer boundary particles soften gracefully rather than hard cutting
  float scatterFade = 1.0 - smoothstep(0.7, 1.0, scatterFactor) * 0.2;
  vAlpha = clamp((0.25 + uProgress * 0.75) * scatterFade, 0.0, 1.0);
}
`;

// Fragment Shader with glowing soft circular points
const fragmentShader = `
uniform sampler2D uTexture;
uniform float uTime;
varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) {
    discard;
  }

  // Smooth radial falloff with luminous hot core
  float radial = smoothstep(0.5, 0.03, dist);
  float core = smoothstep(0.18, 0.0, dist) * 0.55;

  // Sample original texture for gradient vibrancy
  vec4 tex = texture2D(uTexture, vUv);
  vec3 finalColor = mix(vColor, tex.rgb, 0.45) + vec3(core);

  gl_FragColor = vec4(finalColor, (radial + core) * vAlpha);
}
`;

/**
 * PrimeDrewParticleTitle Component
 * Interactive GPU particle text with Three.js, GSAP, and GLSL simplex noise
 * Scaled up to 240px typography with maxDimension=550 and camera.position.z=290.
 */
export default function PrimeDrewParticleTitle({
  allowUpload = false,
  text = "PrimeDrew",
  className = ""
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId = null;
    let resizeObserver = null;

    // 1. Scene, Camera, and Transparent WebGL Renderer Setup
    const scene = new THREE.Scene();

    const initialWidth = container.clientWidth || window.innerWidth || 1200;
    const initialHeight = container.clientHeight || 400;
    const aspect = initialWidth / initialHeight;

    // Camera setup positioned at z = 310 to keep entire scaled text in view
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    camera.position.set(0, 0, 310);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0); // Transparent background for dark showroom theme
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const clock = new THREE.Clock();
    const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(-9999, -9999);
    const targetMouse = new THREE.Vector3(-9999, -9999, 0);
    const currentMouse = new THREE.Vector3(-9999, -9999, 0);

    let pointsMesh = null;
    let particleMaterial = null;
    let particleGeometry = null;
    let textureObj = null;

    // Calculate responsive camera position
    const adjustCamera = (w, h) => {
      const currentAspect = w / h;
      camera.aspect = currentAspect;
      camera.updateProjectionMatrix();

      // On mobile viewports ensure width fits, maintaining z=310 on desktop
      const targetWidth = 650;
      const fovRad = (camera.fov * Math.PI) / 180;
      const distW = (targetWidth / 2) / (Math.tan(fovRad / 2) * currentAspect);
      camera.position.z = Math.max(310, distW);
    };

    // 2. Build Particles from In-Memory Canvas Texture
    const initParticles = () => {
      const { dataUrl, canvas: textCanvas, ctx } = createTextCanvas(text);
      if (!ctx || !textCanvas) return;

      const imgData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height);
      const data = imgData.data;

      const positions = [];
      const originalPositions = [];
      const randomPositions = [];
      const colors = [];
      const uvs = [];
      const pindices = [];

      // Scale factor matching maxDimension of 650
      const maxDimension = 650;
      const scale = maxDimension / Math.max(textCanvas.width, textCanvas.height);
      const step = 4; // High density sampling
      let pIndex = 0;

      for (let y = 0; y < textCanvas.height; y += step) {
        for (let x = 0; x < textCanvas.width; x += step) {
          const idx = (y * textCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Filter out black background; retain text pixels
          if (r + g + b > 35) {
            const posX = (x - textCanvas.width / 2) * scale;
            const posY = (textCanvas.height / 2 - y) * scale;
            const posZ = (Math.random() - 0.5) * 2.5;

            positions.push(posX, posY, posZ);
            originalPositions.push(posX, posY, posZ);

            // Explosive initial positions for entrance reveal
            const burstRadius = 220 + Math.random() * 150;
            const burstAngle = Math.random() * Math.PI * 2;
            randomPositions.push(
              Math.cos(burstAngle) * burstRadius + (Math.random() - 0.5) * 60,
              Math.sin(burstAngle) * (burstRadius * 0.45) + (Math.random() - 0.5) * 60,
              (Math.random() - 0.5) * 140
            );

            colors.push(r / 255, g / 255, b / 255);
            uvs.push(x / textCanvas.width, 1.0 - y / textCanvas.height);
            pindices.push(pIndex++);
          }
        }
      }

      particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      particleGeometry.setAttribute('aOriginalPos', new THREE.Float32BufferAttribute(originalPositions, 3));
      particleGeometry.setAttribute('aRandomPos', new THREE.Float32BufferAttribute(randomPositions, 3));
      particleGeometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
      particleGeometry.setAttribute('aUv', new THREE.Float32BufferAttribute(uvs, 2));
      particleGeometry.setAttribute('aPindex', new THREE.Float32BufferAttribute(pindices, 1));

      // 3. Load generated data URL as texture source
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(dataUrl, (loadedTexture) => {
        textureObj = loadedTexture;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;

        particleMaterial = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: loadedTexture },
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector3(-9999, -9999, 0) },
            uMouseRadius: { value: 0.0 },
            uScatterStrength: { value: 0.0 },
            uProgress: { value: 0.0 },
            uPointSize: { value: 3.6 },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

        pointsMesh = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(pointsMesh);

        // GSAP Intro Convergence Animation
        gsap.to(particleMaterial.uniforms.uProgress, {
          value: 1.0,
          duration: 1.6,
          ease: "power3.out",
          delay: 0.1,
        });
      });
    };

    // Ensure fonts are ready before initial particle creation
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(initParticles);
    } else {
      initParticles();
    }

    // 4. Pointer-move Touch Scattering Listeners
    const handlePointerMove = (clientX, clientY) => {
      if (!canvas || !particleMaterial) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseNDC, camera);
      const intersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(planeZ0, intersect)) {
        targetMouse.copy(intersect);

        // Smooth GSAP expansion for scatter reaction
        gsap.to(particleMaterial.uniforms.uMouseRadius, {
          value: 60.0,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(particleMaterial.uniforms.uScatterStrength, {
          value: 65.0,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const handlePointerLeave = () => {
      if (!particleMaterial) return;
      gsap.to(particleMaterial.uniforms.uMouseRadius, {
        value: 0.0,
        duration: 0.75,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          targetMouse.set(-9999, -9999, 0);
          currentMouse.set(-9999, -9999, 0);
        }
      });
      gsap.to(particleMaterial.uniforms.uScatterStrength, {
        value: 0.0,
        duration: 0.75,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onPointerMove = (e) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    // Attach listeners directly to canvas
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", handlePointerLeave, { passive: true });

    // 5. Responsive Resize Handling
    const handleResize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      renderer.setSize(width, height, false);
      adjustCamera(width, height);
    };

    resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    // 6. Animation Render Loop with Inertia
    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const elapsedTime = clock.getElapsedTime();

      if (particleMaterial) {
        particleMaterial.uniforms.uTime.value = elapsedTime;

        // Smooth lerp inertia for pointer interaction
        currentMouse.lerp(targetMouse, 0.14);
        particleMaterial.uniforms.uMouse.value.copy(currentMouse);
      }

      renderer.render(scene, camera);
    };
    render();

    // 7. Cleanup
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();

      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", handlePointerLeave);

      if (particleMaterial) {
        gsap.killTweensOf(particleMaterial.uniforms.uMouseRadius);
        gsap.killTweensOf(particleMaterial.uniforms.uScatterStrength);
        gsap.killTweensOf(particleMaterial.uniforms.uProgress);
        particleMaterial.dispose();
      }

      if (particleGeometry) particleGeometry.dispose();
      if (textureObj) textureObj.dispose();
      if (renderer) renderer.dispose();
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-visible pointer-events-auto", className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-auto touch-none cursor-pointer"
        aria-label="PrimeDrew Interactive Particle Title"
      />
      {/* Upload UI intentionally omitted per allowUpload={false} */}
      {allowUpload && null}
    </div>
  );
}
