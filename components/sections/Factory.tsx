"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ExperienceContent } from "@/lib/content-experience";
import { getProduct } from "@/lib/products";
import { useReducedMotion } from "@/lib/useReducedMotion";
import AnimatedTitle from "../ui/AnimatedTitle";

gsap.registerPlugin(ScrollTrigger);

type FactoryProps = { content: ExperienceContent["factory"] };

/** Drawing size (viewBox units) and x center of each station. */
const VIEW_W = 3000;
const VIEW_H = 1000;
const STATIONS = [300, 900, 1500, 2100, 2700];
/** Liters shown by the counter at the end of the line (placeholder figure). */
const LITERS_TOTAL = 24000;
/** Real buckets at the end of the line: the one being filled, and the previous one leaving. */
const FILLED = getProduct("irovella");
const LEAVING = getProduct("irofacade");
/** Bucket size in the drawing (the product photos are almost square). */
const BUCKET_W = 300;
const BUCKET_X = 2700 - BUCKET_W / 2;
const BUCKET_BOTTOM = 760;
const BUCKET_TOP = BUCKET_BOTTOM - (BUCKET_W * FILLED.height) / FILLED.width;
/** Distance between two buckets on the conveyor. */
const BUCKET_GAP = 340;

const TINTS = ["#E8372C", "#2F3E52", "#C9B08F", "#66755F", "#8BA0B4", "#141414"];

const LINE = "rgba(255,255,255,0.6)";
const FAINT = "rgba(255,255,255,0.16)";
const RED = "#E8372C";
const PAINT_WHITE = "#F2F0EA";

const BODY_FONT = { fontFamily: "var(--font-body)" };
const HEADING_FONT = { fontFamily: "var(--font-heading)" };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "From raw mineral to your wall": the section pins and the scroll drives a
 * blueprint-style production line. The camera travels from station to station
 * while paint flows through the pipes: silos empty, the disperser spins, tint
 * drops fall, the lab gauge validates the batch and a bucket is filled and sealed,
 * then the blueprint bucket turns into the real product photo.
 */
