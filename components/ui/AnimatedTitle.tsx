"use client";

import { useEffect, useRef, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type AnimatedTitleProps = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Index of the word painted in the accent color (red by default). */
  accentWord?: number;
  accentClassName?: string;
  /** Play when this element enters instead of the title itself (useful inside pinned stages). */
  play?: boolean;
};

/**
 * Headline whose words fly in from depth, one after another (3D rotate + translate).
 * Plays when it scrolls into view, or when `play` becomes true if it is controlled.
 */
export default function AnimatedTitle({
  text,
  as: Tag = "h2",
  className = "",
  accentWord,
  accentClassName = "text-red",
  play,
}: AnimatedTitleProps) {
  const ref = useRef<HTMLElement>(null);
  const controlled = play !== undefined;

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = root.querySelectorAll<HTMLElement>("[data-word]");
    gsap.set(words, {
      opacity: 0,
      transform: "translate3d(10px, 51px, -60px) rotateY(60deg) rotateX(-40deg)",
    });
    if (controlled) return;
    const tween = gsap.to(words, {
      opacity: 1,
      transform: "translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)",
      duration: 1.1,
      stagger: 0.05,
      ease: "power3.out",
      paused: true,
    });
    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top 85%",
      onEnter: () => tween.play(),
      onLeaveBack: () => tween.reverse(),
    });
    return () => {
      trigger.kill();
      tween.kill();
    };
  }, [controlled, text]);

  useEffect(() => {
    const root = ref.current;
    if (!root || !controlled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = root.querySelectorAll<HTMLElement>("[data-word]");
    gsap.to(words, {
      opacity: play ? 1 : 0,
      transform: play
        ? "translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)"
        : "translate3d(10px, 51px, -60px) rotateY(60deg) rotateX(-40deg)",
      duration: play ? 1.1 : 0.4,
      stagger: play ? 0.05 : 0,
      ease: "power3.out",
      overwrite: true,
    });
  }, [controlled, play]);

  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className} style={{ perspective: "1000px" }} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          data-word
          aria-hidden="true"
          className={`inline-block will-change-transform ${i === accentWord ? accentClassName : ""}`}
          style={{ marginRight: i < words.length - 1 ? "0.25em" : undefined, transformOrigin: "50% 50% -50px" }}
        >
          {word}
        </span>
      ))}
    </Tag>
  );
}
