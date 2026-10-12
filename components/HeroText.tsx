"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { gsap } from "gsap";
import { HERO_TEXT_FADE_END } from "@/lib/chapters";
import { useSiteState } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type HeroTextHandle = {
  /** Receives the hero scroll progress (0..1) to fade the text out. */
  setScroll: (progress: number) => void;
};

type HeroTextProps = {
  title: string;
  subtitle: string;
  ref?: Ref<HeroTextHandle>;
};

/**
 * Editorial hero title over the first frames.
 * Mobile: centered above the product. Desktop: the frames fill the full height,
 * so the title sits in the empty left column, vertically centered, never on the product.
 * Words are split manually and slide up from their mask after the loader.
 */
export default function HeroText({ title, subtitle, ref }: HeroTextProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const introDone = useSiteState((s) => s.introDone);
  const reducedMotion = useReducedMotion();

  useImperativeHandle(
    ref,
    () => ({
      setScroll(progress: number) {
        const root = rootRef.current;
        if (!root) return;
        const t = Math.min(1, Math.max(0, progress / HERO_TEXT_FADE_END));
        root.style.opacity = String(1 - t);
        root.style.transform = `translate3d(0, ${-40 * t}px, 0)`;
        root.style.visibility = t >= 1 ? "hidden" : "visible";
      },
    }),
    [],
  );

  // Intro: words slide up from 110% with a stagger, then the subtitle fades in.
  useEffect(() => {
    if (!introDone || reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-word",
        // y: 0 clears the CSS translateY(110%) so only yPercent drives the motion.
        { y: 0, yPercent: 110 },
        { y: 0, yPercent: 0, duration: 1, stagger: 0.08, ease: "power4.out" },
      );
      gsap.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.55 },
      );
    }, root);
    return () => ctx.revert();
  }, [introDone, reducedMotion]);

  const words = title.split(" ");

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-x-0 top-[calc(var(--nav-h)+3svh)] z-10 flex flex-col items-center px-5 text-center will-change-transform min-[900px]:right-auto min-[900px]:top-1/2 min-[900px]:w-[min(34vw,560px)] min-[900px]:-translate-y-1/2 min-[900px]:items-start min-[900px]:pl-[var(--nav-px)] min-[900px]:pr-0 min-[900px]:text-left"
    >
      <h1
        aria-label={title}
        className="font-heading text-[clamp(44px,11vw,64px)] min-[900px]:text-[clamp(52px,4.6vw,96px)] font-normal leading-[1.02] text-ink"
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            aria-hidden="true"
            className="inline-block overflow-hidden pb-[0.1em] align-top"
          >
            {/* The last word carries the brand red. */}
            <span className={`hero-word ${i === words.length - 1 ? "text-red" : ""}`}>{word}</span>
            {i < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </h1>
      <p className="hero-subtitle mt-3 max-w-[480px] min-[900px]:mt-6 min-[900px]:max-w-[340px] font-body text-[15px] leading-relaxed text-muted min-[900px]:text-base">
        {subtitle}
      </p>
    </div>
  );
}
