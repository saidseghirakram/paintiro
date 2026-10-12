"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/** Brand mascot model (the PAINTIRO "P" brush logo as a character). */
export const MASCOT_URL = "/mascot.glb";

/** Body color painted where the texture is dark; the white "P" stays white. */
export const MASCOT_COLOR = "#e8372c";

/** Width of the mascot body (without arms), in scene units. */
export const MASCOT_BODY_WIDTH = 0.72;

/** In the export, the arms are the parts of the mesh beyond this |x| (body is ±1.05). */
const SHOULDER_X = 1.08;
/** Half width of the body in the export. */
const BODY_HALF_X = 1.05;
/** Corner radius of the rebuilt body, relative to its width. */
const BODY_ROUNDING = 0.17;

export type Mascot = {
  /** Root: place it at the seat point; its origin is under the body, between the feet. */
  root: THREE.Group;
  /** Inner group for squash & stretch, flips and leaning (pivot at the body center). */
  body: THREE.Group;
  /** Shoulder pivots: rotation.z > 0 raises the arm (sign is handled per side). */
  armLeft: THREE.Group;
  armRight: THREE.Group;
  /** Height of the body (scene units), to place the pivot. */
  height: number;
  meshes: THREE.Mesh[];
  dispose: () => void;
};

/**
 * Repaints the black & white logo texture: black -> brand color, white stays white,
 * so the mascot looks like the red PAINTIRO logo come to life.
 */
