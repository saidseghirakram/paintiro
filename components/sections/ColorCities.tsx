"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SWATCHES } from "@/lib/colors";
import type { Locale } from "@/lib/content";
import type { ExperienceContent } from "@/lib/content-experience";
import { scrollToTarget } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

type ColorCitiesProps = { content: ExperienceContent["cities"]; locale: Locale };

/** Palette of each city (PAINTIRO codes from lib/colors.ts); the first one paints the panel. */
const PALETTES = [
  ["PT-101", "PT-401", "PT-403", "PT-402"],
  ["PT-201", "PT-202", "PT-602", "PT-204"],
  ["PT-302", "PT-301", "PT-304", "PT-303"],
  ["PT-502", "PT-503", "PT-504", "PT-501"],
  ["PT-204", "PT-604", "PT-603", "PT-202"],
];

const pad = (n: number) => String(n).padStart(2, "0");

function swatch(code: string) {
  const found = SWATCHES.find((s) => s.code === code);
  if (!found) throw new Error(`Unknown swatch ${code}`);
  return found;
}

function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 150;
}

/** Architecture silhouette of each city, drawn with the palette (viewBox 0 0 800 400). */
function Skyline({ index, colors }: { index: number; colors: string[] }): ReactNode {
  const [, a, b, c] = colors;
  switch (index) {
    case 0: {
      // Algiers: the Casbah stepping down to the sea.
      const blocks: [number, number, number, number][] = [
        [40, 250, 110, 150], [130, 210, 90, 190], [200, 170, 120, 230], [300, 130, 100, 270],
        [380, 180, 130, 220], [490, 220, 90, 180], [560, 260, 120, 140], [660, 300, 140, 100],
      ];
      return (
        <>
          <rect x="0" y="360" width="800" height="40" fill={c} />
          {blocks.map(([x, y, w, h], i) => (
            <g key={x}>
              <rect x={x} y={y} width={w} height={h} fill={i % 2 ? "#FFFFFF" : "#F2EEE3"} />
              <path d={`M${x + w / 2 - 12} ${y + 70} v-20 a12 12 0 0 1 24 0 v20 Z`} fill={a} />
              <rect x={x + 14} y={y + 20} width="14" height="14" fill={b} />
            </g>
          ))}
        </>
      );
    }
    case 1:
      // Ghardaïa: cubes around the pyramid minaret.
      return (
        <>
          {[[0, 280, 160], [140, 240, 140], [270, 300, 120], [450, 260, 150], [580, 300, 220]].map(([x, y, w]) => (
            <rect key={x} x={x} y={y} width={w} height={400 - y} fill={a} />
          ))}
          <path d="M350 400 L370 90 H430 L450 400 Z" fill={b} />
          {[372, 392, 412].map((x) => (
            <path key={x} d={`M${x} 90 v-26 h12 v26`} fill={b} />
          ))}
          <rect x="390" y="150" width="20" height="26" fill={c} />
          {[[40, 320], [190, 280], [500, 300], [650, 340]].map(([x, y]) => (
            <rect key={x} x={x} y={y} width="18" height="22" fill={c} />
          ))}
        </>
      );
    case 2:
      // Constantine: the suspension bridge over the gorge.
      return (
        <>
          <path d="M0 160 L120 170 L170 400 H0 Z" fill={c} />
          <path d="M800 140 L680 160 L630 400 H800 Z" fill={c} />
          <rect x="120" y="190" width="560" height="12" fill={a} />
          <path d="M150 190 V60 M650 190 V60" stroke={b} strokeWidth="14" />
          <path d="M150 60 Q400 230 650 60" fill="none" stroke={b} strokeWidth="5" />
          {Array.from({ length: 15 }, (_, i) => {
            // Hangers from the cable (quadratic curve above) down to the deck.
            const x = 180 + i * 31;
            const t = (x - 150) / 500;
            return <line key={x} x1={x} y1={60 + 340 * t * (1 - t)} x2={x} y2="190" stroke={b} strokeWidth="2" />;
          })}
        </>
      );
    case 3:
      // Tlemcen: an arcade of horseshoe arches.
      return (
        <>
          <rect x="0" y="120" width="800" height="280" fill={a} />
          <rect x="0" y="100" width="800" height="24" fill={c} />
          {[60, 230, 400, 570].map((x) => (
            <path key={x} d={`M${x + 20} 400 V250 a65 65 0 1 1 130 0 V400 Z`} fill={b} />
          ))}
        </>
      );
    default:
      // Sahara: dunes under a low sun.
      return (
        <>
          <circle cx="600" cy="140" r="60" fill={a} />
          <path d="M0 260 Q200 170 400 250 T800 230 V400 H0 Z" fill={a} />
          <path d="M0 310 Q250 230 480 300 T800 290 V400 H0 Z" fill={b} />
          <path d="M0 360 Q300 310 560 360 T800 350 V400 H0 Z" fill={c} />
        </>
      );
  }
}

