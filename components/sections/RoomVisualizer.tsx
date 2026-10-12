"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SWATCHES } from "@/lib/colors";
import type { Locale } from "@/lib/content";
import type { SectionsContent } from "@/lib/content-sections";
import { ROOMS, VISUALIZER_CODES, type Room } from "@/lib/rooms";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Icon from "../ui/Icon";

gsap.registerPlugin(ScrollTrigger);

type RoomVisualizerProps = { content: SectionsContent["visualizer"]; locale: Locale };
type Finish = "matte" | "satin" | "gloss";

const PALETTE = VISUALIZER_CODES.map((code) => SWATCHES.find((s) => s.code === code)).filter(
  (s): s is (typeof SWATCHES)[number] => Boolean(s),
);
const DEFAULT_COLOR = PALETTE.find((s) => s.code === "PT-404") ?? PALETTE[0];

/** CSS that masks a layer to the wall of a room (aligned with the cover-fitted photo). */
function wallMask(room: Room): CSSProperties {
  return {
    maskImage: `url(${room.mask})`,
    WebkitMaskImage: `url(${room.mask})`,
    maskSize: "cover",
    WebkitMaskSize: "cover",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  };
}

const photo = (room: Room): CSSProperties => ({
  backgroundImage: `url(${room.image})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
});

/**
 * Room color visualizer. The right side of the slider shows the room repainted:
 * the wall (from a precomputed mask) is neutralised to grey, then tinted with the
 * chosen color in multiply mode so the light and shadows of the photo stay real.
 * Finish adds a soft (satin) or stronger (gloss) sheen. Drag to compare.
 */
export default function RoomVisualizer({ content, locale }: RoomVisualizerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(50);
  const draggingRef = useRef(false);

  const [roomIndex, setRoomIndex] = useState(0);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [finish, setFinish] = useState<Finish>("matte");
  const reducedMotion = useReducedMotion();
  const room = ROOMS[roomIndex];

  /** Moves the before/after split (percent of the stage width). */
  const setPosition = useCallback((percent: number) => {
    const p = Math.min(100, Math.max(0, percent));
    positionRef.current = p;
    if (afterRef.current) afterRef.current.style.clipPath = `inset(0 0 0 ${p}%)`;
    if (handleRef.current) {
      handleRef.current.style.left = `${p}%`;
      handleRef.current.setAttribute("aria-valuenow", String(Math.round(p)));
    }
  }, []);

  // Intro: the paint sweeps across the room when the section comes into view.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (reducedMotion) {
      setPosition(50);
      return;
    }
    setPosition(96);
    const state = { p: 96 };
    const ctx = gsap.context(() => {
      gsap.to(state, {
        p: 50,
        duration: 1.8,
        ease: "power3.inOut",
        onUpdate: () => setPosition(state.p),
        scrollTrigger: { trigger: stageRef.current, start: "top 70%", once: true },
      });
      gsap.from("[data-viz-line]", {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
    }, section);
    return () => ctx.revert();
  }, [reducedMotion, setPosition]);

  // Smooth color change on the wall.
  useEffect(() => {
    if (!tintRef.current) return;
    gsap.to(tintRef.current, { backgroundColor: color.hex, duration: reducedMotion ? 0 : 0.7, ease: "power2.out" });
  }, [color, reducedMotion]);

  // Room change: quick crossfade of the stage.
  const changeRoom = (index: number) => {
    if (index === roomIndex) return;
    const stage = stageRef.current;
    if (!stage || reducedMotion) {
      setRoomIndex(index);
      return;
    }
    gsap.to(stage, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setRoomIndex(index);
        gsap.to(stage, { opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.05 });
      },
    });
  };

  // Dragging anywhere on the stage moves the split.
  const moveTo = (clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    setPosition(((clientX - r.left) / r.width) * 100);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-viz-ui]")) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) moveTo(event.clientX);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };
  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 10 : 3;
    if (event.key === "ArrowLeft") setPosition(positionRef.current - step);
    if (event.key === "ArrowRight") setPosition(positionRef.current + step);
  };

  const sheen =
    finish === "gloss"
      ? "linear-gradient(115deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.55) 38%, rgba(255,255,255,0) 52%, rgba(255,255,255,0.25) 70%, rgba(255,255,255,0) 82%)"
      : "linear-gradient(115deg, rgba(255,255,255,0) 25%, rgba(255,255,255,0.28) 45%, rgba(255,255,255,0) 65%)";

  const panel = (
    <div data-viz-ui className="flex flex-col gap-6">
      <div>
        <p className="label text-[11px] opacity-80 min-[900px]:text-[11px]">{content.chooseColor}</p>
        <ul className="mt-4 grid grid-cols-8 gap-2.5 min-[1100px]:grid-cols-4 min-[1100px]:gap-3">
          {PALETTE.map((swatch) => {
            const active = swatch.code === color.code;
            return (
              <li key={swatch.code}>
                <button
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-pressed={active}
                  aria-label={`${swatch.name[locale]} ${swatch.code}`}
                  className={`block aspect-square w-full rounded-full border transition-transform duration-300 hover:scale-110 ${
                    active ? "scale-110 border-white ring-2 ring-red ring-offset-2 ring-offset-transparent" : "border-white/30"
                  }`}
                  style={{ background: swatch.hex }}
                />
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[13px]">
          <span className="font-medium">{color.name[locale]}</span>{" "}
          <span className="tabular opacity-70">· {color.code}</span>
        </p>
      </div>
      <div>
        <p className="label text-[11px] opacity-80 min-[900px]:text-[11px]">{content.finish}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["matte", "satin", "gloss"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFinish(key)}
              aria-pressed={finish === key}
              className={`py-3 text-[12px] transition-colors duration-300 ${
                finish === key ? "bg-white text-ink" : "border border-white/30 text-white hover:border-white"
              }`}
            >
              {content.finishes[key]}
            </button>
          ))}
        </div>
      </div>
      <a href="#contact" className="label btn-red group inline-flex justify-center gap-3 !py-3 text-[11px] min-[900px]:text-[11px]">
        {content.cta}
        <Icon name="arrow" size={14} />
      </a>
    </div>
  );

  return (
    <section ref={sectionRef} id="visualizer" aria-label={content.title} className="bg-surface py-24 min-[900px]:py-32">
      <div className="mx-auto max-w-[1600px] px-[var(--nav-px)]">
        <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div>
            <div className="overflow-hidden">
              <p data-viz-line className="label tabular flex items-center gap-3 text-muted">
                <span className="block h-px w-8 bg-red" aria-hidden="true" />
                <span>{content.eyebrow}</span>
              </p>
            </div>
            <div className="mt-5 overflow-hidden pb-[0.06em]">
              <h2 data-viz-line className="font-heading text-[clamp(40px,5.2vw,88px)] font-normal leading-[1.0] text-ink">
                {content.title}
              </h2>
            </div>
          </div>
          <div className="overflow-hidden">
            <p data-viz-line className="max-w-[380px] text-[15px] leading-relaxed text-muted">
              {content.text}
            </p>
          </div>
        </div>

        {/* Stage */}
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative mt-12 aspect-[4/3] w-full cursor-ew-resize touch-pan-y select-none overflow-hidden bg-bg min-[900px]:mt-16 min-[900px]:aspect-[16/9] min-[900px]:max-h-[86svh]"
        >
          {/* Before */}
          <div aria-hidden="true" className="absolute inset-0" style={photo(room)} />

          {/* After: neutral wall + color + finish, revealed right of the split */}
          <div ref={afterRef} aria-hidden="true" className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
            <div className="absolute inset-0" style={photo(room)} />
            <div
              className="absolute inset-0"
              style={{ ...photo(room), ...wallMask(room), filter: `grayscale(1) brightness(${room.wallBoost}) contrast(0.92)` }}
            />
            <div ref={tintRef} className="absolute inset-0 mix-blend-multiply" style={{ ...wallMask(room), backgroundColor: DEFAULT_COLOR.hex }} />
            {finish !== "matte" && (
              <div
                className="absolute inset-0 mix-blend-soft-light transition-opacity duration-500"
                style={{ ...wallMask(room), backgroundImage: sheen, opacity: finish === "gloss" ? 1 : 0.8 }}
              />
            )}
          </div>

          {/* Labels */}
          <span className="label pointer-events-none absolute left-4 top-4 bg-white/85 px-3 py-1.5 text-[10px] text-ink min-[900px]:text-[10px]">
            {content.before}
          </span>
          <span className="label pointer-events-none absolute right-4 top-4 bg-red px-3 py-1.5 text-[10px] text-white min-[900px]:right-[calc(min(22%,250px)+24px)] min-[900px]:text-[10px]">
            {content.after}
          </span>

          {/* Split handle */}
          <button
            ref={handleRef}
            type="button"
            role="slider"
            aria-label={content.sliderLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
            onKeyDown={onHandleKey}
            className="absolute inset-y-0 z-10 w-0 cursor-ew-resize"
            style={{ left: "50%" }}
          >
            <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.25)]" />
            <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-full bg-white text-ink shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <Icon name="arrowLeft" size={12} strokeWidth={1.75} />
              <Icon name="arrow" size={12} strokeWidth={1.75} />
            </span>
          </button>

          {/* Glass panel (desktop) */}
          <div
            data-viz-ui
            className="absolute left-5 top-1/2 z-20 hidden w-[min(26%,300px)] -translate-y-1/2 cursor-default rounded-[10px] border border-white/15 bg-ink/55 p-6 text-white backdrop-blur-md min-[1100px]:block"
          >
            {panel}
          </div>

          {/* Rooms (desktop) */}
          <div data-viz-ui className="absolute right-5 top-1/2 z-20 hidden w-[min(18%,200px)] -translate-y-1/2 cursor-default flex-col gap-3 min-[900px]:flex">
            {ROOMS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => changeRoom(i)}
                aria-pressed={i === roomIndex}
                className={`group relative block aspect-[16/10] overflow-hidden rounded-[8px] border-2 transition-colors duration-300 ${
                  i === roomIndex ? "border-red" : "border-white/70 hover:border-white"
                }`}
              >
                <Image src={r.image} alt="" fill sizes="200px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="label absolute bottom-1.5 left-1.5 bg-white/90 px-2 py-1 text-[9px] text-ink min-[900px]:text-[9px]">
                  {content.rooms[r.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile / tablet controls */}
        <div className="mt-6 flex gap-3 overflow-x-auto [scrollbar-width:none] min-[900px]:hidden">
          {ROOMS.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => changeRoom(i)}
              aria-pressed={i === roomIndex}
              className={`label shrink-0 border px-4 py-2.5 text-[10px] ${
                i === roomIndex ? "border-red bg-red text-white" : "border-ink/15 text-ink"
              }`}
            >
              {content.rooms[r.id]}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-[10px] bg-ink p-5 text-white min-[1100px]:hidden">{panel}</div>
      </div>
    </section>
  );
}
