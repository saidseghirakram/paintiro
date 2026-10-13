"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PRODUCTS } from "./chapters";
import { setSiteState } from "./store";

/** Yaw that turns the front label of the bucket exports towards the camera (+z). */
export const LABEL_FRONT_YAW = -1.88;

/** Height (scene units) of a product with scale 1. */
export const PRODUCT_HEIGHT = 1.6;

/**
 * Horizontal texture coordinate that faces the camera on the bucket mesh:
 * the center of the front label in the GLB textures (the PAINTIRO logo).
 */
const LABEL_FRONT_U = 0.235;

/** Largest label texture width (≈ 1000 px per visible half, enough for 2× screens); bigger GLB textures are downscaled off the main thread. */
const MAX_LABEL_WIDTH = 2048;

/** Lets the browser paint a frame (keeps the loader animation smooth during heavy work). */
export const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Vertical slice of the cut-out photos that holds the label (below the lid). */
const PHOTO_LABEL_TOP = 0.19;
const PHOTO_LABEL_BOTTOM = 1;

export type ProductModel = {
  /** Normalized pivot: centered on x/z, standing on y = 0, PRODUCT_HEIGHT × scale tall. */
  object: THREE.Group;
  /** Materials owned by this instance (cloned), used to fade it in and out. */
  materials: THREE.MeshPhysicalMaterial[];
  /** Footprint radius, for the contact shadow. */
  radius: number;
  /** True when the GLB was empty and the photo was wrapped on the shared bucket. */
  fallback: boolean;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return image.decode().then(() => image);
}

/**
 * The exports carry 5000 px label textures: uploading one to the GPU freezes the
 * page for a moment. They are resized to MAX_LABEL_WIDTH with createImageBitmap,
 * which runs off the main thread.
 */
async function downscaleMaps(root: THREE.Object3D): Promise<void> {
  const maps = new Set<THREE.Texture>();
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const map = (material as THREE.MeshStandardMaterial).map;
      if (map) maps.add(map);
    }
  });
  await Promise.all(
    [...maps].map(async (map) => {
      const image = map.image as ImageBitmap | HTMLImageElement | undefined;
      if (!image || image.width <= MAX_LABEL_WIDTH) return;
      try {
        const resized = await createImageBitmap(image, {
          resizeWidth: MAX_LABEL_WIDTH,
          resizeHeight: Math.round((image.height * MAX_LABEL_WIDTH) / image.width),
          resizeQuality: "high",
        });
        if ("close" in image) image.close();
        map.image = resized;
        map.needsUpdate = true;
      } catch {
        // Keep the original size.
      }
    }),
  );
}

function hasMesh(root: THREE.Object3D): boolean {
  let found = false;
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) found = true;
  });
  return found;
}

/**
 * Builds a label texture for the bucket UVs from a front photo of the product:
 * every texture column is mapped back to the photo through the cylinder
 * projection (x = sin θ), so the label wraps without stretching. The back
 * of the bucket gets a second copy of the front, like a real two-sided label.
 */
