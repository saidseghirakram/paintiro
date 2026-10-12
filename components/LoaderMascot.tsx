"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { gsap } from "gsap";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { loadMascot, MASCOT_BODY_WIDTH, type Mascot } from "@/lib/mascot";

export type LoaderMascotHandle = {
  /** Displayed loading progress (0..1): where the mascot has painted up to. */
  setProgress: (progress: number) => void;
  /** The curtain is leaving: the mascot launches upward with it. */
  leave: () => void;
};

type LoaderMascotProps = {
  reducedMotion: boolean;
  ref?: Ref<LoaderMascotHandle>;
};

/** On the red loader the mascot wears its original colors: black body, white "P". */
const LOADER_MASCOT_COLOR = "#161616";
/** Hops per second. */
const HOP_RATE = 1.7;
/** Hop height, in mascot body widths. */
const HOP_HEIGHT = 0.9;
/** A flip is queued every time the progress passes one of these. */
const FLIP_AT = [0.25, 0.5, 0.75];
const DROPS = 42;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Splash screen star: the mascot hops along a line and paints it white behind it,
 * the painted stroke being the real loading progress. Each landing squashes it and
 * splashes paint drops; it flips at every quarter, celebrates at 100% and launches
 * upward when the red curtain leaves.
 */
export default function LoaderMascot({ reducedMotion, ref }: LoaderMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const control = useRef({ progress: 0, leaveAt: -1, leaving: false });

  useImperativeHandle(
    ref,
    () => ({
      setProgress(progress: number) {
        control.current.progress = clamp01(progress);
      },
      leave() {
        control.current.leaving = true;
      },
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      return; // No WebGL: the classic loader (text + bar) still works.
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 4, 5);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.35, 9);
    camera.lookAt(0, 0.35, 0);

    // Track: faint full line + the white painted stroke (the progress).
    const unit = MASCOT_BODY_WIDTH;
    const thickness = unit * 0.07;
    const track = new THREE.Mesh(
      new THREE.BoxGeometry(1, thickness, thickness),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }),
    );
    const stroke = new THREE.Mesh(
      new THREE.BoxGeometry(1, thickness * 1.6, thickness * 1.6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 }),
    );
    // The stroke grows from its left end.
    stroke.geometry.translate(0.5, 0, 0);
    scene.add(track, stroke);

    // Paint drops: a small pool of spheres recycled for every splash.
    const dropGeometry = new THREE.SphereGeometry(unit * 0.045, 12, 8);
    const dropMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const drops = Array.from({ length: DROPS }, () => {
      const mesh = new THREE.Mesh(dropGeometry, dropMaterial);
      mesh.visible = false;
      scene.add(mesh);
      return { mesh, velocity: new THREE.Vector3(), life: 0 };
    });
    let nextDrop = 0;
    const splash = (x: number, count: number, power: number) => {
      for (let i = 0; i < count; i++) {
        const drop = drops[nextDrop++ % DROPS];
        const angle = Math.PI * (0.15 + Math.random() * 0.7);
        const speed = (1.4 + Math.random() * 1.6) * power * unit;
        drop.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed * 1.4, (Math.random() - 0.5) * speed);
        drop.mesh.position.set(x + (Math.random() - 0.5) * unit * 0.6, 0, 0);
        drop.mesh.scale.setScalar(0.6 + Math.random() * 0.9);
        drop.mesh.visible = true;
        drop.life = 1;
      }
    };

    const state = {
      width: 0,
      height: 0,
      trackLeft: -2,
      trackWidth: 4,
      mascot: null as Mascot | null,
      bornAt: -1,
      x: 0,
      painted: 0,
      phase: 0,
      squash: 0,
      squashVelocity: 0,
      flipsDone: 0,
      flipHop: -1,
      celebrated: false,
      celebrateAt: -1,
      /** The celebration jump has landed (one big splash). */
      celebrationLanded: false,
      launchAt: -1,
      lastTime: -1,
      lastHop: 0,
    };

    let disposed = false;
    loadMascot(LOADER_MASCOT_COLOR)
      .then((mascot) => {
        if (disposed) {
          mascot.dispose();
          return;
        }
        state.mascot = mascot;
        mascot.root.scale.setScalar(0);
        scene.add(mascot.root);
      })
      .catch(() => {
        // No mascot: the painted stroke still shows the progress.
      });

    const resize = () => {
      state.width = canvas.clientWidth;
      state.height = canvas.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(state.width, state.height, false);
      camera.aspect = state.width / Math.max(1, state.height);
      camera.updateProjectionMatrix();
      // Track spans 46% of the screen width on desktop, 76% on phones.
      const visibleWidth = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * camera.position.z * camera.aspect;
      state.trackWidth = visibleWidth * (state.width < 768 ? 0.76 : 0.46);
      state.trackLeft = -state.trackWidth / 2;
      track.scale.x = state.trackWidth;
      track.position.set(0, -thickness / 2, 0);
      stroke.position.set(state.trackLeft, -thickness * 0.8, 0);
      if (!state.painted) state.x = state.trackLeft;
    };

    const tick = (time: number) => {
      const dt = state.lastTime < 0 ? 0 : Math.min(0.05, time - state.lastTime);
      state.lastTime = time;
      const c = control.current;
      const mascot = state.mascot;
      const motion = reducedMotion ? 0 : 1;

      // Target: the painted end follows the real progress; the mascot runs to it.
      const target = state.trackLeft + state.trackWidth * c.progress;
      const before = state.x;
      state.x += (target - state.x) * Math.min(1, dt * (reducedMotion ? 20 : 2.6));
      const speed = dt > 0 ? (state.x - before) / dt : 0;
      state.painted = Math.max(state.painted, state.x - state.trackLeft);
      stroke.scale.x = Math.max(0.0001, state.painted);

      // Paint drops: ballistic, shrink as they fall back.
      for (const drop of drops) {
        if (!drop.mesh.visible) continue;
        drop.life -= dt * 1.1;
        drop.velocity.y -= 9.8 * unit * dt;
        drop.mesh.position.addScaledVector(drop.velocity, dt);
        if (drop.mesh.position.y < -thickness) {
          drop.mesh.position.y = -thickness;
          drop.velocity.set(0, 0, 0);
        }
        drop.mesh.scale.multiplyScalar(drop.life > 0.3 ? 1 : 0.9);
        drop.mesh.visible = drop.life > 0;
      }

      if (mascot) {
        if (state.bornAt < 0) state.bornAt = time;
        const born = clamp01((time - state.bornAt) / 0.7);
        // Elastic pop-in.
        const appear =
          born >= 1 ? 1 : Math.pow(2, -10 * born) * Math.sin((born * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;

        // Finished: one big celebration jump, then it waves until the curtain leaves.
        const done = c.progress >= 0.999 && Math.abs(target - state.x) < unit * 0.05;
        if (done && !state.celebrated) {
          state.celebrated = true;
          state.celebrateAt = time;
        }
        if (c.leaving && state.launchAt < 0) state.launchAt = time;

        // Hop cycle (keeps hopping while it travels, softer when it waits).
        const travelling = Math.abs(target - state.x) > unit * 0.04;
        state.phase += dt * HOP_RATE * (travelling ? 1 : 0.75) * motion;
        const hopIndex = Math.floor(state.phase);
        const t = state.phase - hopIndex;

        // Queue a flip on the next hop when a quarter is passed.
        if (state.flipsDone < FLIP_AT.length && c.progress >= FLIP_AT[state.flipsDone] && state.flipHop < 0) {
          state.flipHop = hopIndex + 1;
          state.flipsDone++;
        }
        const flipping = state.flipHop === hopIndex;
        if (state.flipHop >= 0 && hopIndex > state.flipHop) state.flipHop = -1;

        let height = Math.sin(t * Math.PI) * HOP_HEIGHT * unit * (flipping ? 1.8 : 1) * motion;
        let flip = flipping ? -Math.PI * 2 * easeInOut(clamp01((t - 0.1) / 0.8)) : 0;

        // Celebration: a high backflip, then a happy idle.
        if (state.celebrateAt >= 0) {
          const k = clamp01((time - state.celebrateAt) / 1.1);
          if (k < 1) {
            height = Math.sin(k * Math.PI) * HOP_HEIGHT * unit * 2.6 * motion;
            flip = Math.PI * 2 * easeInOut(k) * motion;
          } else {
            height = Math.abs(Math.sin(time * 5)) * unit * 0.12 * motion;
            flip = 0;
          }
        }

        // Launch with the curtain.
        let launch = 0;
        if (state.launchAt >= 0) {
          const k = time - state.launchAt;
          launch = k * k * 9 * unit + k * 2 * unit;
          flip += k * 9 * motion;
        }

        // Landing / take-off kicks the squash spring, and a landing splashes paint.
        if (hopIndex !== state.lastHop) {
          state.lastHop = hopIndex;
          if (motion && state.celebrateAt < 0) {
            state.squashVelocity += 4.5;
            splash(state.x, travelling ? 6 : 3, flipping ? 1.3 : 1);
          }
        }
        if (state.celebrateAt >= 0 && !state.celebrationLanded && time - state.celebrateAt > 1.1) {
          state.celebrationLanded = true;
          state.squashVelocity += 5;
          splash(state.x, 14, 1.6);
        }
        state.squashVelocity += (-170 * state.squash - 11 * state.squashVelocity) * dt;
        state.squash = Math.max(-0.35, Math.min(0.45, state.squash + state.squashVelocity * dt));

        const air = clamp01(height / (HOP_HEIGHT * unit));
        mascot.root.position.set(state.x, height + launch, 0);
        mascot.root.scale.setScalar(appear);
        // Faces us, turned a little towards where it is heading; leans into the run.
        const lean = THREE.MathUtils.clamp(-speed * 0.12, -0.35, 0.35) * motion;
        mascot.root.rotation.set(0, travelling ? 0.38 : 0.12 * Math.sin(time * 1.3), lean, "YXZ");
        mascot.body.rotation.set(flip, 0, 0);
        mascot.body.scale.set(1 + state.squash * 0.6, 1 - state.squash, 1 + state.squash * 0.6);
        mascot.body.position.y = (mascot.height / 2) * (1 - state.squash);

        // Arms: flap while airborne, wave both when finished.
        const flap = Math.sin(time * 14) * 0.25 * air;
        let left = 0.15 + air * 1.0 + flap;
        let right = 0.15 + air * 1.0 - flap;
        if (state.celebrateAt >= 0 && time - state.celebrateAt > 1.1) {
          left = 1.3 + Math.sin(time * 11) * 0.35;
          right = 1.3 + Math.sin(time * 11 + Math.PI) * 0.35;
        }
        mascot.armLeft.rotation.z = -left * (motion ? 1 : 0.2);
        mascot.armRight.rotation.z = right * (motion ? 1 : 0.2);
      }

      renderer.render(scene, camera);
    };

    resize();
    window.addEventListener("resize", resize);
    gsap.ticker.add(tick);

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
      if (state.mascot) {
        scene.remove(state.mascot.root);
        state.mascot.dispose();
      }
      track.geometry.dispose();
      (track.material as THREE.Material).dispose();
      stroke.geometry.dispose();
      (stroke.material as THREE.Material).dispose();
      dropGeometry.dispose();
      dropMaterial.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
