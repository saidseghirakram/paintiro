"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type DripDividerProps = {
  /** Paint color (the section above). */
  paint: string;
  /** Background (the section below). */
  background: string;
};

/** x position (0..1000), max length (px in viewBox) and width of each drip. */
const DRIPS: [number, number, number][] = [
  [40, 120, 26], [130, 60, 18], [205, 170, 34], [300, 90, 22], [380, 210, 40],
  [470, 70, 16], [540, 140, 30], [630, 230, 44], [720, 80, 20], [790, 160, 32],
  [880, 110, 24], [955, 190, 36],
];

/**
 * Paint running down from the section above into the next one: each drip
 * stretches with the scroll, the longest ones keep growing the longest.
 */
export default function DripDivider({ paint, background }: DripDividerProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const drips = svg.querySelectorAll<SVGGElement>("[data-drip]");
    const tween = gsap.fromTo(
      drips,
      { scaleY: 0.08 },
      {
        scaleY: 1,
        ease: "none",
        stagger: { each: 0.04, from: "random" },
        scrollTrigger: { trigger: svg, start: "top bottom", end: "bottom 30%", scrub: 0.8 },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div aria-hidden="true" className="relative -mt-px w-full overflow-hidden" style={{ background }}>
      <svg ref={ref} viewBox="0 0 1000 260" preserveAspectRatio="none" className="block h-[clamp(110px,18vw,260px)] w-full">
        <rect x="0" y="0" width="1000" height="22" fill={paint} />
        {DRIPS.map(([x, length, width]) => (
          <g key={x} data-drip style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
            <path
              fill={paint}
              d={`M${x - width / 2 - 14} 0 Q${x - width / 2} 20 ${x - width / 2} 34 L${x - width / 2} ${length} a${width / 2} ${width / 2} 0 0 0 ${width} 0 L${x + width / 2} 34 Q${x + width / 2} 20 ${x + width / 2 + 14} 0 Z`}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
