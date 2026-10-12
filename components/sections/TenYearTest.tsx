"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ExperienceContent } from "@/lib/content-experience";
import { useReducedMotion } from "@/lib/useReducedMotion";
import AnimatedTitle from "../ui/AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

type TenYearTestProps = { content: ExperienceContent["test"] };

const START_YEAR = 2026;
const YEARS = 10;
const FACADE = "/solutions/exterior.webp";

/** Cracks on the "ordinary paint" half (viewBox 0..100 over the whole façade, x < 50). */
const CRACKS = [
  "M6 30 L8 34 L7 39 L9 44 L8.5 50 L10.5 55",
  "M7 39 L5 43 L4.5 48",
  "M20 26 L21 31 L19.5 35 L20.5 41 L19 46",
  "M15 58 L17 61 L16.5 66 L18.5 70 L18 76",
  "M28 34 L29 37 L28.5 43 L30.5 47",
  "M37 55 L38 60 L36.5 64 L38 69 L37 74 L38.5 79",
  "M44 30 L45.5 35 L44.5 38",
];

/** Peeling paint flakes on the left half: left %, top %, size (vw). */
const FLAKES: [number, number, number][] = [
  [9, 47, 3.2], [18, 33, 2.2], [26, 62, 4], [33, 40, 2.6], [40, 68, 3.4], [14, 72, 2.4],
];

/**
 * The 10-year test: one façade cut in two. While the section is pinned the scroll
 * runs the years 2026 → 2036: sun, rain and sand wear down the "ordinary paint"
 * half (it yellows, streaks, cracks and peels) while the PAINTIRO half stays clean.
 */
