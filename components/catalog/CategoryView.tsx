"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type { CategorySlug, ProductCard } from "@/lib/catalog";
import { isCategorySlug } from "@/lib/catalog";
import { SWATCHES } from "@/lib/colors";
import type { Locale } from "@/lib/content";
import type { CatalogContent } from "@/lib/content-catalog";
import type { SectionsContent } from "@/lib/content-sections";
import { getSiteState } from "@/lib/store";
import { coverWithCurtain, releaseCurtain, resetScroll } from "@/lib/transition";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Icon from "../ui/Icon";
import ProductScroller from "./ProductScroller";

gsap.registerPlugin(Flip, ScrollTrigger, SplitText);

type Solution = SectionsContent["solutions"]["items"][number];

type CategoryViewProps = {
  locale: Locale;
  initialSlug: CategorySlug;
  solutions: Solution[];
  copy: CatalogContent;
};

type Status = "loading" | "ready" | "error";
type View = "list" | "grid";

const pad = (n: number) => String(n).padStart(2, "0");
const SWATCH_HEX = new Map(SWATCHES.map((s) => [s.code, s.hex]));
const HERO_GRADIENT =
  "linear-gradient(to top, rgba(232,55,44,0.92) 0%, rgba(232,55,44,0.55) 28%, rgba(232,55,44,0.12) 55%, rgba(232,55,44,0) 70%)";

/** Plain left click without modifier keys: we can run our own transition. */
const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * Category page body. The products are fetched from /api/solutions/[slug];
 * switching category in the rail updates the URL in place and refetches,
 * so the hero and the list morph instead of reloading the page.
 */
