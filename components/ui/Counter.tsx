"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type CounterProps = { value: number; suffix?: string; className?: string };

/** Number that counts up from 0 the first time it scrolls into view. */
export default function Counter({ value, suffix = "", className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const state = { n: 0 };
    el.textContent = `0${suffix}`;
    const tween = gsap.to(state, {
      n: value,
      duration: 2,
      ease: "power3.out",
      paused: true,
      onUpdate: () => {
        el.textContent = `${Math.round(state.n)}${suffix}`;
      },
    });
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => tween.play(),
    });
    return () => {
      trigger.kill();
      tween.kill();
      el.textContent = `${value}${suffix}`;
    };
  }, [value, suffix]);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {value}
      {suffix}
    </span>
  );
}
