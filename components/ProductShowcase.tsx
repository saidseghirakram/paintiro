"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type MouseEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  CTA_START,
  FINALE_START,
  INTRO_END,
  mapFocus,
  mapProgress,
  NEUTRAL_TINT,
  PRODUCT_SNAPS,
  PRODUCTS,
  SNAP_RANGE,
} from "@/lib/chapters";
import { MAX_DPR_3D, MAX_DPR_3D_MOBILE, SCROLL_LENGTH, SCRUB } from "@/lib/config";
import type { Content, ProductCopy } from "@/lib/content";
import { getSiteState, scrollToTarget, setSiteState, useSiteState } from "@/lib/store";
import { type Mascot, useMascot } from "@/lib/mascot";
import { LABEL_FRONT_YAW, nextFrame, PRODUCT_HEIGHT, useProductModels } from "@/lib/useProductModels";
import { useReducedMotion } from "@/lib/useReducedMotion";
import HeroText, { type HeroTextHandle } from "./HeroText";
import ProductIndicator, { type ProductIndicatorHandle } from "./ProductIndicator";
import ProductStory, { type ProductStoryHandle } from "./ProductStory";
import ScrollHint, { type ScrollHintHandle } from "./ScrollHint";

gsap.registerPlugin(ScrollTrigger);

/** Pause (ms) after the last scroll event before gliding to a product. */
const SNAP_DELAY = 140;
/** Duration (s) of the glide onto a product. */
const SNAP_DURATION = 1.1;

const FRONT_YAW = LABEL_FRONT_YAW;
/** Camera field of view (degrees). */
const FOV = 26;

type ProductShowcaseProps = {
  hero: Content["hero"];
  /** Product texts, same order as PRODUCTS in lib/chapters.ts. */
  products: ProductCopy[];
  /** Section height in svh units (default SCROLL_LENGTH from lib/config.ts). */
  scrollLength?: number;
  /** ScrollTrigger scrub smoothing in seconds. */
  scrub?: number;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** ?debug=1 in the URL shows the spin position and FPS. */
const noopSubscribe = () => () => {};
function useDebugFlag(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("debug") === "1",
    () => false,
  );
}

/** Soft radial blob used as a contact shadow under each product. */
function contactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(20,20,20,0.85)");
  gradient.addColorStop(0.45, "rgba(20,20,20,0.35)");
  gradient.addColorStop(1, "rgba(20,20,20,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

type Pose = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  /** Absolute product scale (1 = 18 kg bucket). */
  scale: number;
  visible: number;
};

/**
 * Hero (Klimt Wine style): a tall section with a sticky full-screen WebGL canvas.
 * One product at a time stands in the center; scrolling spins it a full turn and
 * it becomes the next product while it faces away, as the background tint and the
 * editorial texts change around it. The intro product floats tilted next to the
 * title; the finale gathers every product into a lineup.
 */