export default function Factory({ content }: FactoryProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const litersRef = useRef<HTMLSpanElement>(null);
  const opacityRef = useRef<SVGTextElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const steps = content.steps;

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    const svg = svgRef.current;
    if (!stage || !track || !svg || reducedMotion) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(svg);

      // Pipes start empty.
      const pipes = q<SVGPathElement>("[data-pipe]");
      pipes.forEach((pipe) => {
        const length = pipe.getTotalLength();
        gsap.set(pipe, { strokeDasharray: length, strokeDashoffset: length });
      });
      const check = q<SVGPathElement>("[data-check]")[0];
      const checkLength = check.getTotalLength();
      gsap.set(check, { strokeDasharray: checkLength, strokeDashoffset: checkLength });
      gsap.set(q("[data-drop]"), { opacity: 0 });
      gsap.set(q("[data-spec]"), { opacity: 0, x: -12 });
      gsap.set(q("[data-stream]"), { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(q("[data-bucket-fill]"), { scaleY: 0, transformOrigin: "50% 100%" });
      gsap.set(q("[data-lid]"), { y: -140, opacity: 0 });
      gsap.set(q("[data-real]"), { opacity: 0, scale: 0.92, transformOrigin: "50% 100%" });
      gsap.set(q("[data-outline]"), { opacity: 1 });
      gsap.set(q("[data-glow], [data-caption]"), { opacity: 0 });

      /** Horizontal camera offset (px) that brings a station to the focus point. */
      const cameraX = (index: number) => {
        const scale = svg.clientHeight / VIEW_H;
        const width = VIEW_W * scale;
        const focus = window.innerWidth >= 900 ? window.innerWidth * 0.64 : window.innerWidth / 2;
        const x = focus - STATIONS[index] * scale;
        return Math.min(0, Math.max(window.innerWidth - width, x));
      };

      const liters = { value: 0 };
      const opacity = { value: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${window.innerHeight * 4.5}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
            setActive((current) => (current === index ? current : index));
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      // Camera: holds on the first station, travels, holds on the last one.
      tl.fromTo(track, { x: () => cameraX(0) }, { x: () => cameraX(4), duration: 8 }, 1);
      tl.to(liters, {
        value: LITERS_TOTAL,
        duration: 10,
        onUpdate: () => {
          if (litersRef.current) litersRef.current.textContent = Math.round(liters.value).toLocaleString("fr-FR");
        },
      }, 0);

      // 01 Raw materials: silos empty into the line.
      tl.to(q("[data-silo-fill]"), { scaleY: 0.35, transformOrigin: "50% 100%", duration: 1.6, stagger: 0.15 }, 0.2);
      tl.to(pipes[0], { strokeDashoffset: 0, duration: 1.4 }, 0.5);

      // 02 Dispersion: the vat fills, the blade spins, the swirl appears.
      tl.to(q("[data-vat-liquid]"), { attr: { y: 470 }, duration: 1.6 }, 1.8);
      tl.to(q("[data-blade]"), { scaleX: -1, transformOrigin: "50% 50%", duration: 0.2, repeat: 11, yoyo: true }, 2);
      tl.fromTo(q("[data-swirl]"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 2.6);
      tl.to(pipes[1], { strokeDashoffset: 0, duration: 0.8 }, 3.6);

      // 03 Tinting: drops fall one by one, the batch turns red.
      q("[data-drop]").forEach((drop, i) => {
        tl.fromTo(drop, { y: 0, opacity: 1 }, { y: 250, duration: 0.3 }, 4.2 + i * 0.22);
        tl.set(drop, { opacity: 0 }, 4.5 + i * 0.22);
      });
      tl.to(q("[data-tint-liquid]"), { fill: RED, duration: 1.3 }, 4.4);
      tl.to(pipes[2], { strokeDashoffset: 0, duration: 2.2 }, 5.6);
      tl.to(pipes[3], { strokeDashoffset: 0, duration: 0.5 }, 6.2);

      // 04 Lab: the gauge swings to 98%, specs and check mark.
      tl.fromTo(q("[data-needle]"), { rotation: -80, svgOrigin: "2100 470" }, { rotation: 66, svgOrigin: "2100 470", duration: 1.2, ease: "power1.inOut" }, 6.2);
      tl.to(opacity, {
        value: 98,
        duration: 1.2,
        ease: "power1.inOut",
        onUpdate: () => {
          if (opacityRef.current) opacityRef.current.textContent = `${Math.round(opacity.value)}%`;
        },
      }, 6.2);
      tl.to(q("[data-spec]"), { opacity: 1, x: 0, duration: 0.3, stagger: 0.25 }, 6.7);
      tl.to(check, { strokeDashoffset: 0, duration: 0.4 }, 7.5);

      // 05 Filling: the finished bucket leaves, an empty one arrives, fills,
      // gets its lid, then the drawing becomes the real product.
      tl.fromTo(q("[data-buckets]"), { x: -BUCKET_GAP }, { x: 0, duration: 0.6, ease: "power2.inOut" }, 8);
      tl.fromTo(q("[data-outline]"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 8);
      tl.to(q("[data-stream]"), { scaleY: 1, duration: 0.15 }, 8.6);
      tl.to(q("[data-bucket-fill]"), { scaleY: 1, duration: 0.55 }, 8.7);
      tl.to(q("[data-stream]"), { opacity: 0, duration: 0.12 }, 9.25);
      tl.to(q("[data-lid]"), { y: 0, opacity: 1, duration: 0.2, ease: "power2.in" }, 9.3);
      tl.to(q("[data-glow]"), { opacity: 1, duration: 0.15 }, 9.5);
      tl.to(q("[data-real]"), { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 9.55);
      tl.to(q("[data-outline]"), { opacity: 0, duration: 0.25 }, 9.6);
      tl.to(q("[data-glow]"), { opacity: 0.4, duration: 0.25 }, 9.75);
      tl.to(q("[data-caption]"), { opacity: 1, duration: 0.2 }, 9.8);
    }, stage);

    return () => ctx.revert();
  }, [reducedMotion, steps.length]);

  return (
    <section
      id="factory"
      aria-label={content.title}
      className="relative overflow-hidden bg-ink text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <div
        ref={stageRef}
        className={reducedMotion ? "py-24" : "relative flex h-svh flex-col overflow-hidden pt-[calc(var(--nav-h)+12px)]"}
      >
        {/* Header */}
        <div className="relative z-10 flex flex-col gap-4 px-[var(--nav-px)] min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div>
            <p className="label flex items-center gap-3 text-white/70">
              <span className="block h-px w-8 bg-red" aria-hidden="true" />
              {content.eyebrow}
            </p>
            <AnimatedTitle
              text={content.title}
              accentWord={content.title.split(" ").length - 1}
              className="font-heading mt-4 max-w-[18ch] text-[clamp(34px,4.6vw,76px)] font-normal leading-[1]"
            />
          </div>
          <div className="max-w-[340px] min-[900px]:text-right">
            <p className="hidden text-[14px] leading-relaxed text-white/60 min-[900px]:block">{content.intro}</p>
            {!reducedMotion && (
              <p className="mt-3 flex items-baseline gap-3 min-[900px]:justify-end">
                <span ref={litersRef} className="font-heading tabular text-[clamp(30px,3vw,48px)] leading-none text-red">
                  0
                </span>
                <span className="label text-white/55">L</span>
              </p>
            )}
            {!reducedMotion && <p className="label mt-2 text-white/40">{content.counterLabel}</p>}
          </div>
        </div>

        {/* Production line */}
        <div className={reducedMotion ? "mt-12 px-[var(--nav-px)]" : "relative min-h-0 flex-1"}>
          <div
            ref={trackRef}
            className={reducedMotion ? "w-full" : "absolute left-0 top-1/2 h-[min(62svh,640px)] -translate-y-[55%] will-change-transform max-[899px]:h-[44svh] max-[899px]:-translate-y-[78%]"}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              aria-hidden="true"
              className={reducedMotion ? "block h-auto w-full" : "block h-full w-auto"}
              style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <clipPath id="vat-clip">
                  <path d="M762 380 V740 Q762 798 820 798 H980 Q1038 798 1038 740 V380 Z" />
                </clipPath>
                <clipPath id="tint-clip">
                  <path d="M1402 450 V740 Q1402 788 1450 788 H1550 Q1598 788 1598 740 V450 Z" />
                </clipPath>
                <clipPath id="bucket-clip">
                  <path d={`M${BUCKET_X + 10} ${BUCKET_TOP + 22} L${BUCKET_X + 31} ${BUCKET_BOTTOM - 4} H${BUCKET_X + BUCKET_W - 31} L${BUCKET_X + BUCKET_W - 10} ${BUCKET_TOP + 22} Z`} />
                </clipPath>
                <radialGradient id="product-glow">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                  <stop offset="45%" stopColor={RED} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={RED} stopOpacity="0" />
                </radialGradient>
                {[180, 300, 420].map((cx) => (
                  <clipPath key={cx} id={`silo-${cx}`}>
                    <rect x={cx - 43} y="242" width="86" height="326" />
                  </clipPath>
                ))}
              </defs>

              {/* Ground and station numbers */}
              <line x1="0" y1="860" x2={VIEW_W} y2="860" stroke={FAINT} strokeWidth="2" />
              {STATIONS.map((x, i) => (
                <g key={x}>
                  <text x={x} y="925" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="22" letterSpacing="6" style={BODY_FONT}>
                    {pad(i + 1)} — {[content.labels.silos.join(" · "), content.labels.vat, content.labels.tint, content.labels.lab, content.labels.filling][i]}
                  </text>
                </g>
              ))}

              {/* Pipes: grey casing + red flow drawn by the scroll */}
              {[
                "M180 700 H640 V320 H830 V392",
                "M900 798 V830 H1220 V400 H1450 V452",
                "M1500 788 V830 H2480 V300 H2700 V330",
                "M2050 830 V760",
              ].map((d, i) => (
                <g key={d}>
                  <path d={d} stroke={FAINT} strokeWidth="16" />
                  <path data-pipe={i} d={d} stroke={RED} strokeWidth="6" />
                </g>
              ))}

              {/* 01 Silos */}
              {[180, 300, 420].map((cx, i) => (
                <g key={cx}>
                  <rect
                    data-silo-fill
                    clipPath={`url(#silo-${cx})`}
                    x={cx - 43}
                    y="300"
                    width="86"
                    height="268"
                    fill="rgba(255,255,255,0.12)"
                  />
                  <path
                    d={`M${cx - 45} 240 Q${cx} 180 ${cx + 45} 240 V570 L${cx + 10} 640 H${cx - 10} L${cx - 45} 570 Z`}
                    stroke={LINE}
                    strokeWidth="3"
                  />
                  <line x1={cx - 45} y1="570" x2={cx + 45} y2="570" stroke={FAINT} strokeWidth="2" />
                  <line x1={cx} y1="640" x2={cx} y2="700" stroke={FAINT} strokeWidth="10" />
                  <line x1={cx - 40} y1="600" x2={cx - 40} y2="860" stroke={FAINT} strokeWidth="3" />
                  <line x1={cx + 40} y1="600" x2={cx + 40} y2="860" stroke={FAINT} strokeWidth="3" />
                  <text x={cx} y="420" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="20" letterSpacing="3" style={BODY_FONT}>
                    {content.labels.silos[i]}
                  </text>
                  {[0, 1, 2].map((k) => (
                    <circle key={k} cx={cx + (k - 1) * 5} cy="650" r="3" fill="rgba(255,255,255,0.7)" className="factory-fall" style={{ animationDelay: `${k * 0.35 + i * 0.2}s` }} />
                  ))}
                </g>
              ))}

              {/* 02 Dispersion vat */}
              <rect data-vat-liquid clipPath="url(#vat-clip)" x="762" y="800" width="276" height="340" fill={PAINT_WHITE} opacity="0.92" />
              <g data-swirl clipPath="url(#vat-clip)" opacity="0">
                <ellipse cx="900" cy="600" rx="110" ry="22" stroke="rgba(20,20,20,0.18)" strokeWidth="3" />
                <ellipse cx="900" cy="660" rx="80" ry="16" stroke="rgba(20,20,20,0.14)" strokeWidth="3" />
              </g>
              <path d="M760 380 V740 Q760 800 820 800 H980 Q1040 800 1040 740 V380" stroke={LINE} strokeWidth="3" />
              <line x1="736" y1="380" x2="1064" y2="380" stroke={LINE} strokeWidth="3" />
              <rect x="860" y="230" width="80" height="80" rx="8" stroke={LINE} strokeWidth="3" />
              <circle cx="900" cy="270" r="16" stroke={RED} strokeWidth="3" />
              <line x1="900" y1="310" x2="900" y2="690" stroke={LINE} strokeWidth="5" />
              <path data-blade d="M830 690 Q865 664 900 690 Q935 716 970 690" stroke={LINE} strokeWidth="5" />
              <line x1="790" y1="800" x2="790" y2="860" stroke={FAINT} strokeWidth="3" />
              <line x1="1010" y1="800" x2="1010" y2="860" stroke={FAINT} strokeWidth="3" />

              {/* 03 Tinting machine */}
              <rect x="1370" y="170" width="260" height="96" rx="12" stroke={LINE} strokeWidth="3" />
              {TINTS.map((color, i) => (
                <g key={color}>
                  <circle cx={1410 + i * 36} cy="206" r="13" fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                  <rect x={1404 + i * 36} y="266" width="12" height="22" fill={FAINT} />
                  <path data-drop d={`M${1410 + i * 36} 292 q8 14 0 20 q-8 -6 0 -20 Z`} fill={color} />
                </g>
              ))}
              <rect data-tint-liquid clipPath="url(#tint-clip)" x="1402" y="560" width="196" height="240" fill={PAINT_WHITE} style={{ fill: PAINT_WHITE }} />
              <path d="M1400 450 V740 Q1400 790 1450 790 H1550 Q1600 790 1600 740 V450" stroke={LINE} strokeWidth="3" />
              <line x1="1380" y1="450" x2="1620" y2="450" stroke={LINE} strokeWidth="3" />
              <line x1="1430" y1="790" x2="1430" y2="860" stroke={FAINT} strokeWidth="3" />
              <line x1="1570" y1="790" x2="1570" y2="860" stroke={FAINT} strokeWidth="3" />

              {/* 04 Quality lab */}
              <path d="M1940 470 A160 160 0 0 1 2260 470" stroke={LINE} strokeWidth="3" />
              <path d="M2172 327 A160 160 0 0 1 2260 470" stroke={RED} strokeWidth="8" />
              {Array.from({ length: 11 }, (_, i) => {
                const a = Math.PI + (i / 10) * Math.PI;
                return (
                  <line
                    key={i}
                    x1={2100 + Math.cos(a) * 140}
                    y1={470 + Math.sin(a) * 140}
                    x2={2100 + Math.cos(a) * 160}
                    y2={470 + Math.sin(a) * 160}
                    stroke={LINE}
                    strokeWidth="3"
                  />
                );
              })}
              <line data-needle x1="2100" y1="470" x2="2100" y2="340" stroke="#fff" strokeWidth="5" />
              <circle cx="2100" cy="470" r="12" fill="#fff" />
              <text ref={opacityRef} x="2100" y="540" textAnchor="middle" fill="#fff" fontSize="56" style={HEADING_FONT}>
                0%
              </text>
              {content.labels.specs.map((spec, i) => (
                <text key={spec} data-spec x="1960" y={610 + i * 44} fill="rgba(255,255,255,0.75)" fontSize="22" letterSpacing="4" style={BODY_FONT}>
                  — {spec}
                </text>
              ))}
              <circle cx="2250" cy="300" r="34" stroke={RED} strokeWidth="4" />
              <path data-check d="M2234 300 l12 12 l22 -26" stroke="#fff" strokeWidth="6" />
              <rect x="2030" y="700" width="40" height="60" rx="6" stroke={LINE} strokeWidth="3" />

              {/* 05 Filling */}
              <rect x="2660" y="300" width="80" height="60" rx="6" stroke={LINE} strokeWidth="3" />
              <path d="M2672 360 L2700 400 L2728 360" stroke={LINE} strokeWidth="3" />
              <rect data-stream x="2694" y="400" width="12" height={BUCKET_TOP + 22 - 400} fill={RED} />
              <circle data-glow cx="2700" cy={BUCKET_TOP + 120} r="300" fill="url(#product-glow)" opacity={reducedMotion ? 0.4 : 0} />
              <line x1="2360" y1={BUCKET_BOTTOM} x2={VIEW_W} y2={BUCKET_BOTTOM} stroke={LINE} strokeWidth="3" />
              <g>
                {Array.from({ length: 11 }, (_, i) => (
                  <g key={i}>
                    <circle cx={2390 + i * 58} cy="780" r="14" stroke={FAINT} strokeWidth="3" />
                    <line x1={2390 + i * 58} y1="766" x2={2390 + i * 58} y2="794" stroke={FAINT} strokeWidth="2" />
                  </g>
                ))}
              </g>
              <g data-buckets>
                {/* Previous bucket, finished, leaving on the conveyor */}
                <image
                  href={LEAVING.image}
                  x={BUCKET_X + BUCKET_GAP}
                  y={BUCKET_TOP}
                  width={BUCKET_W}
                  height={BUCKET_BOTTOM - BUCKET_TOP}
                  preserveAspectRatio="xMidYMax meet"
                  opacity="0.55"
                />
                {/* Blueprint bucket: filled with paint, then closed */}
                <g data-outline opacity={reducedMotion ? 0 : 1}>
                  <rect
                    data-bucket-fill
                    clipPath="url(#bucket-clip)"
                    x={BUCKET_X}
                    y={BUCKET_TOP + 20}
                    width={BUCKET_W}
                    height={BUCKET_BOTTOM - BUCKET_TOP - 20}
                    fill={RED}
                  />
                  <path
                    d={`M${BUCKET_X + 6} ${BUCKET_TOP + 20} L${BUCKET_X + 28} ${BUCKET_BOTTOM} H${BUCKET_X + BUCKET_W - 28} L${BUCKET_X + BUCKET_W - 6} ${BUCKET_TOP + 20} Z`}
                    stroke={LINE}
                    strokeWidth="3"
                  />
                  <path
                    d={`M${BUCKET_X + 14} ${BUCKET_TOP + 50} Q2700 ${BUCKET_TOP - 90} ${BUCKET_X + BUCKET_W - 14} ${BUCKET_TOP + 50}`}
                    stroke={FAINT}
                    strokeWidth="3"
                  />
                  <rect data-lid x={BUCKET_X - 6} y={BUCKET_TOP + 6} width={BUCKET_W + 12} height="24" rx="10" fill="#fff" />
                </g>
                {/* The real product */}
                <image
                  data-real
                  href={FILLED.image}
                  x={BUCKET_X}
                  y={BUCKET_TOP}
                  width={BUCKET_W}
                  height={BUCKET_BOTTOM - BUCKET_TOP}
                  preserveAspectRatio="xMidYMax meet"
                />
              </g>
              <text data-caption x="2700" y="836" textAnchor="middle" fill="#fff" fontSize="22" letterSpacing="5" style={BODY_FONT}>
                {FILLED.name}
              </text>
            </svg>
          </div>
        </div>

        {/* Current step (pinned) or all steps (reduced motion) */}
        {reducedMotion ? (
          <ol className="mt-14 grid gap-10 px-[var(--nav-px)] min-[900px]:grid-cols-5">
            {steps.map((step, i) => (
              <li key={step.title}>
                <p className="label text-red">{pad(i + 1)}</p>
                <h3 className="font-heading mt-3 text-[28px] leading-tight">{step.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-white/65">{step.text}</p>
                <p className="font-heading mt-4 text-[36px] text-red">{step.stat}</p>
                <p className="label text-white/50">{step.statLabel}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="relative z-10 px-[var(--nav-px)] pb-[max(28px,env(safe-area-inset-bottom))]">
            <div className="relative h-[190px] max-w-[460px] min-[900px]:h-[220px]">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  aria-hidden={i !== active}
                  className="absolute inset-0 transition-[opacity,transform] duration-700 ease-power3-out"
                  style={{
                    opacity: i === active ? 1 : 0,
                    transform: `translateY(${i === active ? 0 : i < active ? -24 : 24}px)`,
                  }}
                >
                  <p className="label tabular text-red">
                    {pad(i + 1)} <span className="text-white/40">/ {pad(steps.length)}</span>
                  </p>
                  <h3 className="font-heading mt-3 text-[clamp(28px,2.6vw,40px)] leading-[1.05]">{step.title}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/65 min-[900px]:text-[15px]">{step.text}</p>
                  <p className="mt-4 flex items-baseline gap-3">
                    <span className="font-heading text-[clamp(30px,2.8vw,44px)] leading-none text-red">{step.stat}</span>
                    <span className="label text-white/50">{step.statLabel}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 h-px w-full max-w-[460px] bg-white/15">
              <div ref={progressRef} className="h-full origin-left bg-red" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
