"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ExperienceContent } from "@/lib/content-experience";
import { scrollToTarget } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

type PaintWallProps = { content: ExperienceContent["wall"] };

/** Coverage (0..1) at which the rest of the wall paints itself. */
const FINISH_AT = 0.42;
/** Vertical passes of the automatic roller driven by the scroll. */
const AUTO_PASSES = 5;

/** Small seeded random, so the wall looks the same on every visit. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paints a raw, cracked, stained plaster wall on the canvas (CSS pixel coordinates). */
function drawPlaster(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seeded(11);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#b9b5ae";
  ctx.fillRect(0, 0, w, h);

  // Uneven plaster: dark and light clouds.
  for (let i = 0; i < 34; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = (0.08 + rand() * 0.22) * Math.max(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rand() > 0.5;
    g.addColorStop(0, dark ? `rgba(92,86,78,${0.06 + rand() * 0.1})` : `rgba(236,232,224,${0.08 + rand() * 0.14})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Old filler patches.
  for (let i = 0; i < 6; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const s = 60 + rand() * 160;
    ctx.fillStyle = `rgba(214,209,199,${0.45 + rand() * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const d = s * (0.5 + rand() * 0.5);
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Damp stains rising from the floor.
  for (let i = 0; i < 4; i++) {
    const x = rand() * w;
    const r = 120 + rand() * 220;
    const g = ctx.createRadialGradient(x, h, 0, x, h, r);
    g.addColorStop(0, "rgba(112,88,58,0.28)");
    g.addColorStop(0.7, "rgba(112,88,58,0.1)");
    g.addColorStop(1, "rgba(112,88,58,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, h - r, r * 2, r);
  }

  // Grain.
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const tctx = tile.getContext("2d");
  if (tctx) {
    const data = tctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 90 + rand() * 120;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 40 + rand() * 50;
    }
    tctx.putImageData(data, 0, 0);
    const pattern = ctx.createPattern(tile, "repeat");
    if (pattern) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }

  // Cracks: random walks with a light edge, some of them branching.
  const crack = (sx: number, sy: number, angle: number, steps: number, width: number) => {
    let x = sx;
    let y = sy;
    let a = angle;
    const points: [number, number][] = [[x, y]];
    for (let i = 0; i < steps; i++) {
      a += (rand() - 0.5) * 0.9;
      const len = 6 + rand() * 14;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      points.push([x, y]);
      if (width > 0.8 && rand() < 0.08) crack(x, y, a + (rand() > 0.5 ? 0.9 : -0.9), steps * 0.4, width * 0.6);
    }
    for (const [offset, color] of [[1, "rgba(255,255,255,0.28)"], [0, "rgba(38,34,30,0.8)"]] as const) {
      ctx.beginPath();
      ctx.moveTo(points[0][0] + offset, points[0][1] + offset);
      for (const [px, py] of points) ctx.lineTo(px + offset, py + offset);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  };
  for (let i = 0; i < 8; i++) {
    crack(rand() * w, rand() * h, rand() * Math.PI * 2, 18 + rand() * 30, 1 + rand() * 1.2);
  }
}

/**
 * Right after the hero: a raw, cracked wall covers the screen. The visitor
 * paints it with a roller (mouse) or by scrolling (an automatic roller makes
 * vertical passes). Past FINISH_AT coverage, the rest of the wall paints itself
 * in one sweep and the message underneath is revealed.
 */
export default function PaintWall({ content }: PaintWallProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rollerRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const roller = rollerRef.current;
    if (!stage || !canvas || !roller || reducedMotion) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sample = document.createElement("canvas");
    sample.width = 64;
    sample.height = 36;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    const state = {
      w: 0,
      h: 0,
      rollerWidth: 160,
      finished: false,
      hovering: false,
      last: null as { x: number; y: number } | null,
      autoT: 0,
      measureTimer: 0,
    };

    const placeRoller = (x: number, y: number) => {
      gsap.set(roller, { x: x - state.rollerWidth / 2, y: y - state.rollerWidth * 0.085 });
    };

    /** One roller footprint: a full band with soft, irregular edges. */
    const footprint = (x: number, y: number) => {
      const rw = state.rollerWidth;
      ctx.globalAlpha = 1;
      ctx.fillRect(x - rw / 2, y - 14, rw, 28);
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < 4; i++) {
        const edge = Math.random() * 6;
        ctx.fillRect(x - rw / 2 - edge, y - 14 + Math.random() * 20, 4 + edge, 6);
        ctx.fillRect(x + rw / 2 - 4, y - 14 + Math.random() * 20, 4 + edge, 6);
      }
    };

    const paintSegment = (x0: number, y0: number, x1: number, y1: number) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000";
      const distance = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(distance / 6));
      for (let i = 0; i <= steps; i++) {
        footprint(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      scheduleMeasure();
    };

    const measure = () => {
      state.measureTimer = 0;
      if (!sctx || state.finished) return;
      sctx.clearRect(0, 0, 64, 36);
      sctx.drawImage(canvas, 0, 0, 64, 36);
      const { data } = sctx.getImageData(0, 0, 64, 36);
      let cleared = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 60) cleared++;
      const coverage = cleared / (64 * 36);
      if (percentRef.current) percentRef.current.textContent = String(Math.min(100, Math.round((coverage / FINISH_AT) * 100)));
      if (coverage >= FINISH_AT) finish();
    };

    const scheduleMeasure = () => {
      if (!state.measureTimer) state.measureTimer = window.setTimeout(measure, 180);
    };

    /** The roller sweeps the remaining wall from left to right. */
    const finish = () => {
      if (state.finished) return;
      state.finished = true;
      if (percentRef.current) percentRef.current.textContent = "100";
      const sweep = { p: 0 };
      gsap.to(hintRef.current, { autoAlpha: 0, duration: 0.5 });
      gsap.to(sweep, {
        p: 1,
        duration: 1.3,
        ease: "power2.inOut",
        onUpdate: () => {
          canvas.style.clipPath = `inset(0 0 0 ${sweep.p * 100}%)`;
          placeRoller(sweep.p * state.w, state.h / 2 + Math.sin(sweep.p * Math.PI * 6) * state.h * 0.25);
        },
        onComplete: () => {
          gsap.to(roller, { autoAlpha: 0, duration: 0.4 });
          setDone(true);
        },
      });
    };

    /** Position along the automatic zig-zag path (t in 0..1). */
    const autoPoint = (t: number) => {
      const pass = Math.min(AUTO_PASSES - 1, Math.floor(t * AUTO_PASSES));
      const local = t * AUTO_PASSES - pass;
      const x = ((pass + 0.5) / AUTO_PASSES) * state.w;
      const top = -20;
      const bottom = state.h + 20;
      const y = pass % 2 === 0 ? top + (bottom - top) * local : bottom - (bottom - top) * local;
      return { x, y };
    };

    const resize = () => {
      const width = stage.clientWidth;
      if (width === state.w && state.h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      state.w = width;
      state.h = stage.clientHeight;
      state.rollerWidth = Math.min(220, Math.max(110, state.w / AUTO_PASSES + 30));
      roller.style.width = `${state.rollerWidth}px`;
      canvas.width = Math.round(state.w * dpr);
      canvas.height = Math.round(state.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state.finished) return;
      drawPlaster(ctx, state.w, state.h);
      // Replay the scroll-driven passes already made.
      const t = state.autoT;
      state.autoT = 0;
      advanceAuto(t, false);
      placeRoller(state.w * 0.62, state.h * 0.58);
    };

    const advanceAuto = (target: number, moveRoller: boolean) => {
      if (target <= state.autoT || state.finished) return;
      let prev = autoPoint(state.autoT);
      for (let t = state.autoT; t < target; t = Math.min(target, t + 0.004)) {
        const next = autoPoint(Math.min(target, t + 0.004));
        // A new pass starts at the opposite edge: do not drag paint across the wall.
        if (Math.abs(next.x - prev.x) < 2) paintSegment(prev.x, prev.y, next.x, next.y);
        prev = next;
      }
      state.autoT = target;
      if (moveRoller && !state.hovering) placeRoller(prev.x, prev.y);
    };

    const onMove = (event: PointerEvent) => {
      if (state.finished || event.pointerType !== "mouse") return;
      const rect = stage.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      state.hovering = true;
      placeRoller(x, y);
      if (state.last) paintSegment(state.last.x, state.last.y, x, y);
      state.last = { x, y };
    };
    const onLeave = () => {
      state.hovering = false;
      state.last = null;
    };

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    if (finePointer) {
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
    }

    // The section pins for one screen; the scroll drives the automatic roller.
    const trigger = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "+=110%",
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        advanceAuto(Math.min(1, self.progress / 0.9), true);
        if (self.progress > 0.92) finish();
      },
    });

    return () => {
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      window.clearTimeout(state.measureTimer);
      trigger.kill();
    };
  }, [reducedMotion]);

  // Badge and button come in once the wall is painted.
  useEffect(() => {
    if (!done || !afterRef.current) return;
    gsap.fromTo(
      afterRef.current.children,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" },
    );
  }, [done]);

  const painted = done || reducedMotion;

  const onCta = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToTarget("#factory");
  };

  return (
    <section id="paint-wall" aria-label={content.title} className="relative bg-red">
      <div
        ref={stageRef}
        className={`relative h-svh w-full overflow-hidden ${painted ? "" : "min-[900px]:cursor-none"}`}
      >
        {/* The fresh paint underneath, with soft roller streaks. */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-[var(--nav-px)] text-center text-white"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 9px), radial-gradient(120% 80% at 50% 40%, rgba(255,255,255,0.12), transparent 60%)",
          }}
        >
          <p className="label text-white/80">{content.eyebrow}</p>
          <h2 className="font-heading mt-6 max-w-[14ch] text-[clamp(48px,8.4vw,150px)] font-normal leading-[0.95]">
            {content.title}
          </h2>
          <p className="mt-8 max-w-[44ch] text-[15px] leading-relaxed text-white/85 min-[900px]:text-[17px]">{content.text}</p>
          <div ref={afterRef} className="mt-10 flex flex-col items-center gap-5 min-[600px]:flex-row">
            <span className={`label border border-white/50 px-4 py-3 text-white ${painted ? "" : "invisible"}`}>
              {content.badge}
            </span>
            <a
              href="#factory"
              onClick={onCta}
              className={`label bg-white px-7 py-4 text-ink transition-colors duration-400 hover:bg-ink hover:text-white ${painted ? "" : "invisible"}`}
            >
              {content.cta}
            </a>
          </div>
        </div>

        {!reducedMotion && (
          <>
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className={`absolute inset-0 block h-full w-full ${done ? "hidden" : ""}`}
            />

            {/* Paint roller (follows the mouse or the automatic passes). */}
            <div
              ref={rollerRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-10 will-change-transform"
            >
              <svg viewBox="0 0 200 170" className="block h-auto w-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.25)]">
                <rect x="0" y="0" width="200" height="34" rx="12" fill="#E8372C" />
                <rect x="6" y="5" width="188" height="7" rx="3.5" fill="#fff" opacity="0.28" />
                <path d="M200 17 h12 v52 h-112 v18" fill="none" stroke="#2b2b2b" strokeWidth="7" strokeLinejoin="round" />
                <rect x="88" y="84" width="24" height="86" rx="10" fill="#141414" />
              </svg>
            </div>

            <div
              ref={hintRef}
              className="pointer-events-none absolute inset-x-0 bottom-[max(32px,env(safe-area-inset-bottom))] z-20 flex flex-col items-center gap-3 text-ink"
            >
              <p className="label rounded-full bg-white/85 px-5 py-3 backdrop-blur-sm">
                <span className="hidden min-[900px]:inline">{content.hint}</span>
                <span className="min-[900px]:hidden">{content.hintTouch}</span>
              </p>
              <p className="label tabular text-ink/70">
                <span ref={percentRef}>0</span>% {content.painted}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
