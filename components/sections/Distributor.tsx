"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ALGERIA_VIEWBOX, KM_PER_UNIT, WILAYAS, type Wilaya } from "@/lib/algeria-map";
import type { SectionsContent } from "@/lib/content-sections";
import { DISTRIBUTORS, type Distributor as DistributorEntry } from "@/lib/distributors";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Counter from "../ui/Counter";
import Icon from "../ui/Icon";

gsap.registerPlugin(ScrollTrigger);

type DistributorProps = { content: SectionsContent["distributor"] };
type ViewBox = { x: number; y: number; w: number; h: number };

const FULL: ViewBox = { x: ALGERIA_VIEWBOX[0], y: ALGERIA_VIEWBOX[1], w: ALGERIA_VIEWBOX[2], h: ALGERIA_VIEWBOX[3] };
/** Pin radius in viewBox units at full zoom (kept constant on screen when zooming). */
const PIN = 9;

const pad = (n: number) => String(n).padStart(2, "0");
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Zoom box around a wilaya, with margin and a minimum size for the small northern ones. */
function boxFor(wilaya: Wilaya): ViewBox {
  const [x, y, w, h] = wilaya.box;
  const size = Math.max(w, h, 70) * 1.9;
  return { x: x + w / 2 - size / 2, y: y + h / 2 - size / 2, w: size, h: size };
}

function mapsUrl(entry: DistributorEntry): string {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${entry.name} ${entry.address}`)}`;
}

/**
 * 12 — Find PAINTIRO near you. A real map of Algeria's wilayas: borders draw in,
 * wilayas fill, pins drop on wilayas with points of sale. Clicking a wilaya zooms
 * the map on it (animated viewBox) and lists its distributors with directions.
 */
