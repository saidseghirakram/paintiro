"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { ProductCard, ProductDetail } from "@/lib/catalog";
import { SWATCHES, type Swatch } from "@/lib/colors";
import type { Locale } from "@/lib/content";
import type { CatalogContent } from "@/lib/content-catalog";
import type { SectionsContent } from "@/lib/content-sections";
import { getSiteState } from "@/lib/store";
import { coverWithCurtain, releaseCurtain, resetScroll } from "@/lib/transition";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Icon from "../ui/Icon";
import ProductModelViewer from "./ProductModelViewer";

gsap.registerPlugin(ScrollTrigger, SplitText);

type Solution = SectionsContent["solutions"]["items"][number];

type ProductDetailViewProps = {
  locale: Locale;
  product: ProductDetail;
  related: ProductCard[];
  solutions: Solution[];
  copy: CatalogContent;
};

type TabKey = keyof CatalogContent["product"]["tabs"];

const pad = (n: number) => String(n).padStart(2, "0");
const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
const TRANSPARENT_SWATCH: Swatch = { code: "—", hex: "#F4F2EE", name: { en: "Transparent", fr: "Transparent" }, family: "whites" };

/** Gallery mosaic: column span and aspect ratio per position (repeats every 4 photos). */
const MOSAIC = [
  "min-[900px]:col-span-7 aspect-[4/3]",
  "min-[900px]:col-span-5 aspect-[3/4] min-[900px]:mt-28",
  "min-[900px]:col-span-5 aspect-square",
  "min-[900px]:col-span-7 aspect-[16/10] min-[900px]:-mt-20",
];

/**
 * Product page body: hero with the pack floating over a paint blob, sticky tabs,
 * key figures, story, technical sheet, application steps, colors, gallery, related products.
 */