/**
 * "Algeria in color": the section pins and travels sideways through five cities.
 * Each panel is painted with its city's palette, the city name slides with
 * parallax and the four PAINTIRO shades pop in as the panel arrives.
 */
export default function ColorCities({ content, locale }: ColorCitiesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || reducedMotion) return;
    const ctx = gsap.context(() => {
      const distance = () => track.scrollWidth - window.innerWidth;
      const travel = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-city]").forEach((panel) => {
        const name = panel.querySelector("[data-city-name]");
        const skyline = panel.querySelector("[data-city-skyline]");
        const chips = panel.querySelectorAll("[data-city-chip]");
        gsap.fromTo(name, { xPercent: 18 }, {
          xPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: panel, containerAnimation: travel, start: "left right", end: "right left", scrub: true },
        });
        gsap.fromTo(skyline, { xPercent: -10, yPercent: 12 }, {
          xPercent: 10,
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: panel, containerAnimation: travel, start: "left right", end: "right left", scrub: true },
        });
        gsap.from(chips, {
          y: 40,
          scale: 0.7,
          opacity: 0,
          stagger: 0.08,
          duration: 0.8,
          ease: "back.out(1.8)",
          scrollTrigger: { trigger: panel, containerAnimation: travel, start: "left 60%", toggleActions: "play none none reverse" },
        });
      });
    }, section);
    return () => ctx.revert();
  }, [reducedMotion]);

  const onCta = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToTarget("#visualizer");
  };

  return (
    <section ref={sectionRef} id="algeria-colors" aria-label={content.title} className="relative overflow-hidden">
      <div
        ref={trackRef}
        className={reducedMotion ? "flex flex-col" : "flex h-svh w-max will-change-transform"}
      >
        {/* Intro panel */}
        <div className="flex h-svh w-screen shrink-0 flex-col justify-center bg-surface px-[var(--nav-px)] min-[900px]:w-[60vw]">
          <p className="label flex items-center gap-3 text-muted">
            <span className="block h-px w-8 bg-red" aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h2 className="font-heading mt-5 max-w-[12ch] text-[clamp(44px,6vw,104px)] font-normal leading-[0.98]">
            {content.title}
          </h2>
          <p className="mt-6 max-w-[36ch] text-[15px] leading-relaxed text-muted">{content.intro}</p>
          <div className="mt-10 flex gap-1.5" aria-hidden="true">
            {PALETTES.map((palette) => (
              <span key={palette[0]} className="block h-10 w-10 rounded-full" style={{ background: swatch(palette[0]).hex }} />
            ))}
          </div>
        </div>

        {content.items.map((item, i) => {
          const colors = PALETTES[i % PALETTES.length].map((code) => swatch(code));
          const bg = colors[0].hex;
          const dark = isDark(bg);
          const fg = dark ? "#FFFFFF" : "#141414";
          return (
            <article
              key={item.city}
              data-city
              className="relative flex h-svh w-screen shrink-0 flex-col overflow-hidden px-[var(--nav-px)] pt-[calc(var(--nav-h)+20px)]"
              style={{ background: bg, color: fg }}
            >
              <p className="label tabular relative z-10" style={{ opacity: 0.7 }}>
                {pad(i + 1)} / {pad(content.items.length)}
              </p>
              <h3
                data-city-name
                className="font-heading relative z-10 mt-2 whitespace-nowrap text-[clamp(72px,14vw,240px)] font-normal leading-[0.9]"
              >
                {item.city}
              </h3>
              <p className="relative z-10 mt-4 max-w-[34ch] text-[15px] leading-relaxed min-[900px]:text-[17px]" style={{ opacity: 0.8 }}>
                {item.line}
              </p>

              <ul className="relative z-10 mt-8 flex flex-wrap gap-3">
                {colors.map((color) => (
                  <li
                    key={color.code}
                    data-city-chip
                    className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4"
                    style={{ background: dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.6)" }}
                  >
                    <span
                      className="block h-9 w-9 rounded-full"
                      style={{ background: color.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }}
                    />
                    <span className="flex flex-col">
                      <span className="text-[13px] font-medium leading-tight">{color.name[locale]}</span>
                      <span className="label text-[10px]! tabular" style={{ opacity: 0.6 }}>{color.code}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#visualizer"
                onClick={onCta}
                className="label link-underline relative z-10 mt-8 self-start"
              >
                {content.cta} →
              </a>

              <svg
                data-city-skyline
                viewBox="0 0 800 400"
                preserveAspectRatio="xMidYMax meet"
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-[46svh] w-full min-[900px]:h-[58svh] min-[900px]:w-[70vw]"
              >
                <Skyline index={i} colors={colors.map((color) => color.hex)} />
              </svg>
            </article>
          );
        })}
      </div>

      {!reducedMotion && (
        <div className="pointer-events-none absolute inset-x-[var(--nav-px)] bottom-6 z-20 h-px bg-ink/15">
          <div ref={barRef} className="h-full origin-left bg-red" style={{ transform: "scaleX(0)" }} />
        </div>
      )}
    </section>
  );
}
