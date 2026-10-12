"use client";

import { useEffect, useRef, useSyncExternalStore, type MouseEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CTA_START, mapProgress, PRODUCT_SNAPS, SNAP_RANGE } from "@/lib/chapters";
import {
  DEFAULT_FIT,
  MAX_DPR,
  MAX_DPR_MOBILE,
  MOBILE_CONTAIN_ZOOM,
  SCROLL_LENGTH,
  SCRUB,
} from "@/lib/config";
import type { Content, ProductCopy } from "@/lib/content";
import { scrollToTarget, useSiteState } from "@/lib/store";
import { useFrameLoader } from "@/lib/useFrameLoader";
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

type FrameSequenceProps = {
  hero: Content["hero"];
  /** Product texts, same order as PRODUCTS in lib/chapters.ts. */
  products: ProductCopy[];
  /** Section height in svh units (default SCROLL_LENGTH from lib/config.ts). */
  scrollLength?: number;
  /** ScrollTrigger scrub smoothing in seconds. */
  scrub?: number;
  /** Canvas fit on desktop / landscape. Mobile portrait always uses "contain". */
  fit?: "cover" | "contain";
};

/** Same color as a hex background, fully transparent (for the edge feathering). */
function transparent(color: string): string {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  return /^[0-9a-f]{6}$/i.test(full) ? `#${full}00` : "rgba(208, 207, 203, 0)";
}

/** ?debug=1 in the URL shows the frame number and FPS. */
const noopSubscribe = () => () => {};
function useDebugFlag(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("debug") === "1",
    () => false,
  );
}

/**
 * Hero: a tall section with a sticky full-screen canvas that plays the
 * pre-rendered frames according to the scroll position, plus HTML overlays.
 */