export default function ProductDetailView({ locale, product, related, solutions, copy }: ProductDetailViewProps) {
  const t = copy.product;
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const swatches = product.colors
    .map((code) => SWATCHES.find((s) => s.code === code))
    .filter((s): s is Swatch => Boolean(s));
  const [swatch, setSwatch] = useState<Swatch>(swatches[0] ?? TRANSPARENT_SWATCH);
  const [size, setSize] = useState(product.sizes.at(-1) ?? "");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const packRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabLineRef = useRef<HTMLSpanElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const tabs: { key: TabKey; id: string }[] = [
    { key: "overview", id: "overview" },
    { key: "specs", id: "specs" },
    { key: "application", id: "application" },
    { key: "colors", id: "colors" },
    { key: "gallery", id: "gallery" },
  ];
  const usedIn = solutions.filter((s) => product.categories.includes(s.slug));
  const mainCategory = usedIn[0];

  // Arrival
  useEffect(() => {
    resetScroll();
    releaseCurtain();
    document.title = `${product.name} — PAINTIRO`;
  }, [product.name]);

  // ------------------------------------------------------------------
  // Hero: the circle, the ring and the 3D pack stay fixed in place; only the pack
  // turns on itself (inside ProductModelViewer) and the ring turns around it.
  // ------------------------------------------------------------------
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return;

    const ctx = gsap.context(() => {
      const split = SplitText.create("[data-hero-name]", { type: "words,chars", mask: "chars" });
      gsap.set([blobRef.current, ringRef.current, "[data-visual-line]"], { transformOrigin: "50% 50%" });

      const tl = gsap.timeline({ delay: 0.3, defaults: { ease: "power3.out" } });
      tl.from(blobRef.current, { scale: 0.55, opacity: 0, duration: 1.3 }, 0)
        .from("[data-visual-line]", { scale: 0.8, opacity: 0, duration: 1.4 }, 0.1)
        .from(ringRef.current, { scale: 0.85, opacity: 0, duration: 1.4 }, 0.2)
        .from(packRef.current, { yPercent: 18, scale: 0.85, opacity: 0, duration: 1.3, ease: "power4.out" }, 0.25)
        .from(split.chars, { yPercent: 110, duration: 1, stagger: 0.03, ease: "power4.out" }, 0.2)
        .from("[data-hero-line]", { y: 24, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.5);

      // The ring turns slowly (a turning circle never misaligns).
      gsap.to(ringRef.current, { rotate: 360, duration: 60, ease: "none", repeat: -1 });

      // Scroll: only the text drifts; the visual stays fixed.
      gsap.to("[data-hero-copy]", {
        yPercent: -14,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "30% top", end: "bottom top", scrub: 1 },
      });
    }, hero);

    return () => ctx.revert();
  }, [reducedMotion]);

  // The blob and the color wall take the selected shade.
  useEffect(() => {
    const duration = reducedMotion ? 0 : 0.9;
    gsap.to(blobRef.current, { backgroundColor: swatch.hex, duration, ease: "power2.inOut" });
    gsap.to(wallRef.current, { backgroundColor: swatch.hex, duration, ease: "power2.inOut" });
  }, [swatch, reducedMotion]);

  // ------------------------------------------------------------------
  // Sections on scroll
  // ------------------------------------------------------------------
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Active tab follows the section in the middle of the screen.
      tabs.forEach((tab) => {
        ScrollTrigger.create({
          trigger: `#${tab.id}`,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActiveTab(tab.key),
        });
      });

      // Counters
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        if (reducedMotion) {
          el.textContent = String(target);
          return;
        }
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(counter.value));
          },
        });
      });

      if (reducedMotion) return;

      // Generic reveal for headings and blocks.
      gsap.utils.toArray<HTMLElement>("[data-reveal-up]").forEach((el) => {
        gsap.from(el, {
          y: 50,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      // Story: each word lights up while the paragraph crosses the screen.
      gsap.utils.toArray<HTMLElement>("[data-scrub-text]").forEach((el) => {
        const split = SplitText.create(el, { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.12 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true },
          },
        );
      });

      // Story photo: clip reveal + inner parallax.
      const storyImage = root.querySelector<HTMLElement>("[data-story-image]");
      if (storyImage) {
        gsap.fromTo(
          storyImage,
          { clipPath: "inset(18% 12% 18% 12%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            ease: "none",
            scrollTrigger: { trigger: storyImage, start: "top 90%", end: "center 55%", scrub: true },
          },
        );
        gsap.fromTo(
          storyImage.querySelector("img"),
          { yPercent: -10, scale: 1.2 },
          {
            yPercent: 10,
            scale: 1.05,
            ease: "none",
            scrollTrigger: { trigger: storyImage, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }

      // Technical sheet: lines draw, values slide.
      gsap.utils.toArray<HTMLElement>("[data-spec-group]").forEach((group) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: group, start: "top 82%", once: true } });
        tl.from(group.querySelectorAll("[data-spec-line]"), {
          scaleX: 0,
          duration: 1,
          stagger: 0.06,
          ease: "power3.inOut",
        }).from(
          group.querySelectorAll("[data-spec-cell]"),
          { yPercent: 100, opacity: 0, duration: 0.7, stagger: 0.03, ease: "power3.out" },
          0.2,
        );
      });

      // Application: the brush stroke paints itself, steps light up when it reaches them.
      const stroke = root.querySelector<SVGPathElement>("[data-stroke]");
      if (stroke) {
        const length = stroke.getTotalLength();
        gsap.set(stroke, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(stroke, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: "#application", start: "top 65%", end: "bottom 70%", scrub: true },
        });
      }
      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: step, start: "top 72%", toggleActions: "play none none reverse" },
        });
        tl.to(step.querySelector("[data-step-dot]"), { backgroundColor: "#E8372C", color: "#fff", scale: 1.08, duration: 0.5, ease: "back.out(2)" })
          .from(step.querySelectorAll("[data-step-text]"), { y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0);
      });

      // Swatches pop in.
      gsap.from("[data-swatch]", {
        scale: 0,
        duration: 0.7,
        stagger: 0.05,
        ease: "back.out(2)",
        scrollTrigger: { trigger: "#colors", start: "top 70%", once: true },
      });

      // Gallery: each photo uncovers from the bottom with a light parallax.
      gsap.utils.toArray<HTMLElement>("[data-gallery-item]").forEach((item) => {
        gsap.fromTo(
          item,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.3,
            ease: "power4.inOut",
            scrollTrigger: { trigger: item, start: "top 85%", once: true },
          },
        );
        gsap.fromTo(
          item.querySelector("img"),
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      // Related cards
      gsap.from("[data-related]", {
        y: 80,
        opacity: 0,
        rotate: (i: number) => (i % 2 ? 2 : -2),
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: "#related", start: "top 75%", once: true },
      });
    }, root);

    // Images and fonts change heights after the first layout.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
    // `tabs` is static for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Tab underline
  const moveTabLine = useCallback(() => {
    const bar = tabsRef.current;
    const line = tabLineRef.current;
    const active = bar?.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`);
    if (!bar || !line || !active) return;
    gsap.to(line, {
      x: active.offsetLeft,
      width: active.offsetWidth,
      duration: reducedMotion ? 0 : 0.6,
      ease: "power3.inOut",
    });
    const scroller = active.parentElement;
    scroller?.scrollTo({ left: active.offsetLeft - 24, behavior: reducedMotion ? "auto" : "smooth" });
  }, [activeTab, reducedMotion]);

  useEffect(() => {
    moveTabLine();
    window.addEventListener("resize", moveTabLine);
    document.fonts?.ready.then(moveTabLine);
    return () => window.removeEventListener("resize", moveTabLine);
  }, [moveTabLine]);

  const goToSection = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const offset = -(tabsRef.current?.offsetHeight ?? 0) + 1;
    const lenis = getSiteState().lenis;
    if (lenis) lenis.scrollTo(`#${id}`, { offset, duration: 1.4 });
    else document.getElementById(id)?.scrollIntoView();
  };

  // ------------------------------------------------------------------
  // Lightbox
  // ------------------------------------------------------------------
  const lightboxOpen = lightbox !== null;
  const galleryCount = product.gallery.length;

  const closeLightbox = () => {
    const box = lightboxRef.current;
    if (!box || reducedMotion) {
      setLightbox(null);
      return;
    }
    gsap.to(box, { opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => setLightbox(null) });
  };
  const closeRef = useRef(closeLightbox);
  useEffect(() => {
    closeRef.current = closeLightbox;
  });

  useEffect(() => {
    if (!lightboxOpen) return;
    const lenis = getSiteState().lenis;
    lenis?.stop();
    const box = lightboxRef.current;
    if (box && !reducedMotion) {
      gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % galleryCount));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + galleryCount) % galleryCount));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [lightboxOpen, galleryCount, reducedMotion]);

  useEffect(() => {
    if (lightbox === null || reducedMotion) return;
    const img = lightboxRef.current?.querySelector("[data-lightbox-image]");
    if (img) gsap.fromTo(img, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" });
  }, [lightbox, reducedMotion]);

  // ------------------------------------------------------------------
  // Related product links
  // ------------------------------------------------------------------
  const openProduct = (e: MouseEvent<HTMLAnchorElement>, card: ProductCard) => {
    if (!isPlainClick(e) || reducedMotion) return;
    e.preventDefault();
    const href = `/${locale}/products/${card.id}`;
    router.prefetch(href);
    const from = e.currentTarget.querySelector("[data-curtain-from]") ?? e.currentTarget;
    coverWithCurtain({ from, color: card.accent, label: card.name }).then(() => router.push(href));
  };

  const figures = [
    { key: "coverage" as const, value: product.figures.coverage, unit: product.coverageUnit },
    { key: "touchDry" as const, value: product.figures.touchDry, unit: t.figureUnits.touchDry },
    { key: "recoat" as const, value: product.figures.recoat, unit: t.figureUnits.recoat },
    { key: "coats" as const, value: product.figures.coats, unit: t.figureUnits.coats },
  ];
  const ringUnit = `${product.name} · ${product.tag} · PAINTIRO · `;
  // Repeat the phrase to fill one turn (~120 characters), so the spacing stays natural.
  const ringText = ringUnit.repeat(Math.max(1, Math.round(120 / ringUnit.length)));

  return (
    <div ref={rootRef} id="top">
      {/* ============================ HERO ============================ */}
      <section
        ref={heroRef}
        aria-labelledby="product-name"
        className="relative min-h-svh overflow-hidden pb-16 pt-[calc(var(--nav-h)+24px)]"
        style={{ background: product.accent }}
      >
        {/* Giant outlined name in the background */}
        <span
          aria-hidden="true"
          className="font-heading pointer-events-none absolute -bottom-[0.12em] left-0 whitespace-nowrap text-[clamp(120px,22vw,400px)] leading-none text-transparent opacity-40 [-webkit-text-stroke:1px_rgba(20,20,20,0.25)]"
        >
          {product.name}
        </span>

        <div className="relative grid gap-10 px-[var(--nav-px)] min-[1000px]:min-h-[calc(100svh-var(--nav-h)-64px)] min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[1000px]:items-center">
          {/* Copy */}
          <div data-hero-copy className="order-2 min-[1000px]:order-1">
            <nav aria-label="Breadcrumb" data-hero-line>
              <ol className="label flex flex-wrap items-center gap-2 text-[11px] text-ink/60 min-[900px]:text-[11px]">
                <li>
                  <Link href={`/${locale}`} className="link-underline !py-1 hover:text-ink">
                    {copy.home}
                  </Link>
                </li>
                {mainCategory && (
                  <>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link href={`/${locale}/solutions/${mainCategory.slug}`} className="link-underline !py-1 hover:text-ink">
                        {mainCategory.title}
                      </Link>
                    </li>
                  </>
                )}
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-ink">
                  {product.name}
                </li>
              </ol>
            </nav>

            <div data-hero-line className="mt-8 flex flex-wrap items-center gap-3">
              {product.badge && (
                <span className="label rounded-full bg-red px-3 py-2 text-[10px] text-white min-[900px]:text-[10px]">
                  {copy.badges[product.badge]}
                </span>
              )}
              <span className="label text-red">{product.tag}</span>
            </div>

            <h1
              id="product-name"
              data-hero-name
              className="font-heading mt-5 text-[clamp(52px,7.4vw,136px)] font-normal leading-[0.9] tracking-[-0.03em] text-ink"
            >
              {product.name}
            </h1>
            <p data-hero-line className="font-heading mt-5 text-[clamp(24px,2.4vw,38px)] italic leading-tight text-ink/80">
              {product.tagline}
            </p>
            <p data-hero-line className="mt-5 max-w-[460px] text-[15px] leading-relaxed text-ink/70">
              {product.description}
            </p>

            <div data-hero-line className="mt-8">
              <p className="label text-[11px] text-ink/60 min-[900px]:text-[11px]">{t.sizes}</p>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t.sizes}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    onClick={() => setSize(s)}
                    className={`label rounded-full border px-5 py-3 transition-colors duration-300 ${
                      size === s ? "border-ink bg-ink text-white" : "border-ink/25 text-ink hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div data-hero-line className="mt-8 flex flex-wrap gap-3">
              <a href={`/${locale}#contact`} className="label btn-red group inline-flex gap-3">
                {t.findDistributor}
                <Icon name="arrow" size={14} className="transition-transform duration-500 group-hover:translate-x-1" />
              </a>
              <button type="button" onClick={() => window.print()} className="label btn-outline inline-flex gap-3">
                <Icon name="download" size={16} />
                {t.downloadSheet}
              </button>
            </div>
          </div>

          {/* Pack centered in its color circle: one visual, moved as a whole */}
          <div className="relative order-1 mx-auto aspect-square w-full max-w-[600px] min-[1000px]:order-2">
            <div className="absolute inset-0">
              {/* Color circle: the selected shade, soft light + hairline outline so even whites read */}
              <div
                ref={blobRef}
                aria-hidden="true"
                className="absolute inset-[13%] rounded-full shadow-[0_50px_90px_-40px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(20,20,20,0.06)]"
                style={{ background: swatch.hex }}
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.65),rgba(255,255,255,0)_55%)]" />
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_70%_85%,rgba(0,0,0,0.12),rgba(0,0,0,0)_50%)]" />
              </div>
              {/* Thin concentric line */}
              <span data-visual-line aria-hidden="true" className="absolute inset-[8.5%] rounded-full border border-ink/10" />
              {/* Rotating ring of text, spaced to fill exactly one turn */}
              <svg ref={ringRef} aria-hidden="true" viewBox="0 0 200 200" className="absolute inset-0 size-full text-ink/55">
                <defs>
                  <path id="product-ring" d="M100,100 m-94,0 a94,94 0 1,1 188,0 a94,94 0 1,1 -188,0" />
                </defs>
                <text className="label" style={{ fontSize: "5.6px" }} fill="currentColor">
                  <textPath href="#product-ring" textLength={590} lengthAdjust="spacing">
                    {ringText}
                  </textPath>
                </text>
              </svg>
              {/* 3D pack, fixed in the middle of the circle, turning on itself */}
              <div ref={packRef} className="absolute inset-[13%]">
                <ProductModelViewer model={product.model} image={product.image} alt={product.name} reducedMotion={reducedMotion} />
              </div>
            </div>
            {/* Selected shade tag */}
            <div data-hero-line className="absolute bottom-[4%] right-0 flex items-center gap-3 bg-white px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.3)]">
              <span className="size-6 rounded-full border border-ink/10" style={{ background: swatch.hex }} />
              <span>
                <span className="label block text-[10px] text-muted min-[900px]:text-[10px]">{swatch.code}</span>
                <span className="font-heading mt-1 block text-[18px] leading-none text-ink">{swatch.name[locale]}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TABS ============================ */}
      <div ref={tabsRef} className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur-[12px]">
        <div className="relative flex items-center gap-8 overflow-x-auto px-[var(--nav-px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab, i) => (
            <a
              key={tab.key}
              href={`#${tab.id}`}
              data-tab={tab.key}
              onClick={(e) => goToSection(e, tab.id)}
              aria-current={activeTab === tab.key ? "true" : undefined}
              className={`label shrink-0 py-5 transition-colors duration-300 ${activeTab === tab.key ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              <span className="tabular mr-2 text-red">{pad(i + 1)}</span>
              {t.tabs[tab.key]}
            </a>
          ))}
          <span ref={tabLineRef} aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] bg-red" style={{ width: 0 }} />
        </div>
      </div>

      {/* =========================== FIGURES =========================== */}
      <section id="overview" className="bg-ink px-[var(--nav-px)] py-16 text-white min-[900px]:py-24">
        <ul className="grid grid-cols-2 gap-y-12 min-[900px]:grid-cols-4">
          {figures.map((f, i) => (
            <li key={f.key} className={`px-2 min-[900px]:px-8 ${i > 0 ? "min-[900px]:border-l min-[900px]:border-white/15" : ""}`}>
              <p className="label text-white/60">{t.figures[f.key]}</p>
              <p className="font-heading tabular mt-4 flex items-baseline gap-2 text-[clamp(64px,7vw,128px)] leading-[0.85]">
                <span data-count={f.value}>{f.value}</span>
                <span className="label text-red">{f.unit}</span>
              </p>
            </li>
          ))}
        </ul>
        <ul className="mt-16 flex flex-wrap gap-3 border-t border-white/15 pt-10">
          {product.highlights.map((h) => (
            <li key={h.label} className="flex items-center gap-3 rounded-full border border-white/20 py-2 pl-2 pr-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-red">
                <Icon name={h.icon} size={20} />
              </span>
              <span className="label">{h.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ============================ ABOUT ============================ */}
      <section aria-labelledby="about-title" className="bg-white px-[var(--nav-px)] py-24 min-[900px]:py-36">
        <div className="grid gap-12 min-[1000px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="min-[1000px]:sticky min-[1000px]:top-28 min-[1000px]:self-start">
            <p data-reveal-up className="label flex items-center gap-3 text-muted">
              <span className="block h-px w-8 bg-red" aria-hidden="true" />
              {t.aboutEyebrow}
            </p>
            <h2 id="about-title" data-reveal-up className="font-heading mt-6 text-[clamp(40px,4.6vw,80px)] font-normal leading-[0.98] text-ink">
              {t.aboutTitle}
            </h2>
            {usedIn.length > 0 && (
              <div data-reveal-up className="mt-10">
                <p className="label text-[11px] text-muted min-[900px]:text-[11px]">{t.usedIn}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {usedIn.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/${locale}/solutions/${s.slug}`}
                        className="label inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 text-ink transition-colors duration-300 hover:border-red hover:bg-red hover:text-white"
                      >
                        <Icon name={s.icon} size={16} />
                        {s.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            {product.about.map((paragraph, i) => (
              <p
                key={i}
                data-scrub-text
                className={`font-heading text-ink ${
                  i === 0 ? "text-[clamp(26px,2.8vw,46px)] leading-[1.2]" : "mt-10 text-[clamp(20px,1.8vw,28px)] leading-[1.35] text-ink/85"
                }`}
              >
                {paragraph}
              </p>
            ))}
            {product.gallery[0] && (
              <div data-story-image className="relative mt-16 aspect-[16/10] overflow-hidden bg-bg">
                <Image src={product.gallery[0]} alt="" fill sizes="(min-width: 1000px) 55vw, 100vw" className="object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ======================= TECHNICAL SHEET ======================= */}
      <section id="specs" aria-labelledby="specs-title" className="bg-[#F6F5F2] px-[var(--nav-px)] py-24 min-[900px]:py-36">
        <div className="flex flex-col gap-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div>
            <p data-reveal-up className="label flex items-center gap-3 text-muted">
              <span className="block h-px w-8 bg-red" aria-hidden="true" />
              {t.specsEyebrow} · {product.name}
            </p>
            <h2 id="specs-title" data-reveal-up className="font-heading mt-6 text-[clamp(40px,5vw,88px)] font-normal leading-[0.98] text-ink">
              {t.specsTitle}
            </h2>
          </div>
          <button data-reveal-up type="button" onClick={() => window.print()} className="label btn-outline inline-flex gap-3 self-start min-[900px]:self-end">
            <Icon name="download" size={16} />
            {t.downloadSheet}
          </button>
        </div>

        <div className="mt-16 grid gap-x-16 gap-y-14 min-[1000px]:grid-cols-2">
          {product.specGroups.map((group, g) => (
            <div key={group.title} data-spec-group>
              <h3 className="flex items-baseline gap-4">
                <span className="font-heading tabular text-[40px] leading-none text-red">{pad(g + 1)}</span>
                <span className="label text-ink">{group.title}</span>
              </h3>
              <dl className="mt-6">
                {group.rows.map((row) => (
                  <div key={row.label} className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 overflow-hidden py-4">
                    <span data-spec-line aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left bg-ink/15" />
                    <dt data-spec-cell className="text-[13px] text-muted">
                      {row.label}
                    </dt>
                    <dd data-spec-cell className="text-right text-[14px] font-medium text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p data-reveal-up className="mt-14 max-w-[640px] text-[12px] leading-relaxed text-muted">
          {t.specsNote}
        </p>
      </section>

      {/* ========================= APPLICATION ========================= */}
      <section id="application" aria-labelledby="application-title" className="relative overflow-hidden bg-white px-[var(--nav-px)] py-24 min-[900px]:py-36">
        <p data-reveal-up className="label flex items-center gap-3 text-muted">
          <span className="block h-px w-8 bg-red" aria-hidden="true" />
          {t.applicationEyebrow}
        </p>
        <h2 id="application-title" data-reveal-up className="font-heading mt-6 max-w-[900px] text-[clamp(40px,5vw,88px)] font-normal leading-[0.98] text-ink">
          {t.applicationTitle}
        </h2>

        <div className="relative mt-20">
          {/* Brush stroke behind the steps (desktop) */}
          <svg aria-hidden="true" viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute inset-x-0 top-0 hidden h-[72px] w-full min-[900px]:block">
            <path
              data-stroke
              d="M20,60 C180,10 260,110 420,60 S700,10 820,60 S1060,110 1180,50"
              fill="none"
              stroke="#E8372C"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>
          <ol className="relative grid gap-12 min-[900px]:grid-cols-4 min-[900px]:gap-8">
            {product.steps.map((step, i) => (
              <li key={step.title} data-step className="relative">
                <span
                  data-step-dot
                  className="font-heading tabular relative z-10 flex size-[72px] items-center justify-center rounded-full border border-ink/15 bg-white text-[28px] text-ink"
                >
                  {pad(i + 1)}
                </span>
                <h3 data-step-text className="font-heading mt-8 text-[clamp(30px,2.6vw,44px)] leading-none text-ink">
                  {step.title}
                </h3>
                <p data-step-text className="mt-4 max-w-[300px] text-[14px] leading-relaxed text-muted">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================ COLORS ============================ */}
      <section id="colors" aria-labelledby="colors-title" className="bg-[#F6F5F2] px-[var(--nav-px)] py-24 min-[900px]:py-36">
        <div className="grid gap-12 min-[1000px]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] min-[1000px]:items-center">
          {/* Painted wall preview */}
          <div ref={wallRef} className="relative aspect-[4/3] overflow-hidden" style={{ background: swatch.hex }}>
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/20" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[22%] bg-[#d9d2c7]" />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-[22%] h-2 bg-black/10 blur-[2px]" />
            <div className="absolute bottom-[12%] left-[8%] h-[46%] w-[34%]">
              <Image src={product.image} alt="" fill sizes="30vw" className="object-contain object-bottom drop-shadow-[0_24px_24px_rgba(0,0,0,0.25)]" />
            </div>
            <div className="absolute right-6 top-6 bg-white/90 px-5 py-4 backdrop-blur">
              <p className="label text-[10px] text-muted min-[900px]:text-[10px]">{swatch.code}</p>
              <p className="font-heading mt-2 text-[28px] leading-none text-ink">{swatch.name[locale]}</p>
              <p className="label tabular mt-2 text-[10px] text-muted min-[900px]:text-[10px]">{swatch.hex}</p>
            </div>
          </div>

          <div>
            <p data-reveal-up className="label flex items-center gap-3 text-muted">
              <span className="block h-px w-8 bg-red" aria-hidden="true" />
              {t.colorsEyebrow}
            </p>
            <h2 id="colors-title" data-reveal-up className="font-heading mt-6 text-[clamp(40px,4.6vw,80px)] font-normal leading-[0.98] text-ink">
              {t.colorsTitle}
            </h2>
            <p data-reveal-up className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-muted">
              {swatches.length ? t.colorsText : t.noColors}
            </p>
            {swatches.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-3" role="radiogroup" aria-label={t.colorsTitle}>
                {swatches.map((s) => (
                  <li key={s.code} data-swatch>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={swatch.code === s.code}
                      aria-label={`${s.name[locale]} ${s.code}`}
                      onClick={() => setSwatch(s)}
                      className={`relative flex size-14 items-center justify-center rounded-full border transition-transform duration-300 hover:scale-110 ${
                        swatch.code === s.code ? "border-ink ring-2 ring-red ring-offset-4 ring-offset-[#F6F5F2]" : "border-ink/10"
                      }`}
                      style={{ background: s.hex }}
                    >
                      {swatch.code === s.code && <Icon name="check" size={18} className="text-white mix-blend-difference" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ============================ GALLERY ============================ */}
      <section id="gallery" aria-labelledby="gallery-title" className="bg-white px-[var(--nav-px)] py-24 min-[900px]:py-36">
        <p data-reveal-up className="label flex items-center gap-3 text-muted">
          <span className="block h-px w-8 bg-red" aria-hidden="true" />
          {t.galleryEyebrow}
        </p>
        <h2 id="gallery-title" data-reveal-up className="font-heading mt-6 text-[clamp(40px,5vw,88px)] font-normal leading-[0.98] text-ink">
          {t.galleryTitle}
        </h2>
        <ul className="mt-16 grid gap-5 min-[900px]:grid-cols-12 min-[900px]:gap-8">
          {product.gallery.map((src, i) => (
            <li key={src} className={MOSAIC[i % MOSAIC.length]}>
              <button
                type="button"
                data-gallery-item
                onClick={() => setLightbox(i)}
                aria-label={`${t.openImage} ${i + 1}`}
                className="group relative block size-full overflow-hidden bg-bg"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 900px) 55vw, 100vw"
                  className="scale-110 object-cover transition-transform duration-[1.2s] ease-power3-out group-hover:scale-[1.16]"
                />
                <span className="label tabular absolute bottom-4 left-4 bg-white px-3 py-2 text-ink">{pad(i + 1)}</span>
                <span className="absolute right-4 top-4 flex size-12 scale-0 items-center justify-center rounded-full bg-red text-white transition-transform duration-500 group-hover:scale-100">
                  <Icon name="plus" size={18} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ============================ RELATED ============================ */}
      {related.length > 0 && (
        <section id="related" aria-labelledby="related-title" className="bg-[#F6F5F2] px-[var(--nav-px)] py-24 min-[900px]:py-32">
          <p className="label flex items-center gap-3 text-muted">
            <span className="block h-px w-8 bg-red" aria-hidden="true" />
            {t.relatedEyebrow}
          </p>
          <h2 id="related-title" className="font-heading mt-6 text-[clamp(40px,5vw,88px)] font-normal leading-[0.98] text-ink">
            {t.relatedTitle}
          </h2>
          <ul className="mt-14 grid gap-5 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-4">
            {related.map((card) => (
              <li key={card.id} data-related>
                <Link href={`/${locale}/products/${card.id}`} onClick={(e) => openProduct(e, card)} className="group block bg-white">
                  <span data-curtain-from className="relative flex aspect-square items-center justify-center overflow-hidden" style={{ background: card.accent }}>
                    <span className="relative block h-[66%] w-[66%] transition-transform duration-700 ease-power3-out group-hover:-translate-y-2 group-hover:rotate-[-4deg] group-hover:scale-105">
                      <Image src={card.image} alt="" fill sizes="(min-width: 1100px) 22vw, 45vw" className="object-contain drop-shadow-[0_20px_24px_rgba(0,0,0,0.18)]" />
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-3 p-5">
                    <span className="min-w-0">
                      <span className="label block truncate text-[11px] text-red min-[900px]:text-[11px]">{card.tag}</span>
                      <span className="font-heading mt-2 block truncate text-[26px] leading-none text-ink">{card.name}</span>
                    </span>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/20 transition-all duration-500 group-hover:-rotate-45 group-hover:border-red group-hover:bg-red group-hover:text-white">
                      <Icon name="arrow" size={16} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============================ LIGHTBOX ============================ */}
      {lightbox !== null && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.galleryTitle}
          data-lenis-prevent
          className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/95 p-[var(--nav-px)]"
          onClick={closeLightbox}
        >
          <div data-lightbox-image key={lightbox} className="relative h-[80svh] w-full max-w-[1400px]">
            <Image src={product.gallery[lightbox]} alt="" fill sizes="100vw" className="object-contain" />
          </div>
          <p className="label tabular absolute bottom-6 left-1/2 -translate-x-1/2 text-white">
            <span className="text-red">{pad(lightbox + 1)}</span> / {pad(product.gallery.length)}
          </p>
          <button
            type="button"
            autoFocus
            onClick={closeLightbox}
            aria-label={t.closeImage}
            className="absolute right-[var(--nav-px)] top-6 flex size-12 items-center justify-center rounded-full bg-white text-ink transition-colors duration-300 hover:bg-red hover:text-white"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
