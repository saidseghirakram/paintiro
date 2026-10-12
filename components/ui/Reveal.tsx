"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Children marked with data-reveal animate one after another. */
  stagger?: number;
  delay?: number;
  /** Distance travelled upwards, in px. */
  y?: number;
  id?: string;
};

/**
 * Fades its [data-reveal] children (or itself when there are none) up into place
 * the first time they enter the viewport. Respects prefers-reduced-motion.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className,
  stagger = 0.08,
  delay = 0,
  y = 32,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const marked = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const targets = marked.length ? Array.from(marked) : [root];

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y });
      ScrollTrigger.batch(targets, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1.1,
            delay,
            stagger,
            ease: "power3.out",
            overwrite: true,
          }),
      });
    }, root);
    return () => ctx.revert();
  }, [stagger, delay, y]);

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
