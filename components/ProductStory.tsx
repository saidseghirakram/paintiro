"use client";

import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { gsap } from "gsap";
import { getActiveProduct, FINALE_START, PRODUCT_TEXT_START, PRODUCTS } from "@/lib/chapters";
import type { ProductCopy } from "@/lib/content";

export type ProductStoryHandle = {
  /** Receives the hero scroll progress and the story progress of the sequence. */
  update: (scrollProgress: number, frameProgress: number) => void;
};

type ProductStoryProps = {
  products: ProductCopy[];
  ref?: Ref<ProductStoryHandle>;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Editorial texts around the product on show (Klimt Wine style):
 * - a giant serif "01 IROVELLA" band behind the product, over a hairline rule,
 *   whose letters roll out upwards and the next name rolls in from below;
 * - a left column with the product promise in large type;
 * - a right column with the name, the features and the pack size.
 */
export default function ProductStory({ products, ref }: ProductStoryProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const targetRef = useRef(0);
  const shownRef = useRef(0);
  const visible = useRef(false);
  const leaving = useRef<gsap.core.Timeline | null>(null);
  const firstSwap = useRef(true);

  useImperativeHandle(
    ref,
    () => ({
      update(scrollProgress: number, frameProgress: number) {
        const index = getActiveProduct(frameProgress);
        if (index !== targetRef.current) {
          targetRef.current = index;
          // Roll the current texts out, then swap (the new ones roll in on render).
          leaving.current?.kill();
          leaving.current = gsap
            .timeline({
              onComplete: () => {
                // Scrolled back to the same product before the swap: just roll it back in.
                if (targetRef.current === shownRef.current) rollIn();
                shownRef.current = targetRef.current;
                setShown(targetRef.current);
              },
            })
            .to(titleRef.current?.querySelectorAll("[data-letter]") ?? [], {
              yPercent: -110,
              duration: 0.38,
              stagger: 0.012,
              ease: "power3.in",
            })
            .to(
              columnsRef.current?.querySelectorAll("[data-story-line]") ?? [],
              { yPercent: -105, opacity: 0, duration: 0.32, stagger: 0.02, ease: "power3.in" },
              0,
            );
        }
        const show = scrollProgress >= PRODUCT_TEXT_START && frameProgress <= FINALE_START;
        if (show !== visible.current) {
          visible.current = show;
          gsap.to([titleRef.current, columnsRef.current], {
            autoAlpha: show ? 1 : 0,
            duration: 0.6,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      },
    }),
    [],
  );

  // New product: letters roll in from below, column lines slide up from their masks.
  useLayoutEffect(() => {
    if (firstSwap.current) {
      firstSwap.current = false;
      return;
    }
    const ctx = gsap.context(rollIn);
    return () => ctx.revert();
  }, [shown]);

  function rollIn() {
    gsap.fromTo(
      titleRef.current?.querySelectorAll("[data-letter]") ?? [],
      { yPercent: 110 },
      { yPercent: 0, duration: 0.9, stagger: 0.022, ease: "power4.out" },
    );
    gsap.fromTo(
      columnsRef.current?.querySelectorAll("[data-story-line]") ?? [],
      { yPercent: 105, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power3.out", delay: 0.1 },
    );
  }

  const copy = products[shown];
  const product = PRODUCTS[shown];
  const letters = [...`${pad(shown + 1)} ${product.name}`];

  return (
    <>
      {/* Title band: behind the 3D product (the canvas sits above it). */}
      <div
        ref={titleRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute inset-x-0 top-[calc(var(--nav-h)+1svh)] z-[1] opacity-0"
      >
        <p className="overflow-hidden whitespace-nowrap px-[var(--nav-px)] pb-[0.06em] font-heading text-[clamp(44px,13vw,64px)] font-normal leading-[0.95] tracking-[-0.02em] text-ink min-[900px]:text-[clamp(72px,9.2vw,168px)]">
          {letters.map((letter, i) => (
            <span key={`${shown}-${i}`} data-letter className="inline-block will-change-transform">
              {letter === " " ? " " : letter}
            </span>
          ))}
        </p>
        <div className="mt-2 h-px w-full bg-ink/20 min-[900px]:mt-3" />
        <div className="label tabular mt-3 flex items-center justify-between px-[var(--nav-px)] text-[11px] text-ink">
          <span className="flex items-center gap-3">
            <span className="block h-[7px] w-[7px] rounded-full bg-red" />
            {copy.tag}
          </span>
          <span className="hidden text-muted min-[900px]:block min-[900px]:pr-[18vw]">{copy.size}</span>
        </div>
      </div>

      {/* Columns: left promise, right details (above the canvas). */}
      <div
        ref={columnsRef}
        aria-live="polite"
        className="pointer-events-none invisible absolute inset-0 z-10 opacity-0"
      >
        <h2 className="sr-only">{product.name}</h2>

        <div className="absolute inset-x-6 bottom-[calc(max(24px,env(safe-area-inset-bottom))+84px)] text-center min-[900px]:inset-x-auto min-[900px]:bottom-auto min-[900px]:left-[var(--nav-px)] min-[900px]:top-[46%] min-[900px]:w-[min(25vw,400px)] min-[900px]:text-left">
          <div className="overflow-hidden pb-[0.1em]">
            <p
              data-story-line
              className="font-body text-[16px] leading-snug text-ink min-[900px]:text-[clamp(20px,1.75vw,30px)] min-[900px]:leading-[1.2]"
            >
              {copy.description}
            </p>
          </div>
        </div>

        <div className="absolute right-[var(--nav-px)] top-[46%] hidden w-[min(25vw,380px)] min-[900px]:block">
          <div className="overflow-hidden pb-[0.1em]">
            <h3
              data-story-line
              className="font-body text-[clamp(20px,1.6vw,28px)] font-normal leading-tight text-ink"
            >
              PAINTIRO {product.name}
            </h3>
          </div>
          <ul className="mt-5">
            {copy.features.map((feature) => (
              <li key={`${shown}-${feature}`} className="overflow-hidden">
                <span data-story-line className="block py-[3px] font-body text-[14px] leading-relaxed text-ink/75">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 overflow-hidden">
            <a
              data-story-line
              href="#solutions"
              className="pointer-events-auto label inline-flex items-center gap-3 border-b border-ink/40 pb-1 text-[11px] text-ink transition-colors hover:border-red hover:text-red"
            >
              {copy.size}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
