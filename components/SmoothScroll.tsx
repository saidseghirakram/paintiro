"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setSiteState } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger and Lenis
 * share one clock. Disabled when the user prefers reduced motion.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Avoid ScrollTrigger refreshes when the mobile browser bar shows / hides.
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Every in-page "#section" link scrolls smoothly, offset by nothing (sections own their spacing).
      anchors: { duration: 1.6 },
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    setSiteState({ lenis });

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setSiteState({ lenis: null });
    };
  }, []);

  return <>{children}</>;
}