export default function TenYearTest({ content }: TenYearTestProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const [condition, setCondition] = useState(0);
  const [finished, setFinished] = useState(false);
  const reducedMotion = useReducedMotion();
  const conditions = content.conditions;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reducedMotion) return;
    const ctx = gsap.context(() => {
      const year = { value: START_YEAR };
      gsap.set("[data-crack]", { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set("[data-flake]", { scale: 0, rotation: -20 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.6}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(conditions.length - 1, Math.floor(self.progress * conditions.length));
            setCondition((current) => (current === index ? current : index));
            setFinished(self.progress > 0.92);
          },
        },
      });

      tl.to(year, {
        value: START_YEAR + YEARS,
        duration: 10,
        onUpdate: () => {
          if (yearRef.current) yearRef.current.textContent = String(Math.round(year.value));
        },
      }, 0);

      // Ordinary paint ages.
      tl.to("[data-aged]", { filter: "sepia(0.55) saturate(0.55) brightness(0.86) contrast(0.92)", duration: 9 }, 0.5);
      tl.to("[data-streaks]", { opacity: 0.95, duration: 6 }, 2);
      tl.to("[data-grime]", { opacity: 1, duration: 7 }, 1.5);
      tl.to("[data-crack]", { strokeDashoffset: 0, duration: 2.5, stagger: 0.5 }, 4);
      tl.to("[data-flake]", { scale: 1, rotation: 0, duration: 1.2, stagger: 0.4, ease: "back.out(2)" }, 6);

      // Weather passes over both halves.
      tl.fromTo("[data-sun]", { opacity: 0 }, { opacity: 0.9, duration: 1.2, yoyo: true, repeat: 1 }, 0);
      tl.fromTo("[data-rain]", { opacity: 0 }, { opacity: 0.7, duration: 1.2, yoyo: true, repeat: 1 }, 2.5);
      tl.fromTo("[data-sand]", { opacity: 0 }, { opacity: 0.55, duration: 1.2, yoyo: true, repeat: 1 }, 5);
      tl.fromTo("[data-sun]", { opacity: 0 }, { opacity: 1, duration: 1.2, yoyo: true, repeat: 1 }, 7.5);
    }, stage);
    return () => ctx.revert();
  }, [reducedMotion, conditions.length]);

  const showVerdict = finished || reducedMotion;

  return (
    <section id="ten-year-test" aria-label={content.title} className="relative bg-[#F6F5F2]">
      <div
        ref={stageRef}
        className="relative flex min-h-svh flex-col gap-6 px-[var(--nav-px)] pb-[max(24px,env(safe-area-inset-bottom))] pt-[calc(var(--nav-h)+12px)] min-[900px]:h-svh"
      >
        {/* Header + year */}
        <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div>
            <p className="label flex items-center gap-3 text-muted">
              <span className="block h-px w-8 bg-red" aria-hidden="true" />
              {content.eyebrow}
            </p>
            <AnimatedTitle
              text={content.title}
              className="font-heading mt-4 max-w-[20ch] text-[clamp(32px,4.2vw,68px)] font-normal leading-[1.02]"
            />
          </div>
          <div className="flex items-end gap-6 min-[900px]:flex-col min-[900px]:items-end min-[900px]:gap-3">
            <p className="flex items-baseline gap-3">
              <span className="label text-muted">{content.yearsLabel}</span>
              <span ref={yearRef} className="font-heading tabular text-[clamp(44px,5vw,88px)] leading-none text-red">
                {reducedMotion ? START_YEAR + YEARS : START_YEAR}
              </span>
            </p>
            <ul className="flex flex-wrap gap-2">
              {conditions.map((name, i) => (
                <li
                  key={name}
                  className={`label rounded-full border px-3 py-2 transition-colors duration-500 ${
                    i === condition && !reducedMotion ? "border-red bg-red text-white" : "border-ink/15 text-muted"
                  }`}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* The façade */}
        <div className="relative min-h-[52svh] flex-1 overflow-hidden rounded-[6px] bg-ink">
          <Image src={FACADE} alt="" fill sizes="100vw" className="object-cover" />

          {/* Left half: ordinary paint */}
          <div className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
            <div data-aged className="absolute inset-0" style={reducedMotion ? { filter: "sepia(0.55) saturate(0.55) brightness(0.86) contrast(0.92)" } : undefined}>
              <Image src={FACADE} alt="" fill sizes="100vw" className="object-cover" />
            </div>
            <div
              data-streaks
              className="absolute inset-0 mix-blend-multiply"
              style={{
                opacity: reducedMotion ? 0.95 : 0,
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent 0 21px, rgba(96,74,44,0.28) 21px 24px, transparent 24px 38px, rgba(96,74,44,0.16) 38px 40px, transparent 40px 61px)",
                maskImage: "linear-gradient(to bottom, transparent 18%, black 30%, transparent 62%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 18%, black 30%, transparent 62%)",
              }}
            />
            <div
              data-grime
              className="absolute inset-0 mix-blend-multiply"
              style={{
                opacity: reducedMotion ? 1 : 0,
                background:
                  "radial-gradient(60% 40% at 30% 85%, rgba(70,58,40,0.45), transparent 70%), radial-gradient(40% 30% at 70% 45%, rgba(110,96,70,0.25), transparent 70%)",
              }}
            />
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
              {CRACKS.map((d) => (
                <path
                  key={d}
                  data-crack
                  d={d}
                  pathLength={1}
                  fill="none"
                  stroke="rgba(40,32,24,0.85)"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
            {FLAKES.map(([left, top, size]) => (
              <span
                key={`${left}-${top}`}
                data-flake
                aria-hidden="true"
                className="absolute block"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}vw`,
                  height: `${size * 0.7}vw`,
                  background: "#cfc6b4",
                  borderRadius: "42% 58% 36% 64% / 55% 38% 62% 45%",
                  boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.25), 2px 4px 6px rgba(0,0,0,0.2)",
                }}
              />
            ))}
          </div>

          {/* Weather layers (both halves) */}
          {!reducedMotion && (
            <>
              <div
                data-sun
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen"
                style={{ background: "radial-gradient(50% 60% at 85% 0%, rgba(255,214,140,0.9), transparent 70%)" }}
              />
              <div
                data-rain
                aria-hidden="true"
                className="weather-rain pointer-events-none absolute inset-0 opacity-0"
              />
              <div
                data-sand
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-multiply"
                style={{ background: "linear-gradient(100deg, rgba(214,160,92,0.9), rgba(214,160,92,0.35) 60%, transparent)" }}
              />
            </>
          )}

          {/* Divider + labels */}
          <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-white" />
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[11px] font-medium tracking-[0.1em] text-ink">
            VS
          </div>
          <p className="label absolute bottom-4 left-4 bg-ink/75 px-3 py-2 text-white backdrop-blur-sm">{content.ordinary}</p>
          <p className="label absolute bottom-4 right-4 bg-red px-3 py-2 text-white">{content.paintiro}</p>

          {/* Verdict */}
          <div
            className="pointer-events-none absolute inset-x-0 top-6 flex justify-center px-4 transition-[opacity,transform] duration-700 ease-power3-out"
            style={{ opacity: showVerdict ? 1 : 0, transform: `translateY(${showVerdict ? 0 : -12}px)` }}
          >
            <p className="font-heading bg-white/90 px-5 py-3 text-center text-[clamp(20px,2vw,30px)] leading-tight text-ink backdrop-blur-sm">
              {content.verdict}
            </p>
          </div>
        </div>

        <p className="text-[14px] text-muted">{content.text}</p>
      </div>
    </section>
  );
}
