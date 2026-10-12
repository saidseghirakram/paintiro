"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SectionsContent } from "@/lib/content-sections";
import { getSiteState } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Counter from "../ui/Counter";
import Icon from "../ui/Icon";

gsap.registerPlugin(ScrollTrigger);

type AboutProps = {
  content: SectionsContent["about"];
  stats: SectionsContent["why"]["stats"];
};

/** Background / text / accent of each chapter (cycled). */
const THEMES = [
  { bg: "#FFFFFF", fg: "#141414", muted: "rgba(20,20,20,0.6)", accent: "#E8372C", outline: "rgba(20,20,20,0.16)" },
  { bg: "#E8372C", fg: "#FFFFFF", muted: "rgba(255,255,255,0.82)", accent: "#FFFFFF", outline: "rgba(255,255,255,0.35)" },
  { bg: "#141414", fg: "#FFFFFF", muted: "rgba(255,255,255,0.65)", accent: "#E8372C", outline: "rgba(255,255,255,0.18)" },
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 11 — About PAINTIRO, told in three chapters. The section pins; each step of
 * scroll changes the whole room color (white, red, black), the giant chapter word
 * rises letter by letter, the photo wipes in and a giant outlined band slides by.
 */
export default function About({ content, stats }: AboutProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeRef = useRef(0);
  const previousRef = useRef(0);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = useReducedMotion();
  const count = content.chapters.length;

  // Pin + chapter steps + scrolling band.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reducedMotion) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${window.innerHeight * count * 0.9}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
          const index = Math.min(count - 1, Math.floor(self.progress * count));
          if (index !== activeRef.current) {
            previousRef.current = activeRef.current;
            activeRef.current = index;
            setActive(index);
          }
        },
      });
      gsap.fromTo(
        "[data-about-band]",
        { xPercent: 0 },
        {
          xPercent: -35,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top bottom",
            end: () => `+=${window.innerHeight * (count * 0.9 + 1)}`,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        },
      );
    }, stage);
    return () => ctx.revert();
  }, [count, reducedMotion]);

  // Chapter change: room color, letters, sentence and photo.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const theme = THEMES[active % THEMES.length];
    if (reducedMotion) {
      gsap.set(stage, { backgroundColor: theme.bg, color: theme.fg });
      return;
    }
    const previous = previousRef.current;
    const direction = active >= previous ? 1 : -1;
    const ctx = gsap.context(() => {
      gsap.to(stage, { backgroundColor: theme.bg, color: theme.fg, duration: 0.9, ease: "power3.inOut" });
      gsap.fromTo(
        "[data-about-char]",
        { yPercent: 110 * direction, rotation: 6 * direction },
        { yPercent: 0, rotation: 0, duration: 0.9, stagger: 0.035, ease: "power4.out" },
      );
      gsap.fromTo(
        "[data-about-line]",
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "power3.out", delay: 0.15 },
      );
      const photos = stage.querySelectorAll<HTMLElement>("[data-about-photo]");
      photos.forEach((photo, i) => {
        if (i !== active && i !== previous) gsap.set(photo, { clipPath: "inset(100% 0% 0% 0%)" });
      });
      if (previous !== active) {
        gsap.set(photos[previous], { zIndex: 1 });
        gsap.set(photos[active], { zIndex: 2 });
      }
      gsap.fromTo(
        photos[active],
        { clipPath: direction > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power4.inOut" },
      );
      gsap.fromTo(
        photos[active].querySelector("[data-about-photo-img]"),
        { scale: 1.25 },
        { scale: 1, duration: 1.4, ease: "power3.out" },
      );
    }, stage);
    return () => ctx.kill();
  }, [active, reducedMotion]);

  // Film player: lock scroll while open; Escape closes it.
  useEffect(() => {
    if (!playing) return;
    const lenis = getSiteState().lenis;
    const playButton = playRef.current;
    lenis?.stop();
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlaying(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      playButton?.focus({ preventScroll: true });
    };
  }, [playing]);

  const chapter = content.chapters[active];
  const theme = THEMES[active % THEMES.length];
  const band = ["PAINTIRO", ...content.chapters.map((c) => c.word)];

  return (
    <section ref={sectionRef} id="brand" aria-label={content.title} className="relative bg-surface">
      <div
        ref={stageRef}
        className="relative flex h-svh w-full flex-col overflow-hidden"
        style={{ backgroundColor: THEMES[0].bg, color: THEMES[0].fg }}
      >
        {/* Giant outlined band sliding with the scroll */}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[4svh] left-0 whitespace-nowrap">
          <p
            data-about-band
            className="font-heading text-[clamp(90px,15vw,260px)] leading-none"
            style={{ color: "transparent", WebkitTextStroke: `1px ${theme.outline}`, transition: "-webkit-text-stroke-color 0.9s" }}
          >
            {[...band, ...band, ...band].map((word, i) => (
              <span key={i}>
                {word}
                <span className="mx-[0.25em]">—</span>
              </span>
            ))}
          </p>
        </div>

        <div className="relative mx-auto grid h-full w-full max-w-[1600px] grid-rows-[minmax(0,1fr)_auto] gap-6 px-[var(--nav-px)] pb-[18svh] pt-[calc(var(--nav-h)+clamp(8px,2svh,24px))] min-[900px]:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)] min-[900px]:grid-rows-1 min-[900px]:items-center min-[900px]:gap-16 min-[900px]:pb-[14svh]">
          {/* Chapter text */}
          <div className="relative z-10 order-2 min-[900px]:order-1">
            <p className="label tabular flex items-center gap-3" style={{ color: theme.muted }}>
              <span style={{ color: theme.accent }}>11</span>
              <span className="block h-px w-8" style={{ background: theme.accent }} aria-hidden="true" />
              <span>{content.title}</span>
            </p>

            <p className="label tabular mt-6 min-[900px]:mt-12" style={{ color: theme.muted }}>
              <span style={{ color: theme.accent }}>{pad(active + 1)}</span> / {pad(count)}
            </p>

            <h2 aria-label={chapter.word} className="font-heading mt-2 overflow-hidden pb-[0.08em] text-[clamp(64px,11vw,200px)] font-normal leading-[0.95]">
              {chapter.word.split("").map((char, i) => (
                <span key={`${active}-${i}`} data-about-char aria-hidden="true" className="inline-block will-change-transform">
                  {char}
                </span>
              ))}
              <span aria-hidden="true" style={{ color: theme.accent }}>.</span>
            </h2>

            <div className="mt-4 overflow-hidden min-[900px]:mt-6">
              <p data-about-line className="max-w-[460px] text-[16px] leading-relaxed min-[900px]:text-[19px]" style={{ color: theme.muted }}>
                {chapter.text}
              </p>
            </div>

            {/* Progress */}
            <div className="mt-8 flex max-w-[460px] items-center gap-4 min-[900px]:mt-12">
              {content.chapters.map((c, i) => (
                <span
                  key={c.word}
                  className="label tabular text-[10px] transition-opacity duration-500 min-[900px]:text-[11px]"
                  style={{ opacity: i === active ? 1 : 0.45 }}
                >
                  {pad(i + 1)}
                </span>
              ))}
              <span className="relative block h-px flex-1" style={{ background: theme.outline }} aria-hidden="true">
                <span
                  ref={progressRef}
                  className="absolute inset-0 origin-left"
                  style={{ background: theme.accent, transform: "scaleX(0)" }}
                />
              </span>
            </div>
          </div>

          {/* Photos, one per chapter, wiping in */}
          <div className="relative order-1 h-full min-h-0 min-[900px]:order-2 min-[900px]:h-[min(64svh,620px)]">
            {content.chapters.map((c, i) => (
              <div
                key={c.word}
                data-about-photo
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: i === 0 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)", zIndex: i === 0 ? 2 : 1 }}
              >
                <div data-about-photo-img className="absolute inset-0">
                  <Image src={c.image} alt="" fill sizes="(min-width: 900px) 40vw, 90vw" className="object-cover" />
                </div>
                <span className="font-heading tabular absolute left-4 top-3 text-[clamp(40px,4vw,72px)] leading-none text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.25)]">
                  {pad(i + 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Numbers + film */}
      <div className="mx-auto grid max-w-[1600px] gap-10 px-[var(--nav-px)] py-20 min-[900px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] min-[900px]:items-end min-[900px]:py-28">
        <dl className="grid grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="border-t border-ink/15 pt-6">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="font-heading block text-[clamp(44px,6vw,96px)] leading-none text-ink"
                />
                <span className="label mt-3 block text-[10px] text-muted min-[900px]:text-[12px]" aria-hidden="true">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <button
          ref={playRef}
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={content.play}
          className="group relative block aspect-[16/9] w-full overflow-hidden bg-bg text-left"
        >
          <Image
            src="/frames/frame_0001.webp"
            alt=""
            fill
            sizes="(min-width: 900px) 35vw, 100vw"
            className="object-cover transition-transform duration-[1.2s] ease-power3-out group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" aria-hidden="true" />
          <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 text-white">
            <span className="label">{content.film}</span>
            <span className="flex size-14 items-center justify-center rounded-full bg-red transition-transform duration-500 ease-power3-out group-hover:scale-110">
              <Icon name="play" size={20} />
            </span>
          </span>
        </button>
      </div>

      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={content.play}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm min-[900px]:p-12"
          onClick={() => setPlaying(false)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setPlaying(false)}
            aria-label={content.closeVideo}
            className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-red hover:text-white min-[900px]:right-8 min-[900px]:top-8"
          >
            <Icon name="close" size={20} />
          </button>
          <video
            src="/video/paintiro.mp4"
            poster="/frames/frame_0001.webp"
            className="max-h-full w-full max-w-[1400px] bg-black"
            controls
            autoPlay
            playsInline
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
