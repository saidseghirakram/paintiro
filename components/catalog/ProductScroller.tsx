"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ProductCard } from "@/lib/catalog";
import type { Locale } from "@/lib/content";
import type { CatalogContent } from "@/lib/content-catalog";
import { getSiteState } from "@/lib/store";
import Icon from "../ui/Icon";

gsap.registerPlugin(ScrollTrigger);

type ProductScrollerProps = {
  locale: Locale;
  products: ProductCard[];
  copy: CatalogContent;
  reducedMotion: boolean;
  /** Opens the product page; `from` is the element the transition curtain grows from. */
  onOpen: (e: MouseEvent<HTMLAnchorElement>, product: ProductCard, from?: Element) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Full-screen product showcase. The stage pins under the category rail and the scroll
 * scrubs from one product to the next (one product per screen, snapping on each):
 * the pack spins out and the next one rises in, the giant name slides across,
 * texts roll through their masks and the background takes the product color.
 */
export default function ProductScroller({ locale, products, copy, reducedMotion, onOpen }: ProductScrollerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const count = products.length;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reducedMotion) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(stage);
      const images = q<HTMLElement>("[data-img]");
      const words = q<HTMLElement>("[data-word]");
      const metas = q<HTMLElement>("[data-meta]");
      const lines = products.map((_, i) => q<HTMLElement>(`[data-line="${i}"]`));
      const dots = q<HTMLElement>("[data-dot]");
      const counter = stage.querySelector<HTMLElement>("[data-counter]");
      const bar = stage.querySelector<HTMLElement>("[data-bar]");
      const bg = stage.querySelector<HTMLElement>("[data-bg]");

      // Everything but the first product waits off stage.
      images.forEach((el, i) => i > 0 && gsap.set(el, { opacity: 0, yPercent: 70, rotate: 24, scale: 0.6 }));
      words.forEach((el, i) => i > 0 && gsap.set(el, { opacity: 0, xPercent: 40 }));
      lines.forEach((group, i) => i > 0 && gsap.set(group, { yPercent: 110 }));

      let active = -1;
      const setActive = (i: number) => {
        if (i === active) return;
        active = i;
        metas.forEach((el, k) => {
          el.style.pointerEvents = k === i ? "auto" : "none";
          el.setAttribute("aria-hidden", k === i ? "false" : "true");
        });
        dots.forEach((el, k) => el.toggleAttribute("data-active", k === i));
        if (counter) counter.textContent = pad(i + 1);
      };
      setActive(0);

      // Entrance of the stage itself (wrappers only, the scrubbed elements stay free).
      gsap
        .timeline({ scrollTrigger: { trigger: stage, start: "top 75%", once: true } })
        .from(q("[data-intro-img]"), { yPercent: 35, opacity: 0, duration: 1.3, ease: "power4.out" })
        .from(q("[data-intro-word]"), { opacity: 0, scale: 1.15, duration: 1.4, ease: "power3.out" }, 0)
        .from(q("[data-intro-text]"), { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out" }, 0.3);

      // Idle float of the packs.
      gsap.to(q("[data-float]"), { y: -14, rotate: 1.5, duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true });

      if (count < 2) return;

      // One timeline unit = one product change.
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      for (let i = 0; i < count - 1; i++) {
        const next = i + 1;
        tl.to(images[i], { opacity: 0, yPercent: -60, rotate: -22, scale: 0.6, duration: 0.5, ease: "power2.in" }, i)
          .fromTo(
            images[next],
            { opacity: 0, yPercent: 70, rotate: 24, scale: 0.6 },
            { opacity: 1, yPercent: 0, rotate: 0, scale: 1, duration: 0.55, ease: "power3.out", immediateRender: false },
            i + 0.4,
          )
          .to(words[i], { opacity: 0, xPercent: -40, duration: 0.6 }, i)
          .fromTo(words[next], { opacity: 0, xPercent: 40 }, { opacity: 1, xPercent: 0, duration: 0.6, immediateRender: false }, i + 0.35)
          .to(lines[i], { yPercent: -110, duration: 0.35, stagger: 0.04, ease: "power2.in" }, i)
          .fromTo(
            lines[next],
            { yPercent: 110 },
            { yPercent: 0, duration: 0.4, stagger: 0.05, ease: "power3.out", immediateRender: false },
            i + 0.5,
          )
          .to(bg, { backgroundColor: products[next].accent, duration: 0.7 }, i + 0.15);
      }
      tl.set({}, {}, count - 1);

      triggerRef.current = ScrollTrigger.create({
        trigger: stage,
        animation: tl,
        pin: true,
        anticipatePin: 1,
        start: () => `top ${getComputedStyle(stage).getPropertyValue("--rail-h") || "64px"}`,
        end: () => `+=${(count - 1) * window.innerHeight * 0.85}`,
        scrub: 0.9,
        invalidateOnRefresh: true,
        snap: { snapTo: 1 / (count - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: "power2.inOut" },
        onUpdate: (self) => {
          setActive(Math.round(self.progress * (count - 1)));
          if (bar) bar.style.transform = `scaleX(${self.progress})`;
        },
      });
    }, stage);

    ScrollTrigger.refresh();
    return () => {
      triggerRef.current = null;
      ctx.revert();
    };
  }, [products, count, reducedMotion]);

  /** Dots: jump to the scroll position of one product. */
  const goTo = (i: number) => {
    const st = triggerRef.current;
    if (!st || count < 2) return;
    const y = st.start + ((st.end - st.start) * i) / (count - 1);
    const lenis = getSiteState().lenis;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (reducedMotion) return <StaticList locale={locale} products={products} copy={copy} />;

  return (
    <div ref={rootRef} data-item className="-mx-[var(--nav-px)]">
      <div
        ref={stageRef}
        className="relative h-[calc(100svh-var(--rail-h,64px))] min-h-[560px] overflow-hidden"
        style={{ background: products[0]?.accent }}
      >
        <div data-bg aria-hidden="true" className="absolute inset-0" style={{ background: products[0]?.accent }} />
        {/* Soft light from the top */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.55),transparent_60%)]" />

        {/* Giant names behind the pack */}
        <div data-intro-word aria-hidden="true" className="absolute inset-x-0 top-[16%] min-[900px]:top-[12%]">
          {products.map((product) => (
            <div key={product.id} data-word className="absolute inset-x-0 flex justify-center">
              <span className="font-heading whitespace-nowrap text-[clamp(90px,19vw,340px)] leading-none tracking-[-0.04em] text-white/80">
                {product.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Packs */}
        <div
          data-intro-img
          className="absolute left-1/2 top-[8%] h-[52%] w-[80%] -translate-x-1/2 min-[900px]:top-[16%] min-[900px]:h-[60%] min-[900px]:w-[36%]"
        >
          <div data-float className="relative size-full">
            {products.map((product, i) => (
              <div key={product.id} data-img className="absolute inset-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 900px) 36vw, 80vw"
                  className="object-contain drop-shadow-[0_50px_45px_rgba(0,0,0,0.22)]"
                />
              </div>
            ))}
          </div>
          <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-8 w-1/2 -translate-x-1/2 rounded-[50%] bg-black/20 blur-2xl" />
        </div>

        {/* Name + tagline (bottom left) */}
        <div data-intro-text className="absolute inset-x-5 bottom-[118px] min-[900px]:bottom-12 min-[900px]:left-12 min-[900px]:right-auto min-[900px]:w-[min(460px,34vw)]">
          {products.map((product, i) => (
            <div key={product.id} className="absolute inset-x-0 bottom-0">
              <div className="overflow-hidden">
                <p data-line={i} className="label flex items-center gap-3 text-red">
                  <span className="tabular">{pad(i + 1)}</span>
                  <span className="block h-px w-6 bg-red" aria-hidden="true" />
                  {product.tag}
                </p>
              </div>
              <div className="mt-3 overflow-hidden pb-[0.08em]">
                <h3 data-line={i} className="font-heading text-[clamp(40px,4.4vw,76px)] font-normal leading-[0.95] text-ink">
                  {product.name}
                </h3>
              </div>
              <div className="mt-3 overflow-hidden">
                <p data-line={i} className="text-[15px] leading-relaxed text-ink/70">
                  {product.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Specs + CTA (bottom right) */}
        <div data-intro-text className="absolute inset-x-5 bottom-6 min-[900px]:bottom-12 min-[900px]:left-auto min-[900px]:right-12">
          {products.map((product, i) => (
            <div key={product.id} data-meta className="absolute bottom-0 right-0 flex w-full items-end justify-between gap-6 min-[900px]:w-auto min-[900px]:justify-end min-[900px]:gap-10 gap-3">
              <dl className="flex gap-4 min-[400px]:gap-6 min-[900px]:gap-10">
                {[
                  { label: copy.category.specFinish, value: product.finishLabel },
                  { label: copy.category.specCoverage, value: `${product.coverage} ${product.coverageUnit}` },
                  { label: copy.category.specSizes, value: product.sizes.join(" · ") },
                ].map((spec) => (
                  <div key={spec.label} className="overflow-hidden">
                    <div data-line={i}>
                      <dt className="label text-[10px] text-ink/50 min-[900px]:text-[10px]">{spec.label}</dt>
                      <dd className="mt-2 whitespace-nowrap text-[14px] font-medium text-ink min-[900px]:text-[15px]">{spec.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <div className="overflow-hidden p-1">
                <Link
                  data-line={i}
                  href={`/${locale}/products/${product.id}`}
                  onClick={(e) => onOpen(e, product, stageRef.current ?? undefined)}
                  aria-label={`${copy.category.details}: ${product.name}`}
                  className="group flex size-14 items-center justify-center rounded-full bg-ink text-white transition-colors duration-500 hover:bg-red min-[900px]:size-[88px]"
                >
                  <Icon name="arrow" size={22} className="transition-transform duration-500 group-hover:-rotate-45" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Counter + dots (right edge) and progress (top) */}
        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 min-[900px]:right-12 min-[900px]:flex">
          {products.map((product, i) => (
            <button
              key={product.id}
              type="button"
              data-dot
              onClick={() => goTo(i)}
              aria-label={product.name}
              className="group flex items-center gap-3 text-ink/40 transition-colors duration-300 hover:text-ink data-[active]:text-ink"
            >
              <span className="label translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 group-data-[active]:translate-x-0 group-data-[active]:opacity-100">
                {product.name}
              </span>
              <span className="block h-px w-5 bg-current transition-all duration-500 group-data-[active]:w-10 group-data-[active]:bg-red" />
            </button>
          ))}
        </div>
        <div className="absolute inset-x-5 top-5 flex items-center gap-4 min-[900px]:inset-x-12 min-[900px]:top-8">
          <span className="label tabular text-ink">
            <span data-counter className="text-red">
              01
            </span>{" "}
            / {pad(count)}
          </span>
          <span className="relative block h-px flex-1 bg-ink/15">
            <span data-bar className="absolute inset-0 origin-left bg-red" style={{ transform: count < 2 ? "scaleX(1)" : "scaleX(0)" }} />
          </span>
          {count > 1 && <span className="label hidden text-ink/50 min-[600px]:inline">{copy.category.scrollHint}</span>}
        </div>
      </div>
    </div>
  );
}

/** Reduced motion: the same information as calm stacked panels. */
function StaticList({ locale, products, copy }: Pick<ProductScrollerProps, "locale" | "products" | "copy">) {
  return (
    <ul className="grid gap-6 pt-10">
      {products.map((product, i) => (
        <li key={product.id} data-item>
          <Link
            href={`/${locale}/products/${product.id}`}
            className="grid items-center gap-6 p-6 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:p-12"
            style={{ background: product.accent }}
          >
            <span className="relative block aspect-square max-h-[420px]">
              <Image src={product.image} alt="" fill sizes="(min-width: 900px) 40vw, 90vw" className="object-contain" />
            </span>
            <span>
              <span className="label tabular block text-red">
                {pad(i + 1)} · {product.tag}
              </span>
              <span className="font-heading mt-3 block text-[clamp(40px,4.4vw,76px)] leading-none text-ink">{product.name}</span>
              <span className="mt-3 block text-[15px] text-ink/70">{product.tagline}</span>
              <span className="label mt-6 block text-ink">
                {product.finishLabel} · {product.coverage} {product.coverageUnit} · {product.sizes.join(" · ")}
              </span>
              <span className="label mt-8 inline-flex items-center gap-3 text-ink">
                {copy.category.details}
                <Icon name="arrow" size={14} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
