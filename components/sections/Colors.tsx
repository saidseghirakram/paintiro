"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COLOR_FAMILIES, SWATCHES, type ColorFamilyKey } from "@/lib/colors";
import type { Locale } from "@/lib/content";
import type { SectionsContent } from "@/lib/content-sections";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Icon from "../ui/Icon";

gsap.registerPlugin(ScrollTrigger);

type ColorsProps = { content: SectionsContent["colors"]; locale: Locale };

/** Section color before the first flood. */
const START_BG = "#F6F5F2";
const RED = "#E8372C";
/** Card shown lifted when the deck opens (PAINTIRO red floods the section). */
const DEFAULT_INDEX = Math.max(0, SWATCHES.findIndex((s) => s.code === "PT-601"));

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Readable text color (ink or white) on top of a color. */
function textOn(hex: string): string {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#141414" : "#ffffff";
}

/** True when the color is close to the brand red (red accents would disappear on it). */
function isNearRed(hex: string): boolean {
  const [r, g, b] = rgb(hex);
  const [R, G, B] = rgb(RED);
  return Math.hypot(r - R, g - G, b - B) < 110;
}

/** Fan angle of card i (degrees), wider on large screens. */
function fanAngle(i: number, count: number): number {
  const spread = window.innerWidth < 900 ? 100 : 150;
  return -spread / 2 + (i * spread) / (count - 1);
}

/**
 * 08 — Colors that inspire. A 3D PAINTIRO fan deck: on scroll the deck rises and
 * fans open card by card (pinned, scrubbed), then PAINTIRO red floods out of the
 * deck until it covers the whole section at the end of the pin. Picking a card
 * (found from the pointer angle around the rivet, so every card is easy to hit)
 * lifts it out of the deck and floods the section with its color.
 */