function brandTexture(source: THREE.Texture, color: string): THREE.Texture {
  const image = source.image as HTMLImageElement | ImageBitmap;
  const width = image.width;
  const height = image.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.drawImage(image as CanvasImageSource, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const brand = new THREE.Color(color);
  const [r, g, b] = [brand.r * 255, brand.g * 255, brand.b * 255];
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const t = (data[i] + data[i + 1] + data[i + 2]) / 765;
    data[i] = r + (255 - r) * t;
    data[i + 1] = g + (255 - g) * t;
    data[i + 2] = b + (255 - b) * t;
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = source.flipY;
  texture.wrapS = source.wrapS;
  texture.wrapT = source.wrapT;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Rigs the static mascot export. The arms are cut from the single mesh by triangle
 * and hung on shoulder pivots so they can wave and balance. The exported body is
 * only the top two thirds of the logo block (open, sliced flat at the bottom), so it
 * is rebuilt as the full rounded square of the logo, with the whole "P" on its face.
 */
function rig(scene: THREE.Object3D, color: string): Mascot {
  let source: THREE.Mesh | null = null;
  scene.traverse((child) => {
    if (!source && (child as THREE.Mesh).isMesh) source = child as THREE.Mesh;
  });
  if (!source) throw new Error("mascot: no mesh");
  const mesh = source as THREE.Mesh;

  // Bake the node scale (non-uniform in the export) into a fresh geometry.
  const geometry = mesh.geometry.clone();
  geometry.scale(mesh.scale.x, mesh.scale.y, mesh.scale.z);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex()!;
  const shoulder = SHOULDER_X * mesh.scale.x;
  const halfWidth = BODY_HALF_X * mesh.scale.x;
  const normal = geometry.getAttribute("normal");
  // Arm rods: axis height and radius in the export (rods span y -0.22..0.28, z ±0.25).
  const rodY = 0.03 * mesh.scale.y;
  const rodRadius = 0.3 * mesh.scale.y;

  // Triangles sorted by side: body / left arm / right arm.
  const parts: number[][] = [[], [], []];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    const x = (position.getX(a) + position.getX(b) + position.getX(c)) / 3;
    // The rods continue inside the body: keep that part with the arms so they stay attached.
    const y = (position.getY(a) + position.getY(b) + position.getY(c)) / 3 - rodY;
    const z = (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3;
    const nx = Math.abs(normal.getX(a) + normal.getX(b) + normal.getX(c)) / 3;
    const rod = Math.abs(x) > halfWidth * 0.45 && Math.hypot(y, z) < rodRadius && nx < 0.7;
    const side = x < -shoulder || (rod && x < 0) ? 1 : x > shoulder || rod ? 2 : 0;
    parts[side].push(a, b, c);
  }
  const partGeometry = (indices: number[]) => {
    const part = new THREE.BufferGeometry();
    for (const [name, attribute] of Object.entries(geometry.attributes)) part.setAttribute(name, attribute);
    part.setIndex(indices);
    part.computeBoundingSphere();
    return part;
  };

  const sourceMaterial = mesh.material as THREE.MeshStandardMaterial;
  const map = sourceMaterial.map ? brandTexture(sourceMaterial.map, color) : null;
  // Glossy lacquer, like a fresh coat of paint.
  const lacquer = { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.2 };
  const material = new THREE.MeshPhysicalMaterial({ map, color: map ? 0xffffff : color, ...lacquer });
  const plain = new THREE.MeshPhysicalMaterial({ color, ...lacquer });

  // Full body: a square front like the logo, same top and depth as the export.
  const bodyWidth = halfWidth * 2;
  const bodyDepth = Math.abs(mesh.scale.z) * 2;
  const bodyTop = box.max.y;
  const bodyBottom = bodyTop - bodyWidth;
  const bodyCenterY = (bodyTop + bodyBottom) / 2;

  // Units: the body width becomes MASCOT_BODY_WIDTH.
  const unit = MASCOT_BODY_WIDTH / bodyWidth;
  const bodyHeight = bodyWidth * unit;
  const armY = rodY;

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = bodyHeight / 2; // pivot at the body center, for flips
  root.add(body);
  const scaled = new THREE.Group();
  scaled.scale.setScalar(unit);
  scaled.position.y = -bodyCenterY * unit;
  body.add(scaled);

  const meshes: THREE.Mesh[] = [];
  const make = (indices: number[]) => {
    const part = new THREE.Mesh(partGeometry(indices), material);
    part.castShadow = true;
    meshes.push(part);
    return part;
  };
  const radius = bodyWidth * BODY_ROUNDING;
  const block = new THREE.Mesh(new RoundedBoxGeometry(bodyWidth, bodyWidth, bodyDepth, 8, radius), plain);
  block.position.y = bodyCenterY;
  block.castShadow = true;
  meshes.push(block);
  scaled.add(block);

  // The whole logo on the flat part of the front face.
  let decalMap: THREE.Texture | null = null;
  if (map) {
    decalMap = map.clone();
    decalMap.flipY = true; // plane UVs, not glTF UVs
    decalMap.needsUpdate = true;
    const size = bodyWidth - radius * 1.1;
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshPhysicalMaterial({
        map: decalMap,
        ...lacquer,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    );
    decal.position.set(0, bodyCenterY, bodyDepth / 2 + 0.002);
    meshes.push(decal);
    scaled.add(decal);
  }

  const arm = (indices: number[], side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * shoulder, armY, 0);
    const part = make(indices);
    part.position.set(-side * shoulder, -armY, 0);
    pivot.add(part);
    scaled.add(pivot);
    return pivot;
  };
  const armLeft = arm(parts[1], -1);
  const armRight = arm(parts[2], 1);

  return {
    root,
    body,
    armLeft,
    armRight,
    height: bodyHeight,
    meshes,
    dispose: () => {
      meshes.forEach((m) => {
        m.geometry.dispose();
        if (m.material !== material && m.material !== plain) (m.material as THREE.Material).dispose();
      });
      geometry.dispose();
      material.dispose();
      plain.dispose();
      map?.dispose();
      decalMap?.dispose();
    },
  };
}

/** One download of the model, shared by every rigged copy (loader, hero). */
let gltfPromise: Promise<THREE.Object3D> | null = null;

/** Loads (once) and returns a fresh rigged mascot painted in `color` (white "P" kept). */
export function loadMascot(color: string = MASCOT_COLOR): Promise<Mascot> {
  gltfPromise ??= new GLTFLoader().loadAsync(MASCOT_URL).then((gltf) => gltf.scene);
  gltfPromise.catch(() => {
    gltfPromise = null; // allow a retry
  });
  return gltfPromise.then((scene) => rig(scene, color));
}

/**
 * Loads and rigs the mascot in the background. Returned through a ref so the
 * 3D scene can pick it up whenever it is ready, without being rebuilt.
 */
export function useMascot() {
  const mascotRef = useRef<Mascot | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadMascot()
      .then((mascot) => {
        if (cancelled) {
          mascot.dispose();
          return;
        }
        mascotRef.current = mascot;
      })
      .catch(() => {
        // No mascot: the showcase simply plays without it.
      });
    return () => {
      cancelled = true;
      mascotRef.current?.dispose();
      mascotRef.current = null;
    };
  }, []);
  return mascotRef;
}