export default function ProductShowcase({
  hero,
  products,
  scrollLength = SCROLL_LENGTH,
  scrub = SCRUB,
}: ProductShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HeroTextHandle>(null);
  const hintRef = useRef<ScrollHintHandle>(null);
  const indicatorRef = useRef<ProductIndicatorHandle>(null);
  const storyRef = useRef<ProductStoryHandle>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  const models = useProductModels();
  const mascotRef = useMascot();
  const reducedMotion = useReducedMotion();
  const debug = useDebugFlag();
  const lenis = useSiteState((s) => s.lenis);

  /**
   * WebGL context and lighting environment, created once at mount: both are long
   * blocking calls, done here before the loader mascot starts moving instead of
   * in the middle of its animation.
   */
  const glRef = useRef<{ renderer: THREE.WebGLRenderer; environment: THREE.Texture } | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // No WebGL: never keep the visitor on the loader.
      setSiteState({ loadProgress: 1 });
      return;
    }
    // Physically based, ACES tone mapping, soft shadows, transparent so the tint shows.
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    glRef.current = { renderer, environment };
    return () => {
      glRef.current = null;
      environment.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const gl = glRef.current;
    if (!models || !section || !stage || !gl) return;
    const { renderer, environment } = gl;

    const scene = new THREE.Scene();
    scene.environment = environment;
    scene.environmentIntensity = 0.85;

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    // Studio lights: warm key with soft shadow, cool rim from behind, gentle fill.
    const key = new THREE.DirectionalLight(0xfff4e8, 2.4);
    key.position.set(3.5, 6, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -7;
    key.shadow.camera.right = 7;
    key.shadow.camera.top = 7;
    key.shadow.camera.bottom = -7;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 1.6);
    rim.position.set(-4, 3.5, -4);
    scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b6ae, 0.45));

    // Shadow catcher floor: invisible, only shows the shadows.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ color: 0x141414, opacity: 0.14 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Products and their contact shadows.
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const blobTexture = contactShadowTexture();
    const items = models.map((model, i) => {
      if (!model) return null;
      model.materials.forEach((material) => {
        if (material.map) {
          material.map.anisotropy = maxAnisotropy;
          material.map.needsUpdate = true;
        }
      });
      const blob = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false }),
      );
      blob.rotation.x = -Math.PI / 2;
      blob.position.y = 0.003;
      blob.renderOrder = -1;
      scene.add(model.object, blob);
      // The model is normalized to its own product scale; poses use absolute scales.
      return { model, blob, opaque: true, baseScale: PRODUCTS[i].scale, radius: model.radius / PRODUCTS[i].scale };
    });

    const tints = PRODUCTS.map((p) => new THREE.Color(p.tint));
    const neutral = new THREE.Color(NEUTRAL_TINT);
    const tint = new THREE.Color();
    const tintNext = new THREE.Color();

    const state = {
      /** Story progress (0..1), from the scroll. */
      progress: reducedMotion ? 1 : 0,
      /** Raw hero scroll progress (0..1). */
      scroll: reducedMotion ? 1 : 0,
      /** Smoothed pointer (-1..1) for the parallax. */
      pointer: { x: 0, y: 0, tx: 0, ty: 0 },
      width: 0,
      height: 0,
      portrait: false,
      wide: false,
      visible: true,
      ctaVisible: false,
      background: "",
      fps: 60,
      lastTick: 0,
      lastDebug: 0,
      time: 0,
    };

    /** Camera distance so that a box of (w × h) scene units fills the given screen fractions. */
    const fitDistance = (w: number, h: number, fracW: number, fracH: number) => {
      const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const aspect = state.width / Math.max(1, state.height);
      return Math.max(h / fracH / 2 / tan, w / fracW / 2 / (tan * aspect));
    };

    // Lineup x positions, spaced by each product's real footprint.
    const lineX: number[] = [];
    {
      const widths = PRODUCTS.map((p, i) => (items[i]?.radius ?? 1) * 2 * p.scale + 0.3 * p.scale);
      const total = widths.reduce((a, b) => a + b, 0);
      let x = -total / 2;
      widths.forEach((w) => {
        lineX.push(x + w / 2);
        x += w;
      });
    }
    const lineWidth = lineX.length ? lineX[lineX.length - 1] - lineX[0] + 2.2 : 12;

    /** Final lineup pose of product i (row on landscape, rows of 3 on portrait). */
    const linePose = (i: number, t: number): Pose => {
      const n = PRODUCTS.length;
      const float = reducedMotion ? 0 : Math.sin(t * 0.9 + i * 0.8) * 0.02;
      const scale = PRODUCTS[i].scale;
      if (state.portrait) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        // Center a shorter last row.
        const inRow = Math.min(3, n - row * 3);
        const c = col - (inRow - 1) / 2;
        return { x: c * 2.45, y: float, z: row ? 1.1 : -2.1, yaw: FRONT_YAW - c * 0.28, pitch: 0, roll: 0, scale, visible: 1 };
      }
      const c = i - (n - 1) / 2;
      return { x: lineX[i], y: float, z: -Math.abs(c) * 0.35, yaw: FRONT_YAW - c * 0.16, pitch: 0, roll: 0, scale, visible: 1 };
    };

    const applyPose = (index: number, pose: Pose) => {
      const item = items[index];
      if (!item) return;
      const { object, materials } = item.model;
      const shown = pose.visible > 0.005;
      object.visible = shown;
      item.blob.visible = shown;
      if (!shown) return;

      object.position.set(pose.x, pose.y, pose.z);
      object.rotation.set(pose.pitch, pose.yaw, pose.roll, "YXZ");
      object.scale.setScalar(pose.scale / item.baseScale);

      const opaque = pose.visible > 0.995;
      if (opaque !== item.opaque) {
        item.opaque = opaque;
        materials.forEach((m) => {
          m.transparent = !opaque;
          m.depthWrite = opaque || pose.visible > 0.5;
          m.needsUpdate = true;
        });
      }
      materials.forEach((m) => (m.opacity = pose.visible));

      // Contact shadow: tighter and darker on the floor, fades as the product lifts.
      const lift = clamp01(pose.y / 0.5);
      const size = item.radius * 2 * pose.scale * (1.55 + lift * 0.6);
      item.blob.position.set(pose.x, 0.003, pose.z);
      item.blob.scale.set(size, size, 1);
      (item.blob.material as THREE.MeshBasicMaterial).opacity = 0.55 * pose.visible * (1 - lift * 0.75);
    };

    const pose: Pose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: 1, visible: 0 };
    const hidden: Pose = { ...pose };
    const target = new THREE.Vector3();
    const n = PRODUCTS.length;

    // ---- Mascot: the PAINTIRO "P" riding the products --------------------------
    /** Product the mascot jumps onto for the final lineup (the middle one). */
    const FINALE_SEAT = Math.floor(n / 2);
    const m = {
      rig: null as Mascot | null,
      /** Time the mascot pops in (after the loader has left). */
      bornAt: -1,
      /** Squash spring (positive = flattened). */
      squash: 0,
      squashVelocity: 0,
      airborne: false,
      /** Click trick (backflip) start time, -1 when idle. */
      trickAt: -1,
      hover: false,
      wave: 0,
      lastTime: 0,
      seat: new THREE.Vector3(),
      seatB: new THREE.Vector3(),
      up: new THREE.Vector3(),
      upB: new THREE.Vector3(),
      lean: new THREE.Quaternion(),
      look: new THREE.Quaternion(),
      euler: new THREE.Euler(),
    };
    const worldUp = new THREE.Vector3(0, 1, 0);
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    /** Top center of a product's lid (world) and the lid's up direction. */
    const seatOf = (index: number, position: THREE.Vector3, up: THREE.Vector3) => {
      const item = items[index];
      if (!item) return position.set(0, PRODUCT_HEIGHT, 0);
      const object = item.model.object;
      object.updateMatrixWorld();
      // Standing right on the lid (the full body is tall enough to clear the rim).
      position.set(0, PRODUCT_HEIGHT * item.baseScale * 0.985 + 0.015, 0);
      object.localToWorld(position);
      up.set(0, 1, 0).transformDirection(object.matrixWorld);
      return position;
    };

    /** Elastic pop for the entrance. */
    const elasticOut = (t: number) =>
      t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;

    const animateMascot = (time: number, current: number, spin: number, air: number, finale: number, motion: number) => {
      const rig = m.rig;
      if (!rig) return;
      const dt = Math.min(0.05, Math.max(0, time - m.lastTime));
      m.lastTime = time;

      // Entrance: pops out of the lid once the loader has left.
      if (m.bornAt < 0 && getSiteState().introDone) m.bornAt = time + (reducedMotion ? 0 : 0.6);
      const appear = m.bornAt < 0 ? 0 : reducedMotion ? 1 : elasticOut(clamp01((time - m.bornAt) / 1.2));
      rig.root.visible = appear > 0.001;
      if (!rig.root.visible) return;

      // Seat: the lid of the product on show; in the finale it leaps onto the middle product.
      seatOf(current, m.seat, m.up);
      let hop = 0;
      let flip = 0;
      if (finale > 0) {
        const k = easeInOut(smoothstep(0.2, 0.75, finale));
        seatOf(FINALE_SEAT, m.seatB, m.upB);
        m.seat.lerp(m.seatB, k);
        m.up.lerp(m.upB, k).normalize();
        hop = Math.sin(k * Math.PI) * 1.1;
        flip = -Math.PI * 2 * smoothstep(0.15, 0.85, k);
      } else {
        // Each spin: it hops off the lid and front-flips while the bucket turns under it.
        hop = Math.sin(spin * Math.PI) * 0.42;
        flip = -Math.PI * 2 * smoothstep(0.18, 0.82, spin);
      }
      hop *= motion;
      flip *= motion;

      // Click trick: a backflip on the spot.
      if (m.trickAt >= 0) {
        const t = clamp01((time - m.trickAt) / 0.95);
        hop += Math.sin(t * Math.PI) * 0.55;
        flip += Math.PI * 2 * easeInOut(t);
        if (t >= 1) m.trickAt = -1;
      }

      // Squash & stretch: kicked on take-off and landing, settles with a spring.
      const up = hop > 0.015;
      if (up !== m.airborne) {
        m.squashVelocity += up ? -2.2 : 4.2;
        m.airborne = up;
      }
      const acceleration = -170 * m.squash - 11 * m.squashVelocity;
      m.squashVelocity += acceleration * dt;
      m.squash = Math.max(-0.35, Math.min(0.45, m.squash + m.squashVelocity * dt));
      const breathe = Math.sin(time * 2.4) * 0.015 * motion;

      // Leans with the lid (a bit less, it keeps its balance), looks at the cursor.
      m.lean.setFromUnitVectors(worldUp, m.up).slerp(new THREE.Quaternion(), 0.35);
      m.euler.set(state.pointer.y * 0.18 * motion, state.pointer.x * 0.5 * motion, 0, "YXZ");
      m.look.setFromEuler(m.euler);
      rig.root.quaternion.copy(m.lean).multiply(m.look);
      rig.root.position.copy(m.seat).addScaledVector(m.up, hop);
      rig.root.scale.setScalar(appear);
      rig.body.rotation.set(flip, 0, Math.sin(time * 2.3) * 0.05 * motion * (1 - Math.min(1, hop * 3)));
      rig.body.scale.set(1 + m.squash * 0.6, 1 - m.squash + breathe, 1 + m.squash * 0.6);
      rig.body.position.y = (rig.height / 2) * (1 - m.squash);

      // Arms: tightrope balance, up while airborne, a wave when greeted or hovered.
      const tilt = m.up.x * 2.2;
      const seesaw = Math.sin(time * 2.3) * 0.16 * motion;
      const lift = Math.min(1, hop / 0.42) * 1.05;
      let left = 0.1 + seesaw - tilt + lift;
      let right = 0.1 - seesaw + tilt + lift;
      const greet = (air > 0.35 || m.hover) && hop < 0.02 ? 1 : 0;
      m.wave += (greet - m.wave) * Math.min(1, dt * 6);
      right = lerp(right, 1.25 + Math.sin(time * 11) * 0.38 * motion, m.wave);
      // Finale: waves with one arm and points the other down at the CTA.
      const point = smoothstep(0.85, 1, finale);
      left = lerp(left, 1.2 + Math.sin(time * 9) * 0.32 * motion, point);
      right = lerp(right, -0.6, point);
      rig.armLeft.rotation.z = -left;
      rig.armRight.rotation.z = right;
    };

    const render = (time: number, force = false) => {
      if (!state.visible || !ready) return;
      // Hidden under the loader: don't spend frames the loader animation needs.
      if (!force && !reducedMotion) {
        const site = getSiteState();
        if (!site.revealing && !site.introDone) return;
      }
      // The mascot joins as soon as it is loaded (it never blocks the products).
      if (!m.rig && mascotRef.current) {
        m.rig = mascotRef.current;
        scene.add(m.rig.root);
      }
      state.time = time;
      const p = state.progress;
      const motion = reducedMotion ? 0 : 1;

      // Spin position: whole = product facing the camera, .5 = facing away (the swap).
      const raw = mapFocus(Math.min(p, FINALE_START));
      const whole = Math.min(n - 1, Math.floor(raw));
      const spin = easeInOut(raw - whole);
      const current = spin < 0.5 ? whole : Math.min(n - 1, whole + 1);
      const spinning = Math.sin(spin * Math.PI);

      // Intro: tilted, floating next to the title, then upright in the center.
      const intro = easeInOut(smoothstep(0, INTRO_END, state.scroll));
      const air = 1 - intro;
      // Lineup completes a little before the end, so the CTA arrives on a settled shot.
      const finale = clamp01((p - FINALE_START) / (0.93 - FINALE_START));

      // Center pose of the product on show.
      const scaleA = PRODUCTS[whole].scale;
      const scaleB = PRODUCTS[Math.min(n - 1, whole + 1)].scale;
      const idle = motion * (1 - spinning);
      const center: Pose = {
        x: (state.portrait ? 0 : 1.55) * air,
        y: 0.32 * air + spinning * 0.14 + Math.sin(time * 1.05) * 0.03 * motion,
        z: 0,
        yaw:
          FRONT_YAW +
          spin * Math.PI * 2 -
          0.75 * air +
          Math.sin(time * 0.5) * 0.09 * idle +
          state.pointer.x * 0.12 * motion,
        pitch: 0.22 * air + state.pointer.y * 0.04 * motion,
        roll: -0.42 * air + Math.sin(spin * Math.PI * 2) * 0.05,
        scale: lerp(scaleA, scaleB, smoothstep(0.3, 0.7, spin)) * lerp(1, 0.9, air) * (1 - spinning * 0.04),
        visible: 1,
      };

      for (let i = 0; i < n; i++) {
        if (finale <= 0) {
          applyPose(i, i === current ? center : hidden);
          continue;
        }
        // Staggered arrival into the lineup; hidden products rise from behind with a spin.
        const k = easeOut(clamp01(finale * 1.5 - i * 0.07));
        const line = linePose(i, time);
        const from: Pose =
          i === current
            ? center
            : { ...line, y: -0.2, z: line.z - 2.2, yaw: line.yaw + Math.PI, visible: 0, scale: line.scale * 0.7 };
        pose.x = lerp(from.x, line.x, k);
        pose.y = lerp(from.y, line.y, k) + Math.sin(k * Math.PI) * 0.35;
        pose.z = lerp(from.z, line.z, k);
        pose.yaw = lerp(from.yaw, line.yaw, k);
        pose.pitch = lerp(from.pitch, 0, k);
        pose.roll = lerp(from.roll, 0, k);
        pose.scale = lerp(from.scale, line.scale, k);
        pose.visible = i === current ? 1 : smoothstep(0, 0.45, k);
        applyPose(i, pose);
      }

      animateMascot(time, current, spin, air, finale, motion);

      // Background tint: neutral -> product colors (blended through each spin) -> neutral.
      tint.copy(tints[whole]).lerp(tintNext.copy(tints[Math.min(n - 1, whole + 1)]), smoothstep(0.25, 0.75, spin));
      tint.lerp(neutral, Math.max(air, easeInOut(finale)));
      const background = `#${tint.getHexString()}`;
      if (background !== state.background) {
        state.background = background;
        stage.style.backgroundColor = background;
      }

      // Camera: one large centered product -> the whole lineup.
      const f = easeInOut(finale);
      const single = state.portrait
        ? fitDistance(PRODUCT_HEIGHT * 1.25, PRODUCT_HEIGHT * 1.3, 0.82, 0.5)
        : fitDistance(PRODUCT_HEIGHT * 1.25, PRODUCT_HEIGHT * 1.3, 0.34, 0.6);
      const group = state.portrait
        ? fitDistance(7.4, PRODUCT_HEIGHT * 2.2, 0.96, 0.6)
        : fitDistance(lineWidth, PRODUCT_HEIGHT, 0.9, 0.42);
      const distance = lerp(single, group, f);
      const lookY = lerp(PRODUCT_HEIGHT * 0.52, PRODUCT_HEIGHT * (state.portrait ? 0.42 : 0.62), f);

      const pt = state.pointer;
      pt.x += (pt.tx - pt.x) * 0.05;
      pt.y += (pt.ty - pt.y) * 0.05;
      const elevation = 0.12 + f * (state.portrait ? 0.38 : 0.16);
      camera.position.set(0, lookY + Math.sin(elevation) * distance, Math.cos(elevation) * distance);
      target.set(0, lookY, 0);
      camera.lookAt(target);

      // Product slightly below the middle, under the big title band.
      const drop = (state.portrait ? 0.07 : 0.06) * (1 - f);
      camera.setViewOffset(state.width, state.height, 0, -state.height * drop, state.width, state.height);

      renderer.render(scene, camera);

      if (debugRef.current) {
        const now = performance.now();
        state.fps += (1000 / Math.max(1, now - state.lastTick) - state.fps) * 0.1;
        state.lastTick = now;
        if (now - state.lastDebug > 200) {
          state.lastDebug = now;
          debugRef.current.textContent = `product ${current + 1} · spin ${spin.toFixed(2)} · finale ${finale.toFixed(2)} · ${Math.round(state.fps)} fps`;
        }
      }
    };

    const tick = (time: number) => render(time);

    /**
     * Warm-up while the loader is on screen: lighting environment, GPU texture
     * uploads and shader compilation, each in its own frame (shaders in parallel
     * when the browser supports it), so the loader mascot never stutters.
     * The loader's last 10% is this warm-up.
     */
    let ready = false;
    let cancelled = false;
    const warmUp = async () => {
      try {
        await nextFrame();
        if (cancelled) return;

        if (!m.rig && mascotRef.current) {
          m.rig = mascotRef.current;
          scene.add(m.rig.root);
        }
        const textures = new Set<THREE.Texture>();
        scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            const map = (material as THREE.MeshStandardMaterial).map;
            if (map) textures.add(map);
          }
        });
        for (const texture of textures) {
          await nextFrame();
          if (cancelled) return;
          renderer.initTexture(texture);
        }
        await nextFrame();
        if (cancelled) return;
        await renderer.compileAsync(scene, camera);
      } catch {
        // Anything left compiles on first use.
      }
      if (cancelled) return;
      ready = true;
      render(state.time, true);
      setSiteState({ loadProgress: 1 });
    };
    void warmUp();

    const resize = () => {
      state.width = stage.clientWidth;
      state.height = stage.clientHeight;
      state.portrait = state.width < 768 && state.height > state.width;
      const cap = state.width < 768 ? MAX_DPR_3D_MOBILE : MAX_DPR_3D;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
      renderer.setSize(state.width, state.height, false);
      camera.aspect = state.width / Math.max(1, state.height);
      camera.updateProjectionMatrix();
      render(state.time);
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 100);
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      state.pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
      state.pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
      // Hovering the mascot makes it wave (and shows it can be clicked).
      const rig = m.rig;
      if (!rig || !rig.root.visible) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hover = raycaster.intersectObjects(rig.meshes, false).length > 0;
      if (hover !== m.hover) {
        m.hover = hover;
        document.body.style.cursor = hover ? "pointer" : "";
      }
    };

    const onClick = () => {
      if (m.hover && m.trickAt < 0) m.trickAt = state.time;
    };

    // Only render while the hero is on screen.
    const observer = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
    });
    observer.observe(stage);

    const setCta = (show: boolean) => {
      if (show === state.ctaVisible) return;
      state.ctaVisible = show;
      gsap.to(ctaRef.current, {
        autoAlpha: show ? 1 : 0,
        y: show ? 0 : 16,
        duration: reducedMotion ? 0 : 0.8,
        ease: "power3.out",
        overwrite: true,
      });
    };

    resize();
    window.addEventListener("resize", onResize);
    if (!reducedMotion) {
      gsap.ticker.add(tick);
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("click", onClick);
    }

    let tween: gsap.core.Tween | null = null;

    if (reducedMotion) {
      // Static final lineup, normal page scrolling.
      heroTextRef.current?.setScroll(0);
      indicatorRef.current?.setFrameProgress(1);
      storyRef.current?.update(1, 1);
      hintRef.current?.setScroll(1);
      setCta(true);
      render(0);
    } else {
      const playhead = { progress: 0 };
      const apply = () => {
        const progress = mapProgress(playhead.progress);
        state.progress = progress;
        state.scroll = playhead.progress;
        heroTextRef.current?.setScroll(playhead.progress);
        hintRef.current?.setScroll(playhead.progress);
        indicatorRef.current?.setFrameProgress(progress);
        storyRef.current?.update(playhead.progress, progress);
        setCta(progress > CTA_START);
      };

      tween = gsap.to(playhead, {
        progress: 1,
        ease: "none",
        onUpdate: apply,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub,
          invalidateOnRefresh: true,
        },
      });

      // Restore the right pose immediately when the page is refreshed mid-scroll.
      const trigger = tween.scrollTrigger;
      triggerRef.current = trigger ?? null;
      if (trigger) {
        playhead.progress = trigger.progress;
        tween.progress(trigger.progress);
      }
      apply();
    }

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("click", onClick);
      if (m.hover) document.body.style.cursor = "";
      if (m.rig) scene.remove(m.rig.root);
      observer.disconnect();
      gsap.ticker.remove(tick);
      triggerRef.current = null;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      items.forEach((item) => {
        if (!item) return;
        scene.remove(item.model.object, item.blob);
        item.blob.geometry.dispose();
        (item.blob.material as THREE.MeshBasicMaterial).dispose();
      });
      blobTexture.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      cancelled = true;
      // Renderer and environment belong to the mount effect (reused on re-runs).
      renderer.renderLists.dispose();
      stage.style.backgroundColor = "";
    };
  }, [models, mascotRef, scrub, reducedMotion, debug]);

  // Product snapping: when the scroll stops during the product phase, glide to
  // the next product in the scroll direction (one product per gesture), so a
  // fast flick never jumps over a product.
  useEffect(() => {
    if (!lenis || reducedMotion) return;
    let timer = 0;
    /** Scroll position where the page last came to rest. */
    let restY = lenis.scroll;

    const settle = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      if (lenis.isScrolling) {
        timer = window.setTimeout(settle, 60);
        return;
      }
      const y = lenis.scroll;
      const length = trigger.end - trigger.start;
      const progress = (y - trigger.start) / length;
      const from = restY;
      restY = y;
      if (length <= 0 || progress < SNAP_RANGE[0] || progress > SNAP_RANGE[1]) return;

      const points = PRODUCT_SNAPS.map((p) => trigger.start + p * length);
      const gap = (PRODUCT_SNAPS[1] - PRODUCT_SNAPS[0]) * length;
      const nearest = points.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
      const delta = y - from;
      let target = nearest;
      if (Math.abs(delta) > 24) {
        // Next product after the previous rest position, in the scroll direction.
        const next = delta > 0 ? points.find((p) => p > from + 4) : [...points].reverse().find((p) => p < from - 4);
        // Unless the user clearly scrolled much further on purpose.
        if (next !== undefined && Math.abs(y - next) < gap * 0.75) target = next;
      }
      if (Math.abs(target - y) < 3) return;
      restY = target;
      lenis.scrollTo(target, { duration: SNAP_DURATION, easing: (t) => 1 - Math.pow(1 - t, 3) });
    };

    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SNAP_DELAY);
    };
    const off = lenis.on("scroll", onScroll);
    return () => {
      window.clearTimeout(timer);
      off();
    };
  }, [lenis, reducedMotion]);

  /** Pill selector: glide to a product (its spins play on the way). */
  const selectProduct = useCallback((index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const y = trigger.start + PRODUCT_SNAPS[index] * (trigger.end - trigger.start);
    const { lenis: smooth } = getSiteState();
    if (smooth) smooth.scrollTo(y, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const onCtaClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToTarget("#solutions");
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label={hero.title}
      className="relative w-full bg-bg"
      style={{ height: reducedMotion ? "100svh" : `${scrollLength}svh` }}
    >
      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden bg-bg">
        {/* Studio light pool and drifting window-light shadows over the tint. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 60% at 50% 55%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 78%)",
          }}
        />
        <div aria-hidden="true" className="gobo pointer-events-none absolute -inset-[15%]" />

        <ProductStory ref={storyRef} products={products} />
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 z-[5] block h-full w-full" />

        <HeroText ref={heroTextRef} title={hero.title} subtitle={hero.subtitle} />
        <ProductIndicator ref={indicatorRef} label={hero.productLabel} onSelect={selectProduct} />
        <ScrollHint ref={hintRef} label={hero.scrollHint} />

        <div
          ref={ctaRef}
          className="invisible absolute bottom-[max(40px,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 opacity-0"
        >
          <a href="#solutions" onClick={onCtaClick} className="label btn-red">
            {hero.cta}
          </a>
        </div>

        {debug && (
          <div
            ref={debugRef}
            className="fixed left-2 top-2 z-[200] bg-ink/80 px-2 py-1 font-mono text-[10px] leading-none text-white"
          />
        )}
      </div>
    </section>
  );
}