export default function CategoryView({ locale, initialSlug, solutions, copy }: CategoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const slug: CategorySlug = isCategorySlug(lastSegment) ? lastSegment : initialSlug;
  const index = Math.max(0, solutions.findIndex((s) => s.slug === slug));
  const solution = solutions[index];

  const [status, setStatus] = useState<Status>("loading");
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [view, setView] = useState<View>("list");
  const [finish, setFinish] = useState<string>("all");
  const [attempt, setAttempt] = useState(0);
  /** Two stacked hero photos: the new one is revealed over the previous one. */
  const [heroLayers, setHeroLayers] = useState<{ slug: CategorySlug; image: string }[]>([
    { slug, image: solution.image },
  ]);
  // Derived during render, so the new photo exists when the hero animation runs.
  if (heroLayers.at(-1)?.slug !== slug) {
    setHeroLayers([...heroLayers.slice(-1), { slug, image: solution.image }]);
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const firstSlug = useRef(slug);

  // ------------------------------------------------------------------
  // Arrival: start at the top and lift the curtain of the previous page.
  // ------------------------------------------------------------------
  useEffect(() => {
    resetScroll();
    releaseCurtain();
  }, []);

  // ------------------------------------------------------------------
  // Fetch the products of the active category.
  // ------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    let settled = false;

    // Fade the previous list out while the request runs.
    const list = listRef.current;
    const leaving = list?.querySelectorAll("[data-item]");
    const fadeOut =
      leaving?.length && !reducedMotion
        ? gsap.to(leaving, { opacity: 0, duration: 0.35, stagger: 0.03, ease: "power2.in" }).then()
        : Promise.resolve();

    const request = fetch(`/api/solutions/${slug}?locale=${locale}`, { signal: controller.signal }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<{ products: ProductCard[] }>;
    });

    // The skeleton only shows once the old list has left and if the request is still running.
    fadeOut.then(() => {
      if (!settled && !controller.signal.aborted) setStatus("loading");
    });

    Promise.all([request, fadeOut])
      .then(([data]) => {
        settled = true;
        setProducts(data.products);
        setFinish("all");
        setStatus("ready");
      })
      .catch((error: unknown) => {
        settled = true;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [slug, locale, attempt, reducedMotion]);

  // ------------------------------------------------------------------
  // Hero: photo layers, title characters, scroll parallax.
  // ------------------------------------------------------------------
  useEffect(() => {
    document.title = `${solution.title} — PAINTIRO`;
  }, [solution.title]);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return;
    const isFirst = slug === firstSlug.current && heroLayers.length === 1;

    const ctx = gsap.context(() => {
      const top = hero.querySelector<HTMLElement>("[data-hero-layer]:last-of-type");
      if (top && !isFirst) {
        gsap.fromTo(
          top,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power4.inOut" },
        );
        gsap.fromTo(top.querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: "power3.out" });
      } else if (top) {
        gsap.fromTo(top.querySelector("img"), { scale: 1.18 }, { scale: 1, duration: 2, ease: "power3.out" });
      }

      const title = hero.querySelector<HTMLElement>("[data-hero-title]");
      if (title) {
        const split = SplitText.create(title, { type: "chars", mask: "chars" });
        gsap.from(split.chars, {
          yPercent: 110,
          rotate: 6,
          duration: 1.1,
          stagger: 0.035,
          ease: "power4.out",
          delay: isFirst ? 0.35 : 0.25,
        });
      }
      gsap.from("[data-hero-line]", {
        y: 26,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        delay: isFirst ? 0.7 : 0.45,
      });
      gsap.from("[data-hero-index]", { yPercent: 30, opacity: 0, duration: 1.4, ease: "power3.out" });
    }, hero);
    return () => ctx.revert();
    // heroLayers.length only matters on the very first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, reducedMotion]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.to("[data-hero-media]", {
        yPercent: 18,
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero-content]", {
        yPercent: -30,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "35% top", end: "bottom top", scrub: true },
      });
    }, hero);
    return () => ctx.revert();
  }, [reducedMotion]);

  // Product counter in the hero.
  useEffect(() => {
    const el = countRef.current;
    if (!el || status !== "ready") return;
    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: products.length,
      duration: reducedMotion ? 0 : 1.2,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = pad(Math.round(counter.value));
      },
    });
    return () => {
      tween.kill();
    };
  }, [status, products.length, reducedMotion]);

  // ------------------------------------------------------------------
  // Category rail: the red pill slides under the active category.
  // ------------------------------------------------------------------
  const moveIndicator = useCallback(
    (instant = false) => {
      const rail = railRef.current;
      const indicator = indicatorRef.current;
      const active = rail?.querySelector<HTMLElement>(`[data-rail="${slug}"]`);
      if (!rail || !indicator || !active) return;
      gsap.to(indicator, {
        x: active.offsetLeft,
        width: active.offsetWidth,
        duration: instant || reducedMotion ? 0 : 0.7,
        ease: "power4.inOut",
      });
      const scroller = active.parentElement;
      if (scroller) {
        scroller.scrollTo({
          left: active.offsetLeft - scroller.clientWidth / 2 + active.offsetWidth / 2,
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }
    },
    [slug, reducedMotion],
  );

  useLayoutEffect(() => {
    moveIndicator(slug === firstSlug.current && heroLayers.length === 1);
    const onResize = () => moveIndicator(true);
    window.addEventListener("resize", onResize);
    // Chip widths change once the web fonts are in.
    document.fonts?.ready.then(() => moveIndicator(true));
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveIndicator]);

  // The sticky story stage sits right under the rail: share its height.
  useEffect(() => {
    const rail = railRef.current;
    const root = rootRef.current;
    if (!rail || !root) return;
    const observer = new ResizeObserver(() => root.style.setProperty("--rail-h", `${rail.offsetHeight}px`));
    observer.observe(rail);
    return () => observer.disconnect();
  }, []);

  const selectCategory = (next: CategorySlug) => {
    if (next === slug) return;
    window.history.pushState(null, "", `/${locale}/solutions/${next}`);
    const hero = heroRef.current;
    if (hero && window.scrollY > hero.offsetHeight * 0.6) {
      const lenis = getSiteState().lenis;
      if (lenis) lenis.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0 });
    }
  };

  // ------------------------------------------------------------------
  // List: filters (Flip), views, entrance.
  // ------------------------------------------------------------------
  const finishes = useMemo(() => {
    const seen = new Map<string, string>();
    products.forEach((p) => seen.set(p.finish, p.finishLabel));
    return Array.from(seen, ([key, label]) => ({ key, label }));
  }, [products]);

  const visible = useMemo(
    () => (finish === "all" ? products : products.filter((p) => p.finish === finish)),
    [products, finish],
  );

  const changeFinish = (next: string) => {
    if (next === finish) return;
    // Flip only in grid view; the story view rebuilds its scroll scenes.
    const items = listRef.current?.querySelectorAll("[data-item]");
    if (view === "grid" && items?.length && !reducedMotion) flipState.current = Flip.getState(items);
    setFinish(next);
  };

  useLayoutEffect(() => {
    const state = flipState.current;
    const list = listRef.current;
    if (!state || !list) return;
    flipState.current = null;
    Flip.from(state, {
      targets: list.querySelectorAll("[data-item]"),
      duration: 0.7,
      ease: "power3.inOut",
      stagger: 0.03,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power3.out" }),
    });
  }, [finish]);

  const changeView = (next: View) => {
    if (next === view) return;
    const list = listRef.current;
    if (!list || reducedMotion) {
      setView(next);
      return;
    }
    gsap.to(list.querySelectorAll("[data-item]"), {
      opacity: 0,
      y: 20,
      duration: 0.25,
      stagger: 0.02,
      ease: "power2.in",
      onComplete: () => setView(next),
    });
  };

  // Entrance of the items each time a list is rendered (new data or new view).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || status !== "ready") return;
    const items = list.querySelectorAll<HTMLElement>("[data-item]");
    if (reducedMotion) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      if (view === "list") {
        // The showcase runs its own entrance; only fade it in. No transform here:
        // a transformed ancestor would break the pinned stage inside.
        gsap.fromTo(items, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out", clearProps: "opacity" });
      } else {
        gsap.fromTo(
          items,
          { opacity: 0, y: 80, rotate: (i) => (i % 2 ? 3 : -3) },
          { opacity: 1, y: 0, rotate: 0, duration: 1, stagger: 0.08, ease: "power3.out" },
        );
        gsap.fromTo(
          list.querySelectorAll("[data-card-image]"),
          { yPercent: 30, scale: 0.8 },
          { yPercent: 0, scale: 1, duration: 1.2, stagger: 0.08, ease: "back.out(1.4)" },
        );
      }
    }, list);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [status, products, view, reducedMotion]);

  // Card tilt in grid view.
  const onCardMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (reducedMotion || e.pointerType !== "mouse") return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, { rotateY: px * 10, rotateX: -py * 10, duration: 0.6, ease: "power3.out", transformPerspective: 900 });
    gsap.to(card.querySelector("[data-card-image]"), { x: px * 24, y: py * 24, duration: 0.6, ease: "power3.out" });
  };
  const onCardLeave = (e: ReactPointerEvent<HTMLElement>) => {
    const card = e.currentTarget;
    gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
    gsap.to(card.querySelector("[data-card-image]"), { x: 0, y: 0, duration: 0.8, ease: "power3.out" });
  };

  // ------------------------------------------------------------------
  // Product link: the curtain grows from the product image, then the route changes.
  // ------------------------------------------------------------------
  const openProduct = (e: MouseEvent<HTMLAnchorElement>, product: ProductCard, origin?: Element) => {
    if (!isPlainClick(e) || reducedMotion) return;
    e.preventDefault();
    const from = origin ?? e.currentTarget.querySelector("[data-curtain-from]") ?? e.currentTarget;
    const href = `/${locale}/products/${product.id}`;
    router.prefetch(href);
    coverWithCurtain({ from, color: product.accent, label: product.name }).then(() => router.push(href));
  };

  // ------------------------------------------------------------------
  // Marquee of the product names, its speed follows the scroll velocity.
  // ------------------------------------------------------------------
  const marqueeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = marqueeRef.current;
    if (!track || reducedMotion || status !== "ready") return;
    const loop = gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const boost = gsap.utils.clamp(-6, 6, self.getVelocity() / 300);
        gsap.to(loop, { timeScale: boost >= 0 ? 1 + boost : boost - 1, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: false });
      },
    });
    return () => {
      loop.kill();
      trigger.kill();
    };
  }, [status, reducedMotion]);

  const marqueeWords = products.length ? products.map((p) => p.name) : [solution.title];

  return (
    <div ref={rootRef} id="top">
      {/* ============================ HERO ============================ */}
      <section ref={heroRef} aria-labelledby="category-title" className="relative h-svh min-h-[620px] overflow-hidden bg-ink text-white">
        <div data-hero-media className="absolute inset-0 will-change-transform">
          {heroLayers.map((layer) => (
            <div key={layer.slug + layer.image} data-hero-layer className="absolute inset-0 overflow-hidden">
              <Image src={layer.image} alt="" fill priority sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-red/15 mix-blend-multiply" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: HERO_GRADIENT }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/35 to-transparent" />

        <span
          key={`index-${slug}`}
          data-hero-index
          aria-hidden="true"
          className="font-heading tabular pointer-events-none absolute right-[var(--nav-px)] top-[calc(var(--nav-h)+8px)] text-[clamp(120px,24vw,420px)] leading-[0.8] text-white/20"
        >
          {pad(index + 1)}
        </span>

        <div
          data-hero-content
          className="absolute inset-x-0 bottom-0 grid gap-8 px-[var(--nav-px)] pb-[clamp(28px,7svh,72px)] min-[900px]:grid-cols-[minmax(0,1fr)_auto] min-[900px]:items-end"
        >
          <div key={`content-${slug}`}>
            <p data-hero-line className="label tabular flex items-center gap-3 text-white/85">
              <span>07</span>
              <span className="block h-px w-8 bg-white" aria-hidden="true" />
              <span>
                {copy.category.eyebrow} · {pad(index + 1)} / {pad(solutions.length)}
              </span>
            </p>
            <h1
              id="category-title"
              data-hero-title
              className="font-heading mt-5 text-[clamp(64px,13vw,230px)] font-normal leading-[0.88] tracking-[-0.03em]"
            >
              {solution.title}
            </h1>
            <p data-hero-line className="label mt-6 text-white">
              {solution.text}
            </p>
            <p data-hero-line className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-white/85">
              {solution.details}
            </p>
          </div>

          <div data-hero-line className="flex items-end gap-5">
            <div className="text-right">
              <span ref={countRef} className="font-heading tabular block text-[clamp(64px,7vw,128px)] leading-[0.85]">
                {status === "ready" ? pad(products.length) : "··"}
              </span>
              <span className="label mt-3 block text-white/85">{copy.category.products}</span>
            </div>
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-red min-[900px]:size-20">
              <Icon name={solution.icon} size={32} strokeWidth={1.25} />
            </span>
          </div>
        </div>
      </section>

      {/* ======================= CATEGORY RAIL ======================= */}
      <div ref={railRef} className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur-[12px]">
        <div className="relative flex items-center gap-1 overflow-x-auto px-[var(--nav-px)] py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="absolute left-0 top-3 h-[calc(100%-24px)] rounded-full bg-red"
            style={{ width: 0 }}
          />
          {solutions.map((item, i) => {
            const active = item.slug === slug;
            return (
              <a
                key={item.slug}
                href={`/${locale}/solutions/${item.slug}`}
                data-rail={item.slug}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (!isPlainClick(e)) return;
                  e.preventDefault();
                  selectCategory(item.slug);
                }}
                className={`label relative z-10 inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-3 transition-colors duration-500 ${
                  active ? "text-white" : "text-ink hover:text-red"
                }`}
              >
                <span className={`tabular text-[10px] ${active ? "text-white/70" : "text-muted"}`}>{pad(i + 1)}</span>
                <Icon name={item.icon} size={18} />
                {item.title}
              </a>
            );
          })}
        </div>
      </div>

      {/* ========================= PRODUCTS ========================= */}
      <section aria-label={solution.title} className="relative bg-[#F6F5F2] px-[var(--nav-px)] pb-24 pt-10 min-[900px]:pb-36 min-[900px]:pt-14">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-ink/10 pb-6">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={copy.category.filterLabel}>
            <span className="label mr-2 text-muted">{copy.category.filterLabel}</span>
            {[{ key: "all", label: copy.category.filterAll }, ...finishes].map((f) => (
              <button
                key={f.key}
                type="button"
                disabled={status !== "ready"}
                aria-pressed={finish === f.key}
                onClick={() => changeFinish(f.key)}
                className={`label rounded-full border px-4 py-2.5 transition-colors duration-300 disabled:opacity-40 ${
                  finish === f.key ? "border-ink bg-ink text-white" : "border-ink/20 text-ink hover:border-red hover:text-red"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-ink/15 p-1">
            {(["list", "grid"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-label={v === "list" ? copy.category.viewList : copy.category.viewGrid}
                aria-pressed={view === v}
                onClick={() => changeView(v)}
                className={`flex size-10 items-center justify-center rounded-full transition-colors duration-300 ${
                  view === v ? "bg-red text-white" : "text-ink hover:text-red"
                }`}
              >
                <Icon name={v} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div ref={listRef} aria-live="polite" aria-busy={status === "loading"}>
          {status === "loading" && <ListSkeleton label={copy.category.loading} view={view} />}

          {status === "error" && (
            <div className="flex flex-col items-start gap-6 py-24">
              <p className="font-heading text-[clamp(32px,4vw,56px)] leading-none text-ink">{copy.category.error}</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className="label btn-red inline-flex gap-3">
                {copy.category.retry}
                <Icon name="arrow" size={14} />
              </button>
            </div>
          )}

          {status === "ready" && visible.length === 0 && (
            <p className="py-24 text-[15px] text-muted">{copy.category.empty}</p>
          )}

          {status === "ready" && view === "list" && visible.length > 0 && (
            <ProductScroller
              key={`${slug}-${finish}`}
              locale={locale}
              products={visible}
              copy={copy}
              reducedMotion={reducedMotion}
              onOpen={openProduct}
            />
          )}

          {status === "ready" && view === "grid" && visible.length > 0 && (
            <ul className="grid gap-5 pt-10 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-3 min-[900px]:gap-8 min-[900px]:pt-14">
              {visible.map((product, i) => (
                <li key={product.id} data-item data-flip-id={product.id} className="[perspective:900px]">
                  <Link
                    href={`/${locale}/products/${product.id}`}
                    onClick={(e) => openProduct(e, product)}
                    onPointerMove={onCardMove}
                    onPointerLeave={onCardLeave}
                    className="group block bg-white will-change-transform [transform-style:preserve-3d]"
                  >
                    <span
                      data-curtain-from
                      className="relative flex aspect-[4/5] items-center justify-center overflow-hidden"
                      style={{ background: product.accent }}
                    >
                      <span
                        aria-hidden="true"
                        className="font-heading tabular absolute left-5 top-4 text-[64px] leading-none text-white/70"
                      >
                        {pad(i + 1)}
                      </span>
                      {product.badge && (
                        <span className="label absolute right-4 top-5 rounded-full bg-red px-3 py-2 text-[10px] text-white min-[900px]:text-[10px]">
                          {copy.badges[product.badge]}
                        </span>
                      )}
                      {/* Soft shadow under the pack */}
                      <span aria-hidden="true" className="absolute bottom-[14%] h-6 w-1/2 rounded-[50%] bg-black/15 blur-xl" />
                      <span data-card-image className="relative block h-[62%] w-[70%] transition-transform duration-700 ease-power3-out group-hover:-translate-y-3 group-hover:scale-[1.04]">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1100px) 30vw, (min-width: 600px) 45vw, 90vw"
                          className="object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.18)]"
                        />
                      </span>
                      {product.colors.length > 0 && (
                        <span className="absolute inset-x-5 bottom-5 flex translate-y-4 gap-1.5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                          {product.colors.slice(0, 7).map((code) => (
                            <span
                              key={code}
                              className="size-5 rounded-full border border-white/70 shadow-sm"
                              style={{ background: SWATCH_HEX.get(code) }}
                            />
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="flex items-end justify-between gap-4 p-6">
                      <span className="min-w-0">
                        <span className="label block truncate text-red">{product.tag}</span>
                        <span className="font-heading mt-3 block truncate text-[34px] leading-none text-ink">{product.name}</span>
                        <span className="label mt-4 block text-[11px] text-muted min-[900px]:text-[11px]">
                          {product.finishLabel} · {product.coverage} {product.coverageUnit} · {product.sizes.join(" / ")}
                        </span>
                      </span>
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ink/20 transition-all duration-500 group-hover:-rotate-45 group-hover:border-red group-hover:bg-red group-hover:text-white">
                        <Icon name="arrow" size={18} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

      </section>

      {/* ========================== MARQUEE ========================== */}
      <div aria-hidden="true" className="overflow-hidden border-y border-ink/10 bg-white py-8 min-[900px]:py-12">
        <div ref={marqueeRef} className="flex w-max">
          {[0, 1].map((copyIndex) => (
            <div key={copyIndex} className="flex shrink-0 items-center">
              {Array.from({ length: 3 }).flatMap((_, r) =>
                marqueeWords.map((word, i) => (
                  <span key={`${copyIndex}-${r}-${i}`} className="flex items-center">
                    <span
                      className={`font-heading whitespace-nowrap px-8 text-[clamp(56px,8vw,140px)] leading-none ${
                        (i + r) % 2 ? "text-ink" : "text-transparent [-webkit-text-stroke:1px_var(--ink)]"
                      }`}
                    >
                      {word}
                    </span>
                    <span className="size-4 shrink-0 rounded-full bg-red" />
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ========================= HELP CTA ========================= */}
      <section className="relative overflow-hidden bg-red px-[var(--nav-px)] py-20 text-white min-[900px]:py-28">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-10 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <div>
            <p className="label text-white/80">{copy.category.otherSolutions}</p>
            <h2 className="font-heading mt-5 text-[clamp(48px,7vw,120px)] font-normal leading-[0.92]">{copy.category.helpTitle}</h2>
            <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-white/85">{copy.category.helpText}</p>
          </div>
          <a href={`/${locale}#contact`} className="label group inline-flex items-center gap-4 self-start bg-white px-7 py-5 text-ink transition-colors duration-500 hover:bg-ink hover:text-white min-[900px]:self-end">
            {copy.category.helpCta}
            <Icon name="arrow" size={16} className="transition-transform duration-500 group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </div>
  );
}

/** Shimmering placeholders while the request runs, shaped like the active view. */
function ListSkeleton({ label, view }: { label: string; view: View }) {
  return (
    <div>
      <p className="label flex items-center gap-3 py-8 text-muted">
        <span className="paint-loader" aria-hidden="true" />
        {label}
      </p>
      {view === "list" ? (
        <ul aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="grid grid-cols-[72px_minmax(0,1fr)_48px] items-center gap-4 border-b border-ink/10 py-7 min-[900px]:grid-cols-[64px_minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_48px] min-[900px]:gap-8">
              <span className="skeleton aspect-square rounded-full min-[900px]:h-8 min-[900px]:w-10 min-[900px]:rounded-md" />
              <span>
                <span className="skeleton block h-10 w-[70%] rounded-md min-[900px]:h-14" style={{ animationDelay: `${i * 120}ms` }} />
                <span className="skeleton mt-3 block h-3 w-[40%] rounded" />
              </span>
              <span className="skeleton hidden h-10 rounded-md min-[900px]:block" />
              <span className="skeleton hidden h-10 rounded-md min-[900px]:block" />
              <span className="skeleton size-12 rounded-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul aria-hidden="true" className="grid gap-5 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-3 min-[900px]:gap-8">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <span className="skeleton block aspect-[4/5]" style={{ animationDelay: `${i * 120}ms` }} />
              <span className="skeleton mt-4 block h-8 w-1/2 rounded-md" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
