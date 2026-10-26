"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Props = {
  variant: "orbital-glass" | "prism-bloom" | "kinetic-rings";
  colors: [string, string, string, string];
  compact?: boolean;
  className?: string;
  stage?: number;
};

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    materials.forEach((material) => material.dispose());
  });
}

export function RemixScene({ variant, colors, compact = false, className = "", stage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef(colors);
  const runtimeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    physical: THREE.MeshPhysicalMaterial;
    ringMaterial: THREE.MeshStandardMaterial;
    hemisphere: THREE.HemisphereLight;
    rim: THREE.PointLight;
  } | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const container = host;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const activeColors = colorsRef.current;
    let renderer: THREE.WebGLRenderer;
    try {
      const contextAttributes: WebGLContextAttributes = {
        alpha: true,
        antialias: window.innerWidth > 700,
        depth: true,
        powerPreference: "high-performance",
      };
      const context = canvas.getContext("webgl2", contextAttributes) ?? canvas.getContext("webgl", contextAttributes);
      const precision = context?.getShaderPrecisionFormat(context.FRAGMENT_SHADER, context.HIGH_FLOAT);
      if (!context || !precision) throw new Error("WebGL precision is unavailable");
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: window.innerWidth > 700 });
    } catch {
      window.setTimeout(() => setFallback(true), 0);
      return;
    }

    const fallbackReset = window.setTimeout(() => setFallback(false), 0);
    renderer.setClearColor(compact ? activeColors[0] : stage === 5 ? "#c8afd4" : "#b9bfdc", 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = compact ? 1.25 : 1.38;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.05 : 1.55));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(compact ? 42 : 36, 1, 0.1, 100);
    camera.position.set(0, 0.1, compact ? 5.4 : 6.2);

    const group = new THREE.Group();
    const baseX = compact ? 0 : stage === 0 ? 0 : stage === 5 ? -2.25 : 2.2;
    const baseY = compact ? 0 : stage === 0 ? 1.45 : 0;
    const baseScale = compact ? 1 : stage === 0 ? 0.86 : 0.94;
    group.position.set(baseX, baseY, 0);
    group.scale.setScalar(baseScale);
    scene.add(group);

    const primary = new THREE.Color(activeColors[1]);
    const secondary = new THREE.Color(activeColors[2]);
    const lightColor = new THREE.Color(activeColors[3]);
    const mobile = window.innerWidth < 700;
    const detail = mobile ? 1 : 2;

    const physical = new THREE.MeshPhysicalMaterial({
      color: primary,
      emissive: secondary,
      emissiveIntensity: 0.16,
      metalness: 0.42,
      roughness: 0.16,
      transmission: 0.2,
      thickness: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.84,
    });
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: lightColor,
      emissive: lightColor,
      emissiveIntensity: 0.68,
      metalness: 0.18,
      roughness: 0.25,
    });

    if (variant === "orbital-glass") {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(compact ? 1.05 : 1.42, detail + 1), physical);
      core.scale.set(1, 1.06, 0.92);
      group.add(core);
      [
        [2.05, 0.035, 0.45, 0.2],
        [1.68, 0.026, -0.85, 0.68],
      ].forEach(([radius, tube, x, y]) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, mobile ? 10 : 18, mobile ? 64 : 120), ringMaterial);
        ring.rotation.set(x, y, 0.22);
        group.add(ring);
      });
    } else if (variant === "prism-bloom") {
      const prism = new THREE.Mesh(new THREE.DodecahedronGeometry(compact ? 1.18 : 1.58, detail), physical);
      prism.scale.set(0.92, 1.18, 0.92);
      group.add(prism);
      const wire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(compact ? 1.62 : 2.08, 1),
        new THREE.MeshBasicMaterial({ color: lightColor, wireframe: true, transparent: true, opacity: 0.22 }),
      );
      wire.rotation.set(0.4, 0.2, 0.4);
      group.add(wire);
    } else {
      const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(compact ? 0.9 : 1.18, compact ? 0.23 : 0.3, mobile ? 80 : 150, mobile ? 10 : 18, 2, 3),
        physical,
      );
      group.add(knot);
      [-0.65, 0, 0.65].forEach((offset, index) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(compact ? 1.3 : 1.72, 0.022, 10, mobile ? 64 : 110),
          ringMaterial,
        );
        ring.position.y = offset;
        ring.rotation.set(Math.PI / 2.7, index * 0.55, index * 0.32);
        group.add(ring);
      });
    }

    const starsGeometry = new THREE.BufferGeometry();
    const count = mobile || compact ? 90 : 180;
    const points = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 2.6 + Math.random() * 3.8;
      const angle = Math.random() * Math.PI * 2;
      points[index * 3] = Math.cos(angle) * radius;
      points[index * 3 + 1] = (Math.random() - 0.5) * 5.6;
      points[index * 3 + 2] = Math.sin(angle) * radius - 1.5;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: lightColor, size: compact ? 0.018 : 0.025, transparent: true, opacity: 0.48 }),
    );
    scene.add(stars);

    const hemisphere = new THREE.HemisphereLight(activeColors[3], activeColors[0], 2.1);
    scene.add(hemisphere);
    const key = new THREE.DirectionalLight(0xffffff, 3.4);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight(activeColors[2], 18, 12, 2);
    rim.position.set(3, -1, 3);
    scene.add(rim);
    runtimeRef.current = { renderer, physical, ringMaterial, hemisphere, rim };

    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    let visible = true;
    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
    };
    const onContextLost = () => setFallback(true);

    function resize() {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);
    resize();

    const startedAt = performance.now();
    const render = (timestamp = performance.now()) => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      const elapsed = (timestamp - startedAt) / 1000;
      if (!prefersReducedMotion) {
        group.rotation.y += (pointerX * 0.55 + elapsed * 0.11 - group.rotation.y) * 0.025;
        group.rotation.x += (-pointerY * 0.28 + Math.sin(elapsed * 0.55) * 0.05 - group.rotation.x) * 0.03;
        group.position.y = baseY + Math.sin(elapsed * 0.72) * (compact ? 0.07 : 0.12);
        stars.rotation.y = elapsed * 0.018;
      }
      renderer.render(scene, camera);
    };
    render();

    return () => {
      window.clearTimeout(fallbackReset);
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      runtimeRef.current = null;
      disposeObject(group);
      starsGeometry.dispose();
      (stars.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [variant, compact, stage]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.physical.color.set(colors[1]);
    runtime.physical.emissive.set(colors[2]);
    runtime.ringMaterial.color.set(colors[3]);
    runtime.ringMaterial.emissive.set(colors[3]);
    runtime.hemisphere.color.set(colors[3]);
    runtime.hemisphere.groundColor.set(colors[0]);
    runtime.rim.color.set(colors[2]);
    if (compact) runtime.renderer.setClearColor(colors[0], 1);
  }, [colors, compact]);

  return (
    <div ref={hostRef} className={`remix-scene ${compact ? "remix-scene--compact" : ""} ${fallback ? "remix-scene--fallback" : ""} ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} />
      {fallback ? <div className="remix-scene-fallback"><span /></div> : null}
    </div>
  );
}
