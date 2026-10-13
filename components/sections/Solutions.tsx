"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale } from "@/lib/content";
import type { SectionsContent } from "@/lib/content-sections";
import { getProduct } from "@/lib/products";
import { coverWithCurtain } from "@/lib/transition";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Icon from "../ui/Icon";

gsap.registerPlugin(ScrollTrigger);

type SolutionsProps = { content: SectionsContent["solutions"]; locale: Locale };
type Solution = SectionsContent["solutions"]["items"][number];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 07 — Solutions. The section pins and the vertical scroll drives a horizontal
 * track of full-height panels (one per project type, each with its photo).
 * Inside, photos move with a light parallax and texts slide in as each panel arrives.
 * With reduced motion, the panels are simply stacked vertically.
 */
export default function Solutions({ content, locale }: SolutionsProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const count = content.items.length;

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || reducedMotion) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      // Vertical scroll -> horizontal movement of the track, while the section is pinned.
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`;
            if (counterRef.current) {
              counterRef.current.textContent = pad(Math.min(count, 1 + Math.floor(self.progress * count)));
            }
          },
        },
      });

      // Parallax: each photo drifts inside its frame as the panel crosses the screen.
      gsap.utils.toArray<HTMLElement>("[data-panel-image]").forEach((image) => {
        gsap.fromTo(
          image,
          { xPercent: -8 },
          {
            xPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: image.parentElement,
              containerAnimation: tween,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });

      // Texts slide up from their masks when a panel reaches the screen.
      gsap.utils.toArray<HTMLElement>("[data-panel]").forEach((panel) => {
        gsap.fromTo(
          panel.querySelectorAll("[data-panel-line]"),
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: {
              trigger: panel,
              containerAnimation: tween,
              start: "left 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, [reducedMotion, count]);

  // Opening a category: the panel photo grows to full screen, then the category page takes over.
  const openCategory = (event: MouseEvent<HTMLAnchorElement>, item: Solution) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reducedMotion) return;
    event.preventDefault();
    const href = `/${locale}/solutions/${item.slug}`;
    const photo = event.currentTarget.closest("[data-panel]")?.querySelector("[data-panel-photo]");
    router.prefetch(href);
    coverWithCurtain({ from: photo ?? event.currentTarget, color: "#141414", image: item.image, tint: true, label: item.title }).then(
      () => router.push(href),
    );
  };

  return (
    <section
      ref={sectionRef}
      id="solutions"
      aria-label={content.title}
      className="relative overflow-hidden bg-[#F6F5F2]"
    >
      <div
        className={
          reducedMotion
            ? "py-24"
            : "flex h-svh flex-col pb-[clamp(20px,4svh,40px)] pt-[calc(var(--nav-h)+clamp(8px,2svh,24px))]"
        }
      >
        <div
          ref={trackRef}
          className={
            reducedMotion
              ? "flex flex-col gap-10 px-[var(--nav-px)]"
              : "flex min-h-0 flex-1 items-stretch gap-5 pl-[var(--nav-px)] will-change-transform min-[900px]:gap-8"
          }
        >
          {/* Intro panel */}
          <div className="flex w-[min(84vw,520px)] shrink-0 flex-col justify-center pr-4 min-[900px]:pr-12">
            <p className="label tabular flex items-center gap-3 text-muted">
              <span className="text-red">07</span>
              <span className="block h-px w-8 bg-red" aria-hidden="true" />
              <span>{content.eyebrow}</span>
            </p>
            <h2 className="font-heading mt-6 text-[clamp(44px,5.6vw,96px)] font-normal leading-[1.0] text-ink">
              {content.title}
            </h2>
            <p className="mt-6 max-w-[400px] text-[15px] leading-relaxed text-muted">{content.intro}</p>
            {!reducedMotion && (
              <p className="label mt-10 inline-flex items-center gap-3 text-ink">
                {content.scrollHint}
                <Icon name="arrow" size={16} className="text-red" />
              </p>
            )}
          </div>

          {/* One panel per project type */}
          {content.items.map((item, i) => {
            const product = getProduct(item.productId);
            return (
              <article
                key={item.title}
                data-panel
                className={`grid shrink-0 overflow-hidden bg-white ${
                  reducedMotion
                    ? "w-full min-[900px]:grid-cols-[1.35fr_1fr]"
                    : "h-full w-[86vw] grid-rows-[minmax(0,1.15fr)_auto] min-[900px]:w-[min(78vw,1180px)] min-[900px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] min-[900px]:grid-rows-1"
                }`}
              >
                {/* Photo with parallax (opens the category) */}
                <Link
                  href={`/${locale}/solutions/${item.slug}`}
                  onClick={(e) => openCategory(e, item)}
                  data-panel-photo
                  aria-label={`${content.explore}: ${item.title}`}
                  className={`group/photo relative block overflow-hidden bg-bg ${reducedMotion ? "aspect-[16/10]" : ""}`}
                >
                  <div data-panel-image className="absolute inset-y-0 -left-[10%] w-[120%]">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(min-width: 900px) 50vw, 86vw"
                      className="object-cover"
                    />
                  </div>
                  {/* Brand red: light tint over the photo + deep gradient from the bottom */}
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-red/15 mix-blend-multiply" />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(232,55,44,0.92) 0%, rgba(232,55,44,0.55) 28%, rgba(232,55,44,0.12) 55%, rgba(232,55,44,0) 70%)",
                    }}
                  />
                  <span className="font-heading tabular absolute left-5 top-4 text-[clamp(56px,7vw,120px)] leading-none text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.25)] min-[900px]:left-8 min-[900px]:top-6">
                    {pad(i + 1)}
                  </span>
                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white min-[900px]:inset-x-8 min-[900px]:bottom-8">
                    <p className="font-heading text-[clamp(40px,5.4vw,96px)] leading-[0.9]">{item.title}</p>
                    <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-red transition-transform duration-700 group-hover/photo:rotate-[-45deg] group-hover/photo:scale-110 min-[900px]:size-16">
                      <Icon name={item.icon} size={28} strokeWidth={1.25} className="transition-opacity duration-300 group-hover/photo:opacity-0" />
                      <Icon name="arrow" size={26} className="absolute opacity-0 transition-opacity duration-300 group-hover/photo:opacity-100" />
                    </span>
                  </div>
                </Link>

                {/* Text */}
                <div className="flex flex-col justify-between gap-6 p-6 min-[900px]:p-10 min-[1280px]:p-14">
                  <div>
                    <div className="overflow-hidden">
                      <p data-panel-line className="label tabular text-muted">
                        <span className="text-red">{pad(i + 1)}</span> / {pad(count)}
                      </p>
                    </div>
                    <div className="mt-3 overflow-hidden pb-[0.06em] min-[900px]:mt-6">
                      <h3
                        data-panel-line
                        className="font-heading text-[clamp(40px,4.6vw,80px)] font-normal leading-none text-ink"
                      >
                        {item.title}
                      </h3>
                    </div>
                    <div className="mt-2 overflow-hidden min-[900px]:mt-4">
                      <p data-panel-line className="label text-red">
                        {item.text}
                      </p>
                    </div>
                    <div className="mt-3 overflow-hidden min-[900px]:mt-6">
                      <p
                        data-panel-line
                        className="max-w-[420px] text-[14px] leading-relaxed text-muted min-[900px]:text-[15px]"
                      >
                        {item.details}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <div
                      data-panel-line
                      className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={product.image}
                          alt=""
                          width={product.width}
                          height={product.height}
                          sizes="48px"
                          className="h-12 w-auto"
                        />
                        <div>
                          <p className="label text-[10px] text-muted min-[900px]:text-[10px]">{content.productLabel}</p>
                          <p className="font-heading mt-1 text-[22px] leading-none text-ink">{product.name}</p>
                        </div>
                      </div>
                      <Link
                        href={`/${locale}/solutions/${item.slug}`}
                        onClick={(e) => openCategory(e, item)}
                        className="label btn-red group inline-flex gap-3 !px-5 !py-3"
                      >
                        {content.explore}
                        <Icon name="arrow" size={14} className="transition-transform duration-500 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Breathing room after the last panel */}
          {!reducedMotion && <div aria-hidden="true" className="w-[var(--nav-px)] shrink-0" />}
        </div>

        {/* Progress */}
        {!reducedMotion && (
          <div className="mt-[clamp(12px,2.5svh,28px)] flex items-center gap-5 px-[var(--nav-px)]">
            <span className="label tabular text-ink">
              <span ref={counterRef} className="text-red">
                01
              </span>{" "}
              / {pad(count)}
            </span>
            <span className="relative block h-px flex-1 bg-ink/15" aria-hidden="true">
              <span
                ref={progressRef}
                className="absolute inset-0 origin-left bg-red"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
