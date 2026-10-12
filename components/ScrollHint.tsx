"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import { gsap } from "gsap";
import { SCROLL_HINT_FADE_END } from "@/lib/chapters";

export type ScrollHintHandle = {
  /** Receives the hero scroll progress (0..1); hides the hint after SCROLL_HINT_FADE_END. */
  setScroll: (progress: number) => void;
};

type ScrollHintProps = { label: string; ref?: Ref<ScrollHintHandle> };

/** "Scroll to explore" label with a looping red line, bottom center. */
export default function ScrollHint({ label, ref }: ScrollHintProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = useRef(true);

  useImperativeHandle(
    ref,
    () => ({
      setScroll(progress: number) {
        const show = progress < SCROLL_HINT_FADE_END;
        if (show === visible.current) return;
        visible.current = show;
        gsap.to(rootRef.current, {
          autoAlpha: show ? 1 : 0,
          y: show ? 0 : 10,
          duration: 0.6,
          ease: "power3.out",
          overwrite: true,
        });
      },
    }),
    [],
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
    >
      <span className="label text-[11px] text-ink min-[900px]:text-[11px]">{label}</span>
      <span className="hint-line" />
    </div>
  );
}