export default function Colors({ content, locale }: ColorsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const redRef = useRef<HTMLDivElement>(null);
  const rivetRef = useRef<HTMLSpanElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const armsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedRef = useRef(DEFAULT_INDEX);
  /** True once the visitor picked a color: the scroll flood no longer applies. */
  const pickedRef = useRef(false);
  const firstInfo = useRef(true);

  const [selected, setSelected] = useState(DEFAULT_INDEX);
  const [hovered, setHovered] = useState<number | null>(null);
  const [background, setBackground] = useState(START_BG);
  const [foreground, setForeground] = useState(textOn(START_BG));
  /** The scroll-driven red flood covers (most of) the section. */
  const [redCovers, setRedCovers] = useState(false);
  const [picked, setPicked] = useState(false);
  const [copied, setCopied] = useState(false);
  const reducedMotion = useReducedMotion();
  const count = SWATCHES.length;

  /** Floods the section with a swatch color, growing a circle from its card. */
  const flood = useCallback(
    (index: number, animate = true) => {
      const section = sectionRef.current;
      const overlay = overlayRef.current;
      const card = cardsRef.current[index];
      if (!section || !overlay || !card) return;
      const color = SWATCHES[index].hex;
      const s = section.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const x = c.left + c.width / 2 - s.left;
      const y = c.top + c.height * 0.35 - s.top;
      const radius = Math.hypot(Math.max(x, s.width - x), Math.max(y, s.height - y));

      gsap.killTweensOf(overlay);
      overlay.style.background = color;
      const finish = () => {
        setBackground(color);
        if (redRef.current) redRef.current.style.visibility = "hidden";
        gsap.set(overlay, { clipPath: `circle(0px at ${x}px ${y}px)` });
      };
      if (!animate || reducedMotion) {
        setForeground(textOn(color));
        finish();
        return;
      }
      gsap.fromTo(
        overlay,
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${radius}px at ${x}px ${y}px)`, duration: 1.1, ease: "power3.inOut", onComplete: finish },
      );
      // Text color switches while the paint passes under it.
      gsap.delayedCall(0.45, () => setForeground(textOn(color)));
    },
    [reducedMotion],
  );

  const select = useCallback(
    (index: number, focus = false) => {
      const next = (index + count) % count;
      if (focus) cardsRef.current[next]?.focus({ preventScroll: true });
      if (next === selectedRef.current && pickedRef.current) return;
      pickedRef.current = true;
      setPicked(true);
      selectedRef.current = next;
      setSelected(next);
      flood(next);
    },
    [count, flood],
  );

  // Scroll: the deck rises from a tilted, closed stack and fans open (pinned).
  useEffect(() => {
    const section = sectionRef.current;
    const deck = deckRef.current;
    if (!section || !deck) return;
    const arms = armsRef.current.filter(Boolean) as HTMLDivElement[];

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(arms, { rotation: (i: number) => fanAngle(i, count) });
        gsap.set(redRef.current, { clipPath: "none" });
        setRedCovers(true);
        return;
      }

      // PAINTIRO red grows from the rivet; full radius = farthest section corner.
      const red = redRef.current;
      const paint = { p: 0 };
      const drawRed = () => {
        const rivet = rivetRef.current;
        if (!red || !rivet) return;
        const s = section.getBoundingClientRect();
        const c = rivet.getBoundingClientRect();
        const x = c.left + c.width / 2 - s.left;
        const y = c.top + c.height / 2 - s.top;
        const radius = Math.hypot(Math.max(x, s.width - x), Math.max(y, s.height - y)) + 2;
        red.style.clipPath = paint.p >= 1 ? "none" : `circle(${radius * paint.p}px at ${x}px ${y}px)`;
        const covers = paint.p > 0.45;
        setRedCovers((current) => (current === covers ? current : covers));
      };

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=170%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: drawRed,
        },
      });
      timeline
        .fromTo(
          deck,
          { rotationX: 62, yPercent: 22, scale: 0.8 },
          { rotationX: 10, yPercent: 0, scale: 1, duration: 1, ease: "power2.out" },
          0,
        )
        .fromTo(
          arms,
          { rotation: 0 },
          { rotation: (i: number) => fanAngle(i, count), duration: 0.9, stagger: 0.012, ease: "power3.out" },
          0.1,
        )
        .fromTo(
          "[data-colors-line]",
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" },
          0,
        )
        // Fully open: red floods out of the deck and reaches every corner before the pin ends.
        .to(paint, { p: 1, duration: 0.75, ease: "power2.in", onUpdate: drawRed }, 1.3)
        .to({}, { duration: 0.15 });
    }, section);

    return () => ctx.revert();
  }, [count, reducedMotion]);

  // Selected card lifts out of the deck (along its own axis), hovered card peeks.
  useEffect(() => {
    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      const lift = card.offsetHeight * (i === selected ? 0.17 : i === hovered ? 0.07 : 0);
      gsap.to(card, {
        y: -lift,
        z: i === selected ? 90 : 0,
        scale: i === selected ? 1.06 : 1,
        duration: reducedMotion ? 0 : 0.6,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }, [selected, hovered, reducedMotion]);

  // Mouse: the whole deck tilts gently in 3D.
  useEffect(() => {
    const section = sectionRef.current;
    const tilt = tiltRef.current;
    if (!section || !tilt || reducedMotion) return;
    const rotateY = gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "power3.out" });
    const rotateX = gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "power3.out" });
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const r = section.getBoundingClientRect();
      rotateY(((event.clientX - r.left) / r.width - 0.5) * 16);
      rotateX(((event.clientY - r.top) / r.height - 0.5) * -8);
    };
    const onLeave = () => {
      rotateY(0);
      rotateX(0);
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [reducedMotion]);

  // Selected color info slides in on change.
  useLayoutEffect(() => {
    if (firstInfo.current) {
      firstInfo.current = false;
      return;
    }
    const info = infoRef.current;
    if (!info || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-color-swap]",
        { yPercent: 105, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: "power3.out" },
      );
    }, info);
    return () => ctx.revert();
  }, [selected, reducedMotion]);

  /**
   * The card under the pointer, from its angle around the rivet: the fanned cards
   * overlap heavily, so hit-testing the card elements leaves only slivers to aim at.
   */
  const cardAt = (clientX: number, clientY: number): number | null => {
    const rivet = rivetRef.current;
    const deck = deckRef.current;
    if (!rivet || !deck) return null;
    const c = rivet.getBoundingClientRect();
    const dx = clientX - (c.left + c.width / 2);
    const dy = clientY - (c.top + c.height / 2);
    const reach = deck.offsetHeight;
    const distance = Math.hypot(dx, dy);
    if (distance < reach * 0.1 || distance > reach * 1.2 || dy > reach * 0.1) return null;
    const angle = Math.atan2(dx, -dy);
    // Compare with where each card tip really is on screen (the deck is tilted in 3D).
    let best: number | null = null;
    let bestGap = Infinity;
    cardsRef.current.forEach((card, i) => {
      const tip = card?.querySelector("[data-tip]")?.getBoundingClientRect();
      if (!tip) return;
      const gap = Math.abs(Math.atan2(tip.left - c.left - c.width / 2, c.top + c.height / 2 - tip.top) - angle);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    });
    return bestGap < 0.2 ? best : null;
  };

  const onFanMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const index = cardAt(event.clientX, event.clientY);
    setHovered((current) => (current === index ? current : index));
  };

  const onFanClick = (event: MouseEvent<HTMLDivElement>) => {
    // Keyboard "clicks" (Enter/Space on a focused card) have no pointer position: the card handles them.
    if (event.detail === 0) return;
    const index = cardAt(event.clientX, event.clientY);
    if (index !== null) select(index);
  };

  const onDeckKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      select(selectedRef.current + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(selectedRef.current - 1, true);
    }
  };

  const copyCode = async () => {
    const swatch = SWATCHES[selected];
    try {
      await navigator.clipboard.writeText(`${swatch.code} ${swatch.hex.toUpperCase()}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const swatch = SWATCHES[selected];
  // Before any pick, the visible surface is the scroll flood (red) or the start color.
  const surface = picked ? background : redCovers ? RED : START_BG;
  const ink = picked ? foreground : textOn(surface);
  const accent = isNearRed(surface) ? ink : RED;
  const activeFamily: ColorFamilyKey = swatch.family;

  return (
    <section
      ref={sectionRef}
      id="colors"
      aria-label={content.title}
      className="relative h-svh overflow-hidden transition-[color] duration-500"
      style={{ background, color: ink }}
    >
      {/* Scroll flood: PAINTIRO red, revealed from the rivet */}
      <div
        ref={redRef}
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{ background: RED, clipPath: "circle(0px at 50% 100%)" }}
      />
      {/* Paint flood layer (picked color) */}
      <div ref={overlayRef} aria-hidden="true" className="absolute inset-0 z-0" style={{ clipPath: "circle(0px at 50% 50%)" }} />

      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col px-[var(--nav-px)] pt-[calc(var(--nav-h)+clamp(8px,2svh,24px))]">
        {/* Top: title (left) and selected color (right) */}
        <div className="flex flex-col gap-5 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between">
          <div className="max-w-[520px]">
            <div className="overflow-hidden">
              <p data-colors-line className="label tabular flex items-center gap-3 opacity-80">
                <span style={{ color: accent }}>08</span>
                <span className="block h-px w-8" style={{ background: accent }} aria-hidden="true" />
                <span>{content.eyebrow}</span>
              </p>
            </div>
            <div className="mt-3 overflow-hidden pb-[0.06em] min-[900px]:mt-5">
              <h2
                data-colors-line
                className="font-heading text-[clamp(38px,5.4vw,92px)] font-normal leading-[1.0]"
              >
                {content.title}
              </h2>
            </div>
            <div className="mt-3 hidden overflow-hidden min-[600px]:block min-[900px]:mt-5">
              <p data-colors-line className="max-w-[380px] text-[15px] leading-relaxed opacity-75">
                {content.intro}
              </p>
            </div>
          </div>

          <div ref={infoRef} className="min-[900px]:max-w-[380px] min-[900px]:text-right">
            <p className="label opacity-70">{content.selected}</p>
            <div className="mt-2 overflow-hidden pb-[0.06em] min-[900px]:mt-3">
              <p data-color-swap className="font-heading text-[clamp(30px,3.6vw,60px)] leading-none">
                {swatch.name[locale]}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-4 overflow-hidden min-[900px]:mt-3 min-[900px]:justify-end">
              <p data-color-swap className="label tabular opacity-75">
                {swatch.code} · {swatch.hex.toUpperCase()} · {content.familyNames[swatch.family]}
              </p>
              <button
                type="button"
                onClick={copyCode}
                className="label inline-flex items-center gap-1.5 text-[10px] underline-offset-4 opacity-80 transition-opacity hover:underline hover:opacity-100 min-[900px]:text-[10px]"
              >
                {copied ? content.copied : content.copy}
              </button>
            </div>

            {/* Families */}
            <div
              role="group"
              aria-label={content.families}
              className="-mx-[var(--nav-px)] mt-4 flex gap-2 overflow-x-auto px-[var(--nav-px)] [scrollbar-width:none] min-[900px]:mx-0 min-[900px]:mt-6 min-[900px]:flex-wrap min-[900px]:justify-end min-[900px]:overflow-visible min-[900px]:px-0"
            >
              {COLOR_FAMILIES.map((family) => (
                <button
                  key={family.key}
                  type="button"
                  aria-pressed={activeFamily === family.key}
                  onClick={() => select(SWATCHES.findIndex((s) => s.family === family.key))}
                  className={`label flex shrink-0 items-center gap-2 border px-3 py-2 text-[10px] transition-opacity duration-300 min-[900px]:text-[10px] ${
                    activeFamily === family.key ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{ borderColor: "currentColor" }}
                >
                  <span className="block size-2.5 rounded-full border border-black/10" style={{ background: family.hex }} />
                  {content.familyNames[family.key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: the 3D fan deck */}
        <div
          className="relative flex flex-1 items-end justify-center [perspective:1600px]"
          style={{ cursor: hovered === null ? undefined : "pointer" }}
          onPointerMove={onFanMove}
          onPointerLeave={() => setHovered(null)}
          onClick={onFanClick}
        >
          <div ref={tiltRef} className="relative [transform-style:preserve-3d]">
            <div
              ref={deckRef}
              role="group"
              aria-label={content.title}
              onKeyDown={onDeckKey}
              className="relative h-[calc(var(--card-h)*1.04)] w-[calc(var(--card-h)*0.27)] origin-bottom [--card-h:min(38svh,300px)] [transform-style:preserve-3d] min-[900px]:[--card-h:min(54svh,460px)]"
            >
              {SWATCHES.map((s, i) => (
                <div
                  key={s.code}
                  ref={(el) => {
                    armsRef.current[i] = el;
                  }}
                  className="absolute bottom-0 left-0 h-[var(--card-h)] w-full origin-[50%_92%] [transform-style:preserve-3d]"
                  style={{ zIndex: i }}
                >
                  <button
                    ref={(el) => {
                      cardsRef.current[i] = el;
                    }}
                    type="button"
                    onClick={(e) => e.detail === 0 && select(i)}
                    aria-pressed={i === selected}
                    aria-label={`${s.name[locale]} ${s.code}`}
                    tabIndex={i === selected ? 0 : -1}
                    className="pointer-events-none absolute inset-0 flex flex-col overflow-hidden rounded-[3px] bg-white p-[3px] text-left shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_10px_24px_-14px_rgba(0,0,0,0.45)] outline-offset-4"
                  >
                    <span className="block flex-1 rounded-[2px]" style={{ background: s.hex }} />
                    <span className="block px-2 pb-3 pt-2 text-ink">
                      <span className="block truncate text-[9px] font-medium uppercase tracking-[0.12em] min-[900px]:text-[10px]">
                        {s.name[locale]}
                      </span>
                      <span className="tabular mt-1 block text-[9px] text-muted">{s.code}</span>
                    </span>
                    {/* Top-center marker, used to find the card from the pointer angle */}
                    <span data-tip className="absolute left-1/2 top-0 block size-0" />
                    {/* Pivot hole of the fan deck */}
                    <span className="absolute bottom-[6%] left-1/2 block size-2 -translate-x-1/2 rounded-full bg-ink/20" />
                  </button>
                </div>
              ))}
              {/* Rivet */}
              <span
                ref={rivetRef}
                aria-hidden="true"
                className="absolute bottom-[calc(var(--card-h)*0.08-8px)] left-1/2 z-[60] block size-4 -translate-x-1/2 rounded-full border-2 border-white bg-ink shadow"
                style={{ transform: "translateZ(120px)" }}
              />
            </div>
          </div>
        </div>

        {/* Hint + CTA */}
        <div className="relative flex items-center justify-between gap-4 py-[clamp(12px,2.5svh,28px)]">
          {/* Keyboard hint only where there is a keyboard. */}
          <p className="label hidden text-[11px] opacity-70 min-[900px]:block">{content.hint}</p>
          <span className="min-[900px]:hidden" aria-hidden="true" />
          <a
            href="#contact"
            className="label inline-flex items-center gap-3 border px-4 py-3 transition-opacity hover:opacity-70 min-[900px]:px-5"
            style={{ borderColor: "currentColor" }}
          >
            {content.explore}
            <Icon name="arrow" size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