export default function FrameSequence({
  hero,
  products,
  scrollLength = SCROLL_LENGTH,
  scrub = SCRUB,
  fit = DEFAULT_FIT,
}: FrameSequenceProps) {
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

  const { manifest, getFrame, focus } = useFrameLoader();
  const reducedMotion = useReducedMotion();
  const debug = useDebugFlag();
  const lenis = useSiteState((s) => s.lenis);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!manifest || !section || !stage || !canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const count = manifest.count;
    const bg =
      getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#d0cfcb";

    const state = {
      /** Fractional frame position (e.g. 41.37 = frame 41 blended with 37% of frame 42). */
      position: reducedMotion ? count - 1 : 0,
      /** Position actually painted: follows `position`, settles on a whole frame at rest. */
      display: reducedMotion ? count - 1 : 0,
      lastPosition: reducedMotion ? count - 1 : 0,
      /** Ticks since the scroll position last changed. */
      idle: 0,
      /** Quantized position last painted, so idle ticks never redraw. */
      drawnKey: -1,
      drawn: -1,
      dirty: true,
      cssWidth: 0,
      cssHeight: 0,
      ctaVisible: false,
      fps: 60,
      lastDebug: 0,
      lastTick: 0,
      /** Where frames are drawn, in canvas pixels (computed on resize). */
      rect: { dx: 0, dy: 0, dw: 0, dh: 0 },
    };
    const blurry = new Set(manifest.blurry ?? []);
    /** Nearest frame without motion blur (resting on a spin frame would look soft). */
    const nearestSharp = (index: number) => {
      for (let d = 0; d <= 24; d++) {
        if (index + d < count && !blurry.has(index + d)) return index + d;
        if (index - d >= 0 && !blurry.has(index - d)) return index - d;
      }
      return index;
    };
    const frameWidth = manifest.width || 1920;
    const frameHeight = manifest.height || 1080;
    const clear = transparent(bg);

    /**
     * Draws a frame with cover / contain logic, filling the rest with --bg.
     * When `next` is given it is cross-faded on top with `mix` opacity, so the
     * sequence moves continuously between frames instead of stepping.
     */
    /** Cover / contain placement of a frame in the canvas (device pixels). */
    const layout = () => {
      const cw = canvas.width;
      const ch = canvas.height;
      const portrait = state.cssWidth < 768 && state.cssHeight > state.cssWidth;
      const mode = portrait ? "contain" : fit;

      const cover = Math.max(cw / frameWidth, ch / frameHeight);
      let scale = mode === "cover" ? cover : Math.min(cw / frameWidth, ch / frameHeight);
      if (portrait) scale = Math.min(scale * MOBILE_CONTAIN_ZOOM, cover);

      const dw = frameWidth * scale;
      const dh = frameHeight * scale;
      const dx = (cw - dw) / 2;
      // On portrait screens the image sits slightly low to leave room for the title.
      const dy = portrait ? Math.min(ch - dh, (ch - dh) * 0.62) : (ch - dh) / 2;
      state.rect = { dx, dy, dw, dh };
    };

    const draw = (image: CanvasImageSource, next: CanvasImageSource | null, mix: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const { dx, dy, dw, dh } = state.rect;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      if (dw < cw || dh < ch) {
        context.fillStyle = bg;
        context.fillRect(0, 0, cw, ch);
      }
      context.drawImage(image, dx, dy, dw, dh);
      if (next && mix > 0.02) {
        context.globalAlpha = mix;
        context.drawImage(next, dx, dy, dw, dh);
        context.globalAlpha = 1;
      }

      // Feather the image edges into the background when they are visible.
      if (dh < ch - 1) {
        const f = dh * 0.12;
        const top = context.createLinearGradient(0, dy, 0, dy + f);
        top.addColorStop(0, bg);
        top.addColorStop(1, clear);
        context.fillStyle = top;
        context.fillRect(0, dy - 1, cw, f + 1);
        const bottom = context.createLinearGradient(0, dy + dh - f, 0, dy + dh);
        bottom.addColorStop(0, clear);
        bottom.addColorStop(1, bg);
        context.fillStyle = bottom;
        context.fillRect(0, dy + dh - f, cw, f + 1);
      }
      if (dw < cw - 1) {
        const f = dw * 0.08;
        const left = context.createLinearGradient(dx, 0, dx + f, 0);
        left.addColorStop(0, bg);
        left.addColorStop(1, clear);
        context.fillStyle = left;
        context.fillRect(dx - 1, 0, f + 1, ch);
        const right = context.createLinearGradient(dx + dw - f, 0, dx + dw, 0);
        right.addColorStop(0, clear);
        right.addColorStop(1, bg);
        context.fillStyle = right;
        context.fillRect(dx + dw - f, 0, f + 1, ch);
      }
    };

    /** Ticker callback: draws only when the visible picture actually changes. */
    const render = () => {
      // While scrolling, the picture follows the scroll and cross-fades between frames.
      // As soon as the scroll stops, it glides onto the nearest whole, sharp frame, so a
      // paused page always shows one clean picture: never two frames blended together and
      // never a motion-blurred frame from the middle of a spin.
      const moving = Math.abs(state.position - state.lastPosition) > 0.0005;
      state.lastPosition = state.position;
      state.idle = moving ? 0 : state.idle + 1;
      const resting = state.idle > 3;
      const goal = resting ? nearestSharp(Math.round(state.position)) : state.position;
      state.display += (goal - state.display) * (resting ? 0.22 : 0.5);
      if (Math.abs(goal - state.display) < 0.02) state.display = goal;

      // Round up when within 1% of the next frame, so a settled picture is a single frame.
      const base = Math.min(count - 1, Math.floor(state.display + 0.01));
      // Each frame is shown clean for most of its interval and only blends with the
      // next one in the middle 40%: smooth motion without visible double images.
      const raw = state.display - base;
      const t = Math.min(1, Math.max(0, (raw - 0.3) / 0.4));
      const mix = t * t * (3 - 2 * t);
      const found = getFrame(base);
      if (!found) return;

      // Blend with the following frame only when both exact frames are decoded.
      const exact = found.index === base;
      const following = exact && mix > 0.02 ? getFrame(base + 1) : null;
      const next = following && following.index === base + 1 ? following.image : null;
      // Unique per (frame, blend step): a full blend and the next frame alone never collide.
      const key = found.index * 100 + (next ? Math.round(mix * 24) : 0);

      if (key !== state.drawnKey || state.dirty) {
        const t0 = performance.now();
        draw(found.image, next, mix);
        if (debugRef.current) {
          // Debug-only measurements, read by performance tests via window.__seqStats.
          const stats = ((window as unknown as { __seqStats?: Record<string, number> }).__seqStats ??= {
            draws: 0, slowDraws: 0, maxDraw: 0, fallbacks: 0, blended: 0,
          });
          const ms = performance.now() - t0;
          stats.draws++;
          if (ms > 8) stats.slowDraws++;
          stats.maxDraw = Math.max(stats.maxDraw, ms);
          if (!exact) stats.fallbacks++;
          if (next) stats.blended++;
        }
        state.drawnKey = key;
        state.drawn = found.index;
        state.dirty = false;
      }
      focus(base);

      if (debugRef.current) {
        const now = performance.now();
        state.fps += (1000 / Math.max(1, now - state.lastTick) - state.fps) * 0.1;
        state.lastTick = now;
        if (now - state.lastDebug > 200) {
          state.lastDebug = now;
          debugRef.current.textContent = `frame ${state.drawn + 1}/${count} (position ${(
            state.display + 1
          ).toFixed(2)}) · ${Math.round(state.fps)} fps`;
        }
      }
    };

    /** Sizes the canvas to the stage × devicePixelRatio and redraws right away. */
    const resize = () => {
      state.cssWidth = stage.clientWidth;
      state.cssHeight = stage.clientHeight;
      const cap = state.cssWidth < 768 ? MAX_DPR_MOBILE : MAX_DPR;
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      canvas.width = Math.round(state.cssWidth * dpr);
      canvas.height = Math.round(state.cssHeight * dpr);
      layout();
      context.fillStyle = bg;
      context.fillRect(0, 0, canvas.width, canvas.height);
      state.dirty = true;
      render();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

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

    if (debug) (window as unknown as { __seqState?: typeof state }).__seqState = state;
    resize();
    gsap.ticker.add(render);
    window.addEventListener("resize", onResize);

    let tween: gsap.core.Tween | null = null;

    if (reducedMotion) {
      // Static last frame (product + tray), normal page scrolling.
      heroTextRef.current?.setScroll(0);
      indicatorRef.current?.setFrameProgress(1);
      storyRef.current?.update(1, 1);
      hintRef.current?.setScroll(1);
      setCta(true);
    } else {
      const playhead = { progress: 0 };
      const apply = () => {
        const frameProgress = mapProgress(playhead.progress);
        state.position = frameProgress * (count - 1);
        heroTextRef.current?.setScroll(playhead.progress);
        hintRef.current?.setScroll(playhead.progress);
        indicatorRef.current?.setFrameProgress(frameProgress);
        storyRef.current?.update(playhead.progress, frameProgress);
        setCta(frameProgress > CTA_START);
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

      // Restore the right frame immediately when the page is refreshed mid-scroll.
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
      gsap.ticker.remove(render);
      triggerRef.current = null;
      tween?.scrollTrigger?.kill();
      tween?.kill();
    };
  }, [manifest, getFrame, focus, fit, scrub, reducedMotion, debug]);

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
      <div ref={stageRef} className="sticky top-0 h-svh w-full overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

        <HeroText ref={heroTextRef} title={hero.title} subtitle={hero.subtitle} />
        <ProductStory ref={storyRef} products={products} />
        <ProductIndicator ref={indicatorRef} label={hero.productLabel} />
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
