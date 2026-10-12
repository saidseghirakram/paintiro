"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { gsap } from "gsap";
import { getActiveProduct, FINALE_START, PRODUCTS } from "@/lib/chapters";

export type ProductIndicatorHandle = {
  /** Receives the story progress (0..1) of the sequence. */
  setFrameProgress: (frameProgress: number) => void;
};

type ProductIndicatorProps = {
  label: string;
  /** Jump to a product (index in PRODUCTS). */
  onSelect?: (index: number) => void;
  ref?: Ref<ProductIndicatorHandle>;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Story progress before which the pill stays hidden (hero title phase). */
const SHOW_FROM = 0.008;

/**
 * Bottom-center product pill (Klimt Wine style): thumbnail + current name +
 * chevron. Opens a list of every product to jump straight to one.
 * Hidden during the title and once the final lineup starts.
 */
export default function ProductIndicator({ label, onSelect, ref }: ProductIndicatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const activeRef = useRef(0);
  const visible = useRef(false);
  const firstSwap = useRef(true);

  useImperativeHandle(
    ref,
    () => ({
      setFrameProgress(frameProgress: number) {
        const index = getActiveProduct(frameProgress);
        if (index !== activeRef.current) {
          activeRef.current = index;
          setActive(index);
        }
        const show = frameProgress > SHOW_FROM && frameProgress <= FINALE_START;
        if (show !== visible.current) {
          visible.current = show;
          if (!show) setOpen(false);
          gsap.to(rootRef.current, {
            autoAlpha: show ? 1 : 0,
            y: show ? 0 : 16,
            duration: 0.6,
            ease: "power3.out",
            overwrite: true,
          });
        }
      },
    }),
    [],
  );

  // Name swap: slides up from its mask.
  useLayoutEffect(() => {
    if (firstSwap.current) {
      firstSwap.current = false;
      return;
    }
    const tween = gsap.fromTo(nameRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "power3.out" });
    return () => {
      tween.kill();
    };
  }, [active]);

  // List opening: items rise with a stagger.
  useLayoutEffect(() => {
    if (!open || !listRef.current) return;
    const tween = gsap.fromTo(
      listRef.current.children,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "power3.out" },
    );
    return () => {
      tween.kill();
    };
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const product = PRODUCTS[active];

  return (
    <div
      ref={rootRef}
      className="invisible absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 opacity-0"
    >
      {open && (
        <ul
          ref={listRef}
          className="absolute bottom-[calc(100%+10px)] left-1/2 w-[260px] -translate-x-1/2 rounded-[22px] bg-white/90 p-2 shadow-[0_18px_50px_-20px_rgba(20,20,20,0.45)] backdrop-blur-md"
        >
          {PRODUCTS.map((item, i) => (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect?.(i);
                }}
                className={`flex w-full items-center gap-3 rounded-full px-2 py-1.5 text-left transition-colors hover:bg-ink/5 ${
                  i === active ? "bg-ink/5" : ""
                }`}
              >
                <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-full bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.photo} alt="" className="h-full w-full object-contain p-1" />
                </span>
                <span className="label tabular text-[10px] text-red">{pad(i + 1)}</span>
                <span className="font-body text-[14px] text-ink">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        aria-label={`${label}: ${product.name}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full bg-white/90 py-1.5 pl-1.5 pr-2 shadow-[0_12px_40px_-18px_rgba(20,20,20,0.45)] backdrop-blur-md transition-transform duration-300 hover:scale-[1.03]"
      >
        <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={product.photo + active} src={product.photo} alt="" className="h-full w-full object-contain p-1" />
        </span>
        <span className="relative block min-w-[7.5em] overflow-hidden text-left">
          <span ref={nameRef} className="block font-body text-[15px] text-ink">
            {product.name}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