async function wrapPhoto(image: HTMLImageElement): Promise<THREE.CanvasTexture> {
  // The photos are ~1000 px wide: 2048 keeps all their detail.
  const width = 2048;
  const height = Math.round(width / 3.47);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.imageSmoothingQuality = "high";

  const sy = image.naturalHeight * PHOTO_LABEL_TOP;
  const sh = image.naturalHeight * (PHOTO_LABEL_BOTTOM - PHOTO_LABEL_TOP);
  const sw = image.naturalWidth;

  // Base: the average label color, so transparent photo corners never show as holes.
  context.drawImage(image, 0, sy, sw, sh, 0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  context.fillStyle = `rgb(${r}, ${g}, ${b})`;
  context.fillRect(0, 0, width, height);

  for (let x = 0; x < width; x++) {
    // Work in slices so the loader keeps animating.
    if (x > 0 && x % 384 === 0) await nextFrame();
    let theta = ((x + 0.5) / width - LABEL_FRONT_U) * Math.PI * 2;
    theta = Math.atan2(Math.sin(theta), Math.cos(theta));
    if (Math.abs(theta) > Math.PI / 2) theta -= Math.sign(theta) * Math.PI;
    // 0.86: skip the shaded, transparent-cornered edges of the photo.
    const sx = Math.min(sw - 1, Math.max(0, (0.5 + 0.43 * Math.sin(theta)) * sw));
    context.drawImage(image, sx, sy, 1, sh, x, 0, 1, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // glTF UV convention
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * The GLB exports are only the label wall (an open tube). This builds the rest
 * of a real paint bucket on top of it: white lid with rims, side ears and a
 * metal handle with a plastic grip, folded down the back of the bucket.
 * Built around a wall of top radius `r` whose top edge is at y = `top`.
 */
function buildBucketTop(r: number, top: number): THREE.Group {
  const group = new THREE.Group();
  const plastic = new THREE.MeshPhysicalMaterial({
    color: 0xf4f4f2,
    roughness: 0.38,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  });
  const plasticShade = new THREE.MeshPhysicalMaterial({ color: 0xe6e6e3, roughness: 0.45, clearcoat: 0.2 });
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.28 });
  const grip = new THREE.MeshPhysicalMaterial({ color: 0xf0f0ee, roughness: 0.4, clearcoat: 0.3 });

  const h = r * 0.2; // lid height
  const add = (mesh: THREE.Mesh) => {
    group.add(mesh);
    return mesh;
  };

  // Lid skirt hugging the top of the wall, then the lid body and its top.
  add(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.035, r * 1.03, h * 0.75, 128, 1, true), plastic)).position.y =
    top - h * 0.25;
  add(new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, h * 0.12, 16, 128), plastic)).position.y = top - h * 0.62;
  add(new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, h * 0.16, 20, 128), plastic)).position.y = top + h * 0.12;
  const deck = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.97, h * 0.18, 128), plasticShade));
  deck.position.y = top + h * 0.05;
  // Raised inner ring and center panel, like the stacking rings of a real lid.
  add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, h * 0.07, 12, 128), plastic)).position.y = top + h * 0.16;
  add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.8, h * 0.12, 128), plastic)).position.y =
    top + h * 0.17;
  group.children.forEach((child) => {
    if ((child as THREE.Mesh).geometry instanceof THREE.TorusGeometry) child.rotation.x = Math.PI / 2;
  });

  // Ears (handle pivots) on both sides, just under the lid.
  const earY = top - h * 1.15;
  for (const side of [-1, 1]) {
    const ear = add(new THREE.Mesh(new THREE.BoxGeometry(r * 0.07, h * 0.75, r * 0.2), plastic));
    ear.position.set(side * r * 1.0, earY, 0);
    const pin = add(new THREE.Mesh(new THREE.CylinderGeometry(h * 0.1, h * 0.1, r * 0.06, 16), metal));
    pin.rotation.z = Math.PI / 2;
    pin.position.set(side * r * 1.05, earY, 0);
  }

  // Wire handle resting down the back, following the (tapered) wall.
  const wire = r * 0.018;
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 25 }, (_, i) => {
      const t = (i / 24) * Math.PI;
      const drop = Math.sin(t) * r * 0.55;
      const radius = r * (1.07 - Math.sin(t) * 0.05);
      return new THREE.Vector3(Math.cos(t) * radius, earY - drop, -Math.sin(t) * radius);
    }),
  );
  add(new THREE.Mesh(new THREE.TubeGeometry(curve, 96, wire, 10), metal));
  // Plastic grip in the middle of the handle.
  const gripCurve = new THREE.CatmullRomCurve3(curve.getPoints(48).slice(17, 32));
  add(new THREE.Mesh(new THREE.TubeGeometry(gripCurve, 32, wire * 3, 16), grip));

  return group;
}