export default function Distributor({ content }: DistributorProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<ViewBox>({ ...FULL });
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<{ code: number; x: number; y: number } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const reducedMotion = useReducedMotion();

  const byWilaya = useMemo(() => {
    const map = new Map<number, DistributorEntry[]>();
    DISTRIBUTORS.forEach((d) => map.set(d.wilaya, [...(map.get(d.wilaya) ?? []), d]));
    return map;
  }, []);
  const activeWilayas = useMemo(() => WILAYAS.filter((w) => byWilaya.has(w.code)), [byWilaya]);
  const wilayaByCode = useMemo(() => new Map(WILAYAS.map((w) => [w.code, w])), []);

  /** Sets the viewBox and keeps pins the same size on screen. */
  const applyView = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const v = viewRef.current;
    svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    const k = v.w / FULL.w;
    svg.querySelectorAll<SVGGElement>("[data-pin]").forEach((pin) => {
      pin.setAttribute("transform", `translate(${pin.dataset.cx} ${pin.dataset.cy}) scale(${k})`);
    });
  };

  const zoomTo = (target: ViewBox) => {
    setZoomed(target.w < FULL.w - 1);
    gsap.to(viewRef.current, {
      ...target,
      duration: reducedMotion ? 0 : 1.3,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: applyView,
    });
  };

  /** Zooms in (factor < 1) or out (factor > 1) around the current center. */
  const zoomBy = (factor: number) => {
    const v = viewRef.current;
    const w = Math.min(FULL.w, Math.max(60, v.w * factor));
    if (w >= FULL.w - 1) {
      zoomTo(FULL);
      return;
    }
    const h = w * (FULL.h / FULL.w);
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;
    const x = Math.min(FULL.w - w, Math.max(0, cx - w / 2));
    const y = Math.min(FULL.h - h, Math.max(0, cy - h / 2));
    zoomTo({ x, y, w, h });
  };

  const selectWilaya = (code: number | null) => {
    // Clicking the selected wilaya again goes back to the whole country.
    if (code !== null && code === selected) code = null;
    setSelected(code);
    setHover(null);
    const wilaya = code === null ? null : wilayaByCode.get(code);
    zoomTo(wilaya ? boxFor(wilaya) : FULL);
  };

  // Intro: borders draw, wilayas fill, pins drop (once, when the map scrolls in).
  useEffect(() => {
    const section = sectionRef.current;
    const svg = svgRef.current;
    if (!section || !svg) return;
    applyView();
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const outlines = gsap.utils.toArray<SVGPathElement>("[data-outline]");
      outlines.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set("[data-fill]", { opacity: 0 });
      gsap.set("[data-pin-inner]", { opacity: 0, y: -30, scale: 0.4, transformOrigin: "50% 100%" });

      gsap
        .timeline({ scrollTrigger: { trigger: svg, start: "top 75%", once: true } })
        .to(outlines, { strokeDashoffset: 0, duration: 1.6, stagger: 0.012, ease: "power2.inOut" })
        .to("[data-fill]", { opacity: 1, duration: 0.8, stagger: 0.01, ease: "power2.out" }, 0.9)
        .to(outlines, { opacity: 0, duration: 0.8 }, 1.8)
        .to("[data-pin-inner]", { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.05, ease: "power3.out" }, 1.6);

      gsap.from("[data-dist-line]", {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 70%", once: true },
      });
    }, section);
    return () => ctx.revert();
  }, [reducedMotion]);

  // Panel content slides in when the selection or search changes.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-panel-item]",
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: "power3.out" },
      );
    }, panel);
    return () => ctx.revert();
  }, [selected, reducedMotion]);

  const onMapMove = (event: ReactPointerEvent<SVGPathElement>, code: number) => {
    if (event.pointerType !== "mouse") return;
    const box = mapRef.current?.getBoundingClientRect();
    if (!box) return;
    setHover({ code, x: event.clientX - box.left, y: event.clientY - box.top });
  };

  // Search: wilayas whose name, code or distributor city matches.
  const q = normalize(query);
  const results = q
    ? WILAYAS.filter(
        (w) =>
          normalize(w.name).includes(q) ||
          String(w.code) === q.replace(/^0/, "") ||
          (byWilaya.get(w.code) ?? []).some((d) => normalize(d.city).includes(q)),
      )
    : activeWilayas;

  const selectedWilaya = selected === null ? null : wilayaByCode.get(selected) ?? null;
  const selectedEntries = selected === null ? [] : byWilaya.get(selected) ?? [];
  const nearest =
    selectedWilaya && selectedEntries.length === 0
      ? activeWilayas
          .map((w) => ({ w, km: Math.hypot(w.cx - selectedWilaya.cx, w.cy - selectedWilaya.cy) * KM_PER_UNIT }))
          .sort((a, b) => a.km - b.km)
          .slice(0, 2)
      : [];
  const hovered = hover ? wilayaByCode.get(hover.code) : null;

  return (
    <section ref={sectionRef} id="contact" aria-label={content.title} className="relative overflow-hidden bg-surface py-24 min-[900px]:py-32">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-[var(--nav-px)] min-[1100px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] min-[1100px]:gap-16">
        {/* LEFT: header + panel */}
        <div className="flex min-w-0 flex-col">
          <div className="overflow-hidden">
            <p data-dist-line className="label tabular flex items-center gap-3 text-muted">
              <span className="text-red">12</span>
              <span className="block h-px w-8 bg-red" aria-hidden="true" />
              <span>{content.eyebrow}</span>
            </p>
          </div>
          <div className="mt-5 overflow-hidden pb-[0.06em]">
            <h2 data-dist-line className="font-heading text-[clamp(40px,5vw,84px)] font-normal leading-[1.02] text-ink">
              {content.title}
            </h2>
          </div>
          <div className="mt-4 overflow-hidden">
            <p data-dist-line className="max-w-[440px] text-[15px] leading-relaxed text-muted">
              {content.text}
            </p>
          </div>

          <dl data-dist-line className="mt-8 flex gap-10 border-t border-ink/10 pt-6">
            <div>
              <dd>
                <Counter value={DISTRIBUTORS.length} className="font-heading block text-[56px] leading-none text-red" />
              </dd>
              <dt className="label mt-2 text-[11px] text-muted min-[900px]:text-[11px]">{content.distributors}</dt>
            </div>
            <div>
              <dd>
                <Counter value={activeWilayas.length} className="font-heading block text-[56px] leading-none text-ink" />
              </dd>
              <dt className="label mt-2 text-[11px] text-muted min-[900px]:text-[11px]">{content.wilayas}</dt>
            </div>
          </dl>

          <div ref={panelRef} className="mt-8 flex min-h-0 flex-col">
            {selectedWilaya ? (
              <>
                <button
                  type="button"
                  data-panel-item
                  onClick={() => selectWilaya(null)}
                  className="label inline-flex items-center gap-2 self-start text-ink transition-colors hover:text-red"
                >
                  <Icon name="arrowLeft" size={14} />
                  {content.allAlgeria}
                </button>
                <p data-panel-item className="font-heading mt-5 text-[clamp(34px,3.4vw,52px)] leading-none text-ink">
                  <span className="tabular text-red">{pad(selectedWilaya.code)}</span> {selectedWilaya.name}
                </p>

                {selectedEntries.length > 0 ? (
                  <ul data-lenis-prevent className="mt-6 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                    {selectedEntries.map((entry) => (
                      <li key={entry.id} data-panel-item className="border border-ink/10 bg-white p-5">
                        <p className="label text-[10px] text-red min-[900px]:text-[10px]">{content.types[entry.type]}</p>
                        <p className="font-heading mt-2 text-[24px] leading-tight text-ink">{entry.name}</p>
                        <p className="mt-2 flex items-start gap-2 text-[14px] text-muted">
                          <Icon name="pin" size={16} className="mt-0.5 shrink-0 text-red" />
                          {entry.address}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a
                            href={mapsUrl(entry)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="label btn-red group inline-flex gap-2 !px-4 !py-2.5 text-[11px] min-[900px]:text-[11px]"
                          >
                            {content.directions}
                            <Icon name="arrow" size={13} />
                          </a>
                          {entry.phone && (
                            <a
                              href={`tel:${entry.phone.replace(/\s/g, "")}`}
                              className="label btn-outline inline-flex gap-2 !px-4 !py-2.5 text-[11px] min-[900px]:text-[11px]"
                            >
                              <Icon name="phone" size={13} />
                              {content.call}
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div data-panel-item className="mt-6 border border-ink/10 bg-white p-5">
                    <p className="text-[14px] text-muted">{content.none}</p>
                    <p className="label mt-5 text-[10px] text-muted min-[900px]:text-[10px]">{content.nearest}</p>
                    <ul className="mt-2 flex flex-col">
                      {nearest.map(({ w, km }) => (
                        <li key={w.code}>
                          <button
                            type="button"
                            onClick={() => selectWilaya(w.code)}
                            className="group flex w-full items-center justify-between border-b border-ink/10 py-3 text-left"
                          >
                            <span className="font-heading text-[22px] text-ink transition-colors group-hover:text-red">
                              {w.name}
                            </span>
                            <span className="label tabular text-[11px] text-muted min-[900px]:text-[11px]">
                              ~{Math.round(km / 10) * 10} km
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <label data-panel-item className="relative block">
                  <span className="sr-only">{content.placeholder}</span>
                  <Icon name="pin" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-red" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={content.placeholder}
                    className="h-14 w-full border border-ink/15 bg-white pl-12 pr-4 text-[15px] text-ink placeholder:text-muted focus:border-red focus:outline-none"
                  />
                </label>
                <p data-panel-item className="label mt-6 text-[10px] text-muted min-[900px]:text-[10px]">
                  {content.listTitle}
                </p>
                {results.length === 0 ? (
                  <p className="mt-4 text-[14px] text-muted">{content.noResults}</p>
                ) : (
                  <ul data-lenis-prevent className="mt-2 grid max-h-[360px] grid-cols-1 overflow-y-auto pr-1 min-[600px]:grid-cols-2 min-[600px]:gap-x-6">
                    {results.map((w) => {
                      const n = byWilaya.get(w.code)?.length ?? 0;
                      return (
                        <li key={w.code} data-panel-item>
                          <button
                            type="button"
                            onClick={() => selectWilaya(w.code)}
                            onPointerEnter={() => setHover(null)}
                            className="group flex w-full items-center gap-4 border-b border-ink/10 py-3 text-left"
                          >
                            <span className="label tabular w-6 text-red">{pad(w.code)}</span>
                            <span className="flex-1 text-[15px] text-ink transition-colors group-hover:text-red">{w.name}</span>
                            <span
                              className={`label tabular flex size-7 items-center justify-center rounded-full text-[10px] min-[900px]:text-[10px] ${
                                n ? "bg-red text-white" : "bg-ink/5 text-muted"
                              }`}
                            >
                              {n}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: the map */}
        <div ref={mapRef} className="relative">
          <svg
            ref={svgRef}
            role="img"
            aria-label={content.mapLabel}
            viewBox={`${FULL.x} ${FULL.y} ${FULL.w} ${FULL.h}`}
            className="block aspect-square w-full overflow-hidden"
            onPointerLeave={() => setHover(null)}
          >
            {/* Clicking outside the wilayas zooms back out */}
            <rect
              x={-2000}
              y={-2000}
              width={5000}
              height={5000}
              fill="transparent"
              onClick={() => (zoomed ? selectWilaya(null) : undefined)}
            />
            <g>
              {WILAYAS.map((w) => {
                const active = byWilaya.has(w.code);
                const isSelected = w.code === selected;
                return (
                  <path
                    key={w.code}
                    data-fill
                    d={w.d}
                    fillRule="evenodd"
                    vectorEffect="non-scaling-stroke"
                    onClick={() => selectWilaya(w.code)}
                    onPointerMove={(e) => onMapMove(e, w.code)}
                    className={`cursor-pointer stroke-white transition-[fill] duration-300 [stroke-width:1] ${
                      isSelected
                        ? "fill-red"
                        : active
                          ? "fill-[#F5CBC7] hover:fill-[#EE8A82]"
                          : "fill-[#ECEAE6] hover:fill-[#DAD6CF]"
                    }`}
                  />
                );
              })}
            </g>
            <g aria-hidden="true" className="pointer-events-none">
              {WILAYAS.map((w) => (
                <path key={w.code} data-outline d={w.d} fill="none" vectorEffect="non-scaling-stroke" className="stroke-red [stroke-width:1]" />
              ))}
            </g>
            <g aria-hidden="true" className="pointer-events-none">
              {activeWilayas.map((w) => (
                <g key={w.code} data-pin data-cx={w.cx} data-cy={w.cy} transform={`translate(${w.cx} ${w.cy})`}>
                  <g data-pin-inner>
                    <circle r={PIN * 1.9} className="map-pulse fill-red" />
                    <circle r={PIN} className={w.code === selected ? "fill-ink" : "fill-red"} stroke="white" strokeWidth={2} />
                    <text
                      y={PIN * 0.36}
                      textAnchor="middle"
                      className="fill-white font-body font-medium"
                      style={{ fontSize: PIN * 1.05 }}
                    >
                      {byWilaya.get(w.code)?.length}
                    </text>
                  </g>
                </g>
              ))}
            </g>
          </svg>

          {/* Zoom controls */}
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
            <div className="flex flex-col border border-ink/10 bg-white shadow-[0_8px_24px_-12px_rgba(20,20,20,0.3)]">
              <button
                type="button"
                onClick={() => zoomBy(0.55)}
                aria-label={content.zoomIn}
                className="flex size-11 items-center justify-center text-[22px] leading-none text-ink transition-colors hover:bg-red hover:text-white"
              >
                +
              </button>
              <span className="h-px bg-ink/10" aria-hidden="true" />
              <button
                type="button"
                onClick={() => zoomBy(1.8)}
                disabled={!zoomed}
                aria-label={content.zoomOut}
                className="flex size-11 items-center justify-center text-[22px] leading-none text-ink transition-colors hover:bg-red hover:text-white disabled:pointer-events-none disabled:opacity-30"
              >
                −
              </button>
            </div>
            {zoomed && (
              <button
                type="button"
                onClick={() => selectWilaya(null)}
                className="label inline-flex items-center gap-2 bg-ink px-3 py-2.5 text-[10px] text-white transition-colors hover:bg-red min-[900px]:text-[10px]"
              >
                <Icon name="arrowLeft" size={12} />
                {content.allAlgeria}
              </button>
            )}
          </div>

          {/* Hover label */}
          {hovered && hover && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap bg-ink px-3 py-2 text-white"
              style={{ left: hover.x, top: hover.y }}
            >
              <span className="label tabular text-[10px] text-red min-[900px]:text-[10px]">{pad(hovered.code)}</span>{" "}
              <span className="text-[13px]">{hovered.name}</span>
              <span className="label tabular ml-2 text-[10px] text-white/60 min-[900px]:text-[10px]">
                {byWilaya.get(hovered.code)?.length ?? 0}
              </span>
            </div>
          )}

          <p className="mt-3 text-right text-[10px] text-muted">{content.attribution}</p>
        </div>
      </div>
    </section>
  );
}
