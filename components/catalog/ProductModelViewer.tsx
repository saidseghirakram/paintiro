"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LABEL_FRONT_YAW, loadProductModel, PRODUCT_HEIGHT } from "@/lib/useProductModels";

type ProductModelViewerProps = {
  /** GLB + photo (for empty exports); null shows the photo only. */
  model: { url: string; photo: string } | null;
  image: string;
  alt: string;
  reducedMotion: boolean;
};

/** Seconds for one full turn. */
const TURN_SECONDS = 14;
const FOV = 26;
/** Share of the canvas height taken by the pack. */
const FILL = 0.66;

/** Soft radial blob used as a contact shadow under the pack. */
function contactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(20,20,20,0.75)");
  gradient.addColorStop(0.5, "rgba(20,20,20,0.25)");
  gradient.addColorStop(1, "rgba(20,20,20,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/**
 * The real 3D pack, standing still in the middle of its circle and turning on itself
 * (one smooth 360° every TURN_SECONDS). The photo shows until the model is ready,
 * and stays when there is no model or no WebGL. Rendering pauses off screen.
 */
export default function ProductModelViewer({ model, image, alt, reducedMotion }: ProductModelViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !model) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL: the photo stays.
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const scene = new THREE.Scene();
    scene.environment = environment;
    scene.environmentIntensity = 0.85;
    const key = new THREE.DirectionalLight(0xfff4e8, 2.2);
    key.position.set(3.5, 6, 4.5);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 1.4);
    rim.position.set(-4, 3.5, -4);
    scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0xb9b6ae, 0.45));

    // Camera framing a PRODUCT_HEIGHT pack, looking slightly down on the lid.
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    const centerY = PRODUCT_HEIGHT * 0.5;
    const distance = (PRODUCT_HEIGHT / FILL / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(0, centerY + distance * 0.16, distance);
    camera.lookAt(0, centerY - 0.02, 0);

    const shadowTexture = contactShadowTexture();
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    scene.add(shadow);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let pivot: THREE.Object3D | null = null;
    let disposeModel: (() => void) | null = null;
    let angle = 0;
    let visible = true;
    let frame = 0;
    let last = performance.now();

    const render = () => {
      if (pivot) pivot.rotation.y = LABEL_FRONT_YAW + angle;
      renderer.render(scene, camera);
    };
    const loop = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      angle = (angle + (dt / TURN_SECONDS) * Math.PI * 2) % (Math.PI * 2);
      render();
      if (visible && !reducedMotion) frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (frame || reducedMotion || !pivot) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    // Pause when the hero is off screen or the tab is hidden.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && document.visibilityState === "visible";
      if (visible) start();
    });
    io.observe(canvas);
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    loadProductModel(model.url, model.photo).then((loaded) => {
      if (!loaded) return;
      if (disposed) {
        loaded.dispose();
        return;
      }
      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      loaded.materials.forEach((material) => {
        if (material.map) {
          material.map.anisotropy = maxAnisotropy;
          material.map.needsUpdate = true;
        }
      });
      pivot = loaded.object;
      disposeModel = loaded.dispose;
      const footprint = loaded.radius * 2.6;
      shadow.scale.set(footprint, footprint, 1);
      scene.add(pivot);
      render();
      setReady(true);
      start();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      io.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (pivot) scene.remove(pivot);
      disposeModel?.();
      shadowTexture.dispose();
      shadow.geometry.dispose();
      (shadow.material as THREE.Material).dispose();
      environment.dispose();
      renderer.dispose();
    };
  }, [model, reducedMotion]);

  // Crossfade photo → 3D once the model has rendered its first frame.
  useEffect(() => {
    if (!ready) return;
    const d = reducedMotion ? 0 : 0.8;
    gsap.to(photoRef.current, { opacity: 0, scale: 0.96, duration: d, ease: "power2.out" });
    gsap.fromTo(canvasRef.current, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: d, ease: "power2.out" });
  }, [ready, reducedMotion]);

  return (
    <div className="relative size-full">
      <div ref={photoRef} className="absolute inset-[12%]">
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1000px) 32vw, 64vw"
          className="object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.22)]"
        />
      </div>
      {model && (
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full opacity-0" />
      )}
    </div>
  );
}
