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

/**
 * Weathering of the "ordinary paint" half, baked onto the painted walls of the photo
 * by scripts/build-weathering.mjs (same size as the photo, so they line up exactly).
 * [layer, start, duration] on the 10-year timeline.
 */
const WEAR: [string, number, number][] = [
  ["faded", 0.4, 8.5],
  ["streaks", 2, 7],
  ["cracks", 4, 4],
  ["peeling", 6.2, 3],
];

/**
 * The 10-year test: one façade cut in two. While the section is pinned the scroll
 * runs the years 2026 → 2036: sun, rain and sand wear down the "ordinary paint"
 * half (it fades, streaks, cracks and peels) while the PAINTIRO half stays clean.
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
      gsap.set("[data-wear]", { opacity: 0 });

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
      for (const [name, start, duration] of WEAR) {
        tl.to(`[data-wear="${name}"]`, { opacity: 1, duration, ease: "power1.in" }, start);
      }

      // Weather passes over both halves.
      tl.fromTo("[data-sun]", { opacity: 0 }, { opacity: 0.85, duration: 1.2, yoyo: true, repeat: 1 }, 0);
      tl.fromTo("[data-rain]", { opacity: 0 }, { opacity: 1, duration: 1.2, yoyo: true, repeat: 1 }, 2.5);
      tl.fromTo("[data-sand]", { opacity: 0 }, { opacity: 1, duration: 1.2, yoyo: true, repeat: 1 }, 5);
      tl.fromTo("[data-heat]", { opacity: 0 }, { opacity: 1, duration: 1.2, yoyo: true, repeat: 1 }, 7.5);
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

          {/* Left half: ordinary paint, weathering on the painted walls only */}
          <div className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
            {WEAR.map(([name]) => (
              <div key={name} data-wear={name} className="absolute inset-0" style={reducedMotion ? undefined : { opacity: 0 }}>
                <Image src={`/ten-year/${name}.webp`} alt="" fill sizes="100vw" className="object-cover" />
              </div>
            ))}
          </div>

          {/* Weather layers (both halves) */}
          {!reducedMotion && (
            <>
              <div
                data-sun
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light"
                style={{ background: "radial-gradient(70% 90% at 92% -10%, rgba(255,226,170,1), rgba(255,200,120,0.55) 45%, transparent 75%)" }}
              />
              <div data-rain aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0">
                <div className="absolute inset-0 bg-[#3a4656]/35 mix-blend-multiply" />
                <div className="weather-rain absolute inset-0" />
              </div>
              <div data-sand aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0">
                <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(201,150,90,0.55),rgba(214,170,112,0.32)_55%,rgba(214,170,112,0.18))]" />
                <div className="weather-sand absolute inset-0" />
              </div>
              <div
                data-heat
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light"
                style={{ background: "radial-gradient(90% 100% at 80% 0%, rgba(255,190,110,1), rgba(255,150,70,0.6) 50%, rgba(255,140,60,0.3))" }}
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