/** Wraps a model in a pivot group: centered, standing on the ground, normalized height. */
function normalize(root: THREE.Object3D, scale: number): { pivot: THREE.Group; radius: number } {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const r = Math.max(size.x, size.z) / 2;
  // Total height includes the lid built on top of the wall.
  const factor = (PRODUCT_HEIGHT * scale) / Math.max(size.y + r * 0.2 * 0.3, 1e-6);

  const inner = new THREE.Group();
  inner.add(root);
  root.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
  const lid = buildBucketTop(r, size.y);
  // Handle and ears sit at the sides / back of the label front.
  lid.rotation.y = -LABEL_FRONT_YAW;
  inner.add(lid);
  inner.scale.setScalar(factor);

  const pivot = new THREE.Group();
  pivot.add(inner);
  return { pivot, radius: (Math.max(size.x, size.z) / 2) * factor };
}

/** Clones every material of a model so each product can fade on its own. */
function ownMaterials(root: THREE.Object3D): THREE.MeshPhysicalMaterial[] {
  const materials: THREE.MeshPhysicalMaterial[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const cloned = source.map((material) => {
      const copy = material.clone() as THREE.MeshPhysicalMaterial;
      // The buckets are closed: front faces only avoid the inner walls z-fighting when faded.
      copy.side = THREE.FrontSide;
      materials.push(copy);
      return copy;
    });
    mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
  });
  return materials;
}

/* ------------------------------------------------------------------ */
/* Single product (catalogue pages)                                    */
/* ------------------------------------------------------------------ */

/** GLB with real geometry whose bucket mesh carries photo labels for the empty exports. */
const TEMPLATE_MODEL = "/3d-products/PLAFONYA.glb";
const sceneCache = new Map<string, Promise<THREE.Object3D | null>>();

/** Loads a GLB once per page life; resolves to null when the file is missing or empty. */
function loadScene(url: string): Promise<THREE.Object3D | null> {
  let pending = sceneCache.get(url);
  if (!pending) {
    pending = new GLTFLoader()
      .loadAsync(url)
      .then(async (gltf) => {
        if (!hasMesh(gltf.scene)) return null;
        await downscaleMaps(gltf.scene);
        return gltf.scene;
      })
      .catch(() => null);
    sceneCache.set(url, pending);
  }
  return pending;
}

export type LoadedProductModel = ProductModel & { dispose: () => void };

/**
 * One product, normalized like the homepage ones (standing on y = 0, PRODUCT_HEIGHT tall,
 * label facing +z at LABEL_FRONT_YAW). Same photo fallback when the GLB is empty.
 */
export async function loadProductModel(model: string, photo: string, scale = 1): Promise<LoadedProductModel | null> {
  let root: THREE.Object3D | null = null;
  let label: THREE.Texture | null = null;
  const scene = await loadScene(model);
  if (scene) {
    root = scene.clone(true);
  } else {
    const template = await loadScene(TEMPLATE_MODEL);
    let bucket: THREE.Mesh | null = null;
    template?.traverse((child) => {
      if (!bucket && (child as THREE.Mesh).isMesh) bucket = child as THREE.Mesh;
    });
    if (!bucket) return null;
    try {
      label = await wrapPhoto(await loadImage(photo));
    } catch {
      return null;
    }
    const source = bucket as THREE.Mesh;
    const material = (source.material as THREE.MeshPhysicalMaterial).clone();
    material.map = label;
    const mesh = new THREE.Mesh(source.geometry, material);
    mesh.position.copy(source.position);
    mesh.quaternion.copy(source.quaternion);
    mesh.scale.copy(source.scale);
    root = new THREE.Group();
    root.add(mesh);
  }
  const { pivot, radius } = normalize(root, scale);
  const materials = ownMaterials(pivot);
  return {
    object: pivot,
    materials,
    radius,
    fallback: Boolean(label),
    dispose: () => {
      materials.forEach((m) => m.dispose());
      label?.dispose();
    },
  };
}

