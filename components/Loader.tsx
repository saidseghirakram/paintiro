"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { LOADER_MIN_TIME, LOADER_READY_RATIO } from "@/lib/config";
import { setSiteState, useSiteState } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";
import LoaderMascot, { type LoaderMascotHandle } from "./LoaderMascot";

/** Time (ms) left after 100% for the mascot to reach the end of the line and celebrate. */
const CELEBRATION_TIME = 1700;

type LoaderProps = { line: string };

/**
 * Full-screen red loader (brand color) showing the real 3D product loading progress:
 * the mascot hops along a line and paints it white as the products load.
 * Leaves with a slide-up once LOADER_READY_RATIO of the products are loaded
 * and LOADER_MIN_TIME has passed, then flags the intro as done.
 */
export default function Loader({ line }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<LoaderMascotHandle>(null);
  const displayed = useRef({ value: 0 });
  const leaving = useRef(false);
  const [gone, setGone] = useState(false);
  const progress = useSiteState((s) => s.loadProgress);
  const reducedMotion = useReducedMotion();

  // Animate the counter and the red line towards the real progress.
  useEffect(() => {
    const tween = gsap.to(displayed.current, {
      value: progress * 100,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => {
        const value = displayed.current.value;
        if (counterRef.current) counterRef.current.textContent = String(Math.round(value));
        if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`;
        mascotRef.current?.setProgress(value / 100);
      },
    });
    return () => {
      tween.kill();
    };
  }, [progress]);

  // Leave when enough products are ready and the minimum time has passed.
  useEffect(() => {
    if (leaving.current || progress < LOADER_READY_RATIO) return;

    // performance.now() counts from the start of the page load.
    const wait = Math.max(LOADER_MIN_TIME - performance.now(), reducedMotion ? 0 : CELEBRATION_TIME);
    const timer = window.setTimeout(() => {
      leaving.current = true;
      mascotRef.current?.leave();
      const finish = () => {
        setSiteState({ introDone: true });
        setGone(true);
      };
      if (reducedMotion) {
        finish();
        return;
      }
      gsap.to(rootRef.current, {
        yPercent: -100,
        duration: 1,
        ease: "power4.inOut",
        onStart: () => {
          // Start the intros while the curtain is moving, so the hand-off feels continuous.
          gsap.delayedCall(0.55, () => setSiteState({ introDone: true }));
        },
        onComplete: finish,
      });
    }, wait);

    return () => window.clearTimeout(timer);
  }, [progress, reducedMotion]);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label={line}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red text-white will-change-transform"
    >
      {/* The mascot hops along the line and paints the progress white. */}
      <LoaderMascot ref={mascotRef} reducedMotion={reducedMotion} />
      <div className="pointer-events-none absolute inset-x-0 top-[64%] flex flex-col items-center">
        <p className="font-heading text-[28px] leading-none text-white">{line}</p>
        <p className="tabular mt-6 font-body text-[13px] font-medium tracking-[0.14em] text-white/75">
          <span ref={counterRef}>0</span>%
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/25">
        <div
          ref={barRef}
          className="h-full origin-left bg-white"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}
