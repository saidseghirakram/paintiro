"use client";

import { useRef } from "react";
import Image from "next/image";
import type { SectionsContent } from "@/lib/content-sections";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeader from "../ui/SectionHeader";

type ArticlesProps = { content: SectionsContent["articles"] };

/** 10 — Latest articles: snap carousel with previous / next arrows. */
export default function Articles({ content }: ArticlesProps) {
  const trackRef = useRef<HTMLUListElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("li");
    const step = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  return (
    <section id="articles" aria-label={content.title} className="bg-surface py-24 min-[900px]:py-36">
      <Reveal className="mx-auto max-w-[1600px] px-[var(--nav-px)]">
        <div className="flex items-end justify-between gap-6">
          <SectionHeader index="10" eyebrow={content.eyebrow} title={content.title} className="flex-1" />
          <div data-reveal className="hidden gap-2 min-[900px]:flex">
            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => scrollBy(direction)}
                aria-label={direction === -1 ? content.previous : content.next}
                className="flex size-12 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors duration-300 hover:border-red hover:bg-red hover:text-white"
              >
                <Icon name={direction === -1 ? "arrowLeft" : "arrow"} size={18} />
              </button>
            ))}
          </div>
        </div>

        <ul
          ref={trackRef}
          className="-mx-[var(--nav-px)] mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-[var(--nav-px)] px-[var(--nav-px)] pb-4 [scrollbar-width:none] min-[900px]:mt-20"
        >
          {content.items.map((article) => (
            <li
              key={article.title}
              data-reveal
              className="w-[78vw] max-w-[420px] shrink-0 snap-start min-[900px]:w-[calc((100%-72px)/4)] min-[900px]:max-w-none"
            >
              <a href="#articles" className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-bg">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    sizes="(min-width: 900px) 25vw, 78vw"
                    className="object-cover transition-transform duration-[1.2s] ease-power3-out group-hover:scale-105"
                  />
                  <span className="label absolute left-4 top-4 bg-white px-2.5 py-1.5 text-[10px] text-ink min-[900px]:text-[10px]">
                    {article.tag}
                  </span>
                </div>
                <h3 className="font-heading mt-5 text-[24px] leading-[1.1] text-ink transition-colors duration-300 group-hover:text-red min-[900px]:text-[26px]">
                  {article.title}
                </h3>
                <p className="label tabular mt-4 text-[10px] text-muted min-[900px]:text-[11px]">{article.date}</p>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