/**
 * Loads the 3D product of every chapter (each GLB once), reports progress to
 * the shared store for the Loader, and returns one ready-to-place model per
 * product (null when nothing could be loaded). A GLB without geometry falls back to the shared bucket mesh with
 * the product photo wrapped as its label.
 */
export function useProductModels() {
  const [models, setModels] = useState<(ProductModel | null)[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const created: (ProductModel | null)[] = [];
    const textures: THREE.Texture[] = [];
    setSiteState({ loadProgress: 0 });

    const urls = [...new Set(PRODUCTS.map((p) => p.model))];
    const photos = [...new Set(PRODUCTS.map((p) => p.photo))];
    const progress = new Map<string, number>();
    const report = () => {
      if (cancelled) return;
      let sum = 0;
      progress.forEach((value) => (sum += value));
      setSiteState({ loadProgress: Math.min(0.9, (sum / (urls.length + 1)) * 0.9) });
    };

    const loader = new GLTFLoader();
    const run = async () => {
      const scenes = new Map<string, THREE.Object3D>();
      await Promise.all(
        urls.map(async (url) => {
          try {
            const gltf = await loader.loadAsync(url, (event) => {
              if (event.lengthComputable) progress.set(url, event.loaded / event.total);
              report();
            });
            if (hasMesh(gltf.scene)) {
              await downscaleMaps(gltf.scene);
              scenes.set(url, gltf.scene);
            }
          } catch {
            // Missing / broken file: handled by the photo fallback below.
          }
          progress.set(url, 1);
          report();
        }),
      );
      if (cancelled) return;

      // Fallback ingredients, only fetched when a GLB turned out empty.
      const template = [...scenes.values()][0];
      let bucket: THREE.Mesh | null = null;
      template?.traverse((child) => {
        if (!bucket && (child as THREE.Mesh).isMesh) bucket = child as THREE.Mesh;
      });
      const needed = photos.filter((photo) =>
        PRODUCTS.some((p) => p.photo === photo && !scenes.has(p.model)),
      );
      const labels = new Map<string, THREE.Texture>();
      await Promise.all(
        needed.map(async (photo) => {
          try {
            const texture = await wrapPhoto(await loadImage(photo));
            textures.push(texture);
            labels.set(photo, texture);
          } catch {
            // No photo either: that product is skipped.
          }
        }),
      );
      progress.set("photos", 1);
      report();
      if (cancelled) {
        textures.forEach((t) => t.dispose());
        return;
      }

      for (const product of PRODUCTS) {
        const scene = scenes.get(product.model);
        let root: THREE.Object3D | null = null;
        let fallback = false;
        if (scene) {
          root = scene.clone(true);
        } else if (bucket && template && labels.has(product.photo)) {
          // Same mesh, same node transform as the real exports, new label.
          const source = bucket as THREE.Mesh;
          const material = (source.material as THREE.MeshPhysicalMaterial).clone();
          material.map = labels.get(product.photo)!;
          const mesh = new THREE.Mesh(source.geometry, material);
          mesh.position.copy(source.position);
          mesh.quaternion.copy(source.quaternion);
          mesh.scale.copy(source.scale);
          root = new THREE.Group();
          root.add(mesh);
          fallback = true;
        }
        if (!root) {
          created.push(null);
          continue;
        }
        const { pivot, radius } = normalize(root, product.scale);
        const materials = ownMaterials(pivot);
        pivot.name = product.name;
        created.push({ object: pivot, materials, radius, fallback });
      }

      setModels(created);
      // The last 10% is the 3D scene warming up (reported by the showcase).
      setSiteState({ loadProgress: 0.9 });
    };

    void run();

    return () => {
      cancelled = true;
      created.forEach((model) => model?.materials.forEach((m) => m.dispose()));
      textures.forEach((t) => t.dispose());
    };
  }, []);

  return models;
}
