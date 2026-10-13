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
      /** Position on the track and its velocity (critically damped spring: no snaps, no overshoot). */
      x: 0,
      vx: 0,
      painted: 0,
      /** Hop cycle: integer part = hop count, fraction = progress through the hop. */
      phase: 0,
      /** 0 = waiting, 1 = travelling; eased, so hop size and pace change smoothly. */
      gait: 0,
      /** Eased pose values (every visible value is smoothed: nothing jumps between frames). */
      yaw: 0,
      lean: 0,
      armLeft: 0.15,
      armRight: 0.15,
      squash: 0,
      squashVelocity: 0,
      flipsDone: 0,
      flipHop: -1,
      /** Celebration: queued for the next landing, so it starts from the ground. */
      celebrateHop: -1,
      celebrateAt: -1,
      landedAt: -1,
      launchAt: -1,
      lastTime: -1,
      lastHop: 0,
    };

    let disposed = false;
    loadMascot(LOADER_MASCOT_COLOR)
      .then(async (mascot) => {
        if (disposed) {
          mascot.dispose();
          return;
        }
        // Compile its shaders before it appears, so the pop-in never hitches.
        mascot.root.scale.setScalar(0);
        scene.add(mascot.root);
        try {
          await renderer.compileAsync(scene, camera);
        } catch {
          // Compiles on first draw instead.
        }
        if (disposed) {
          mascot.dispose();
          return;
        }
        state.mascot = mascot;
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

    /** Frame-rate independent easing factor towards a target. */
    const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

    const tick = (time: number) => {
      const dt = state.lastTime < 0 ? 0 : Math.min(1 / 30, time - state.lastTime);
      state.lastTime = time;
      const c = control.current;
      const mascot = state.mascot;
      const motion = reducedMotion ? 0 : 1;

      // The mascot runs to the painted end of the real progress (spring, never jumps).
      const target = state.trackLeft + state.trackWidth * c.progress;
      if (reducedMotion) {
        state.x = target;
        state.vx = 0;
      } else {
        const omega = 3.4;
        state.vx += (omega * omega * (target - state.x) - 2 * omega * state.vx) * dt;
        state.x += state.vx * dt;
      }
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
        if (drop.life < 0.3) drop.mesh.scale.multiplyScalar(Math.pow(0.002, dt));
        drop.mesh.visible = drop.life > 0;
      }

      if (mascot) {
        if (state.bornAt < 0) state.bornAt = time;
        const born = clamp01((time - state.bornAt) / 0.7);
        // Elastic pop-in.
        const appear =
          born >= 1 ? 1 : Math.pow(2, -10 * born) * Math.sin((born * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
        if (c.leaving && state.launchAt < 0) state.launchAt = time;

        // Gait: eased between waiting (small, slower hops) and travelling.
        const distance = Math.abs(target - state.x);
        state.gait += (clamp01(distance / (unit * 0.25)) - state.gait) * ease(4, dt);

        // Hop cycle; frozen during the celebration.
        const celebrating = state.celebrateAt >= 0;
        if (!celebrating) state.phase += dt * HOP_RATE * (0.75 + 0.25 * state.gait) * motion;
        const hopIndex = Math.floor(state.phase);
        const t = state.phase - hopIndex;

        // 100% reached: the celebration starts at the next landing.
        if (c.progress >= 0.999 && distance < unit * 0.05 && state.celebrateHop < 0) state.celebrateHop = hopIndex + 1;
        if (!celebrating && state.celebrateHop >= 0 && hopIndex >= state.celebrateHop) {
          state.celebrateAt = time;
          state.phase = state.celebrateHop;
        }

        // A flip on the hop after each quarter is passed.
        if (state.flipsDone < FLIP_AT.length && c.progress >= FLIP_AT[state.flipsDone] && state.flipHop < 0) {
          state.flipHop = hopIndex + 1;
          state.flipsDone++;
        }
        const flipping = !celebrating && state.flipHop === hopIndex;
        if (state.flipHop >= 0 && hopIndex > state.flipHop) state.flipHop = -1;

        const hopSize = HOP_HEIGHT * unit * (0.55 + 0.45 * state.gait) * (flipping ? 1.8 : 1);
        let height = celebrating ? 0 : Math.sin(t * Math.PI) * hopSize * motion;
        let flip = flipping ? -Math.PI * 2 * easeInOut(clamp01((t - 0.08) / 0.84)) : 0;
        let airMax = hopSize;

        // Celebration: a high backflip, then a happy bounce that starts from the ground.
        if (celebrating) {
          const k = clamp01((time - state.celebrateAt) / 1.1);
          if (k < 1) {
            airMax = HOP_HEIGHT * unit * 2.6;
            height = Math.sin(k * Math.PI) * airMax * motion;
            flip = Math.PI * 2 * easeInOut(k) * motion;
          } else {
            if (state.landedAt < 0) {
              state.landedAt = time;
              state.squashVelocity += 5;
              splash(state.x, 14, 1.6);
            }
            airMax = unit * 0.14;
            height = Math.abs(Math.sin((time - state.landedAt) * 5)) * airMax * motion;
          }
        }

        // Launch with the curtain.
        let launch = 0;
        if (state.launchAt >= 0) {
          const k = time - state.launchAt;
          launch = k * k * 9 * unit + k * 2 * unit;
          flip += k * 9 * motion;
        }

        // Each landing kicks the squash spring and splashes paint.
        if (hopIndex !== state.lastHop) {
          state.lastHop = hopIndex;
          if (motion && !celebrating) {
            state.squashVelocity += 3.5 + 1.5 * state.gait;
            splash(state.x, Math.round(3 + 3 * state.gait), flipping ? 1.3 : 1);
          }
        }
        state.squashVelocity += (-170 * state.squash - 11 * state.squashVelocity) * dt;
        state.squash = Math.max(-0.35, Math.min(0.45, state.squash + state.squashVelocity * dt));

        const air = clamp01(height / Math.max(1e-6, airMax));
        mascot.root.position.set(state.x, height + launch, 0);
        mascot.root.scale.setScalar(appear);

        // Turned towards where it heads while travelling, looks around while waiting; leans into the run.
        const yawGoal = (0.38 * state.gait + 0.12 * Math.sin(time * 1.3) * (1 - state.gait)) * motion;
        state.yaw += (yawGoal - state.yaw) * ease(5, dt);
        const leanGoal = THREE.MathUtils.clamp(-state.vx * 0.09, -0.3, 0.3) * motion;
        state.lean += (leanGoal - state.lean) * ease(8, dt);
        mascot.root.rotation.set(0, state.yaw, state.lean, "YXZ");
        mascot.body.rotation.set(flip, 0, 0);
        mascot.body.scale.set(1 + state.squash * 0.6, 1 - state.squash, 1 + state.squash * 0.6);
        mascot.body.position.y = (mascot.height / 2) * (1 - state.squash);

        // Arms: flap while airborne, wave both after the celebration (eased, never snap).
        const flap = Math.sin(time * 14) * 0.25 * air;
        let left = 0.15 + air * 1.0 + flap;
        let right = 0.15 + air * 1.0 - flap;
        if (state.landedAt >= 0) {
          left = 1.3 + Math.sin(time * 11) * 0.35;
          right = 1.3 + Math.sin(time * 11 + Math.PI) * 0.35;
        }
        const scale = motion ? 1 : 0.2;
        state.armLeft += (left * scale - state.armLeft) * ease(16, dt);
        state.armRight += (right * scale - state.armRight) * ease(16, dt);
        mascot.armLeft.rotation.z = -state.armLeft;
        mascot.armRight.rotation.z = state.armRight;
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
