"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SectionsContent } from "@/lib/content-sections";
import { getProduct, type ProductId } from "@/lib/products";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Counter from "../ui/Counter";
import Icon from "../ui/Icon";

gsap.registerPlugin(ScrollTrigger);

type WhyPaintiroProps = { content: SectionsContent["why"] };

/** Look of each stacked card (cycled if there are more benefits). */
const CARD_STYLES: { bg: string; fg: string; muted: string; accent: string; product: ProductId }[] = [
  { bg: "#FFFFFF", fg: "#141414", muted: "rgba(20,20,20,0.6)", accent: "#E8372C", product: "irovella" },
  { bg: "#E8372C", fg: "#FFFFFF", muted: "rgba(255,255,255,0.8)", accent: "#FFFFFF", product: "fix-one" },
  { bg: "#141414", fg: "#FFFFFF", muted: "rgba(255,255,255,0.65)", accent: "#E8372C", product: "plafonya" },
  { bg: "#EFEAE0", fg: "#141414", muted: "rgba(20,20,20,0.6)", accent: "#E8372C", product: "irocryl-4l" },
  { bg: "#E8372C", fg: "#FFFFFF", muted: "rgba(255,255,255,0.8)", accent: "#FFFFFF", product: "irofacade" },
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 09 — Why PAINTIRO. Benefits as full-width cards that stack while scrolling:
 * each new card slides over the previous one, which shrinks back and darkens.
 * Then three key numbers count up over a red line that draws itself.
 */
export default function WhyPaintiro({ content }: WhyPaintiroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-why-card]");
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        const inner = card.querySelector<HTMLElement>("[data-why-inner]");
        const shade = card.querySelector<HTMLElement>("[data-why-shade]");
        const product = card.querySelector<HTMLElement>("[data-why-product]");

        // Product floats up as its card arrives.
        if (product) {
          gsap.fromTo(
            product,
            { yPercent: 18, rotation: -6 },
            {
              yPercent: -6,
              rotation: 4,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
        if (!next || !inner || !shade) return;
        // Covered card recedes while the next one slides over it.
        gsap.to(inner, {
          scale: 0.9,
          ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: true },
        });
        gsap.to(shade, {
          opacity: 0.45,
          ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: true },
        });
      });

      gsap.from("[data-why-line]", {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
      gsap.fromTo(
        "[data-why-rule]",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-why-rule]", start: "top 90%", end: "top 50%", scrub: true },
        },
      );
    }, section);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} id="why" aria-label={content.title} className="relative bg-[#F6F5F2] py-24 min-[900px]:py-36">
      <div className="mx-auto max-w-[1600px] px-[var(--nav-px)]">
        <div className="overflow-hidden">
          <p data-why-line className="label tabular flex items-center gap-3 text-muted">
            <span className="text-red">09</span>
            <span className="block h-px w-8 bg-red" aria-hidden="true" />
            <span>{content.eyebrow}</span>
          </p>
        </div>
        <div className="mt-5 overflow-hidden pb-[0.06em]">
          <h2 data-why-line className="font-heading max-w-[14ch] text-[clamp(44px,6vw,104px)] font-normal leading-[1.0] text-ink">
            {content.title}
          </h2>
        </div>

        {/* Stacking cards */}
        <div className="mt-16 flex flex-col gap-[12svh] min-[900px]:mt-24">
          {content.items.map((item, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            const product = getProduct(style.product);
            return (
              <article
                key={item.title}
                data-why-card
                className={reducedMotion ? "" : "sticky"}
                style={reducedMotion ? undefined : { top: `calc(var(--nav-h) + ${16 + i * 14}px)` }}
              >
                <div
                  data-why-inner
                  className="relative grid min-h-[min(72svh,640px)] origin-top overflow-hidden p-7 will-change-transform min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] min-[900px]:p-14"
                  style={{ background: style.bg, color: style.fg, boxShadow: "0 30px 80px -40px rgba(20,20,20,0.35)" }}
                >
                  {/* Huge outlined number */}
                  <span
                    aria-hidden="true"
                    className="font-heading tabular pointer-events-none absolute -bottom-[0.18em] right-[2%] select-none text-[clamp(160px,26vw,420px)] leading-none"
                    style={{ color: "transparent", WebkitTextStroke: `1px ${style.muted}`, opacity: 0.55 }}
                  >
                    {pad(i + 1)}
                  </span>

                  <div className="relative z-10 flex flex-col justify-between gap-10">
                    <div className="flex items-center gap-4">
                      <span
                        className="flex size-14 items-center justify-center rounded-full border min-[900px]:size-16"
                        style={{ borderColor: style.accent, color: style.accent }}
                      >
                        <Icon name={item.icon} size={28} strokeWidth={1.1} />
                      </span>
                      <span className="label tabular" style={{ color: style.muted }}>
                        {pad(i + 1)} / {pad(content.items.length)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-heading text-[clamp(44px,6vw,110px)] font-normal leading-[0.95]">{item.title}</h3>
                      <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed min-[900px]:text-[17px]" style={{ color: style.muted }}>
                        {item.text}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 flex items-end justify-center min-[900px]:mt-0">
                    <div data-why-product className="relative h-[min(34svh,300px)] w-full min-[900px]:h-[min(52svh,460px)]">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="(min-width: 900px) 40vw, 80vw"
                        className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.3)]"
                      />
                    </div>
                  </div>

                  {/* Darkens while covered by the next card */}
                  <div data-why-shade aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-ink opacity-0" />
                </div>
              </article>
            );
          })}
        </div>

        {/* Key numbers */}
        <div className="mt-24 min-[900px]:mt-36">
          <span data-why-rule aria-hidden="true" className="block h-px origin-left bg-red" />
          <dl className="grid grid-cols-3 gap-4 pt-10">
            {content.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <Counter
                    value={stat.value}
                    suffix={stat.suffix}
                    className="font-heading block text-[clamp(48px,9vw,150px)] leading-none text-ink"
                  />
                  <span className="label mt-4 block text-[10px] text-muted min-[900px]:text-[12px]" aria-hidden="true">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
