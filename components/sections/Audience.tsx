"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import type { ExperienceContent } from "@/lib/content-experience";
import { getProduct, type ProductId } from "@/lib/products";
import { scrollToTarget } from "@/lib/store";
import AnimatedTitle from "../ui/AnimatedTitle";
import Reveal from "../ui/Reveal";

type AudienceProps = { content: ExperienceContent["audience"] };

/** Paint that floods each door on hover, and the product shown in it (cycled). */
const DOORS: { paint: string; product: ProductId }[] = [
  { paint: "#E8372C", product: "irovella" },
  { paint: "#141414", product: "irofacade" },
  { paint: "#2F3E52", product: "fix-one" },
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Who are you?": three doors (homeowner, painter, distributor). On hover a
 * door widens, paint rises from the floor to fill it and its product floats up.
 */
export default function Audience({ content }: AudienceProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    scrollToTarget(href);
  };

  return (
    <section id="audience" aria-label={content.title} className="bg-surface py-24 min-[900px]:py-32">
      <div className="px-[var(--nav-px)]">
        <p className="label flex items-center gap-3 text-muted">
          <span className="block h-px w-8 bg-red" aria-hidden="true" />
          {content.eyebrow}
        </p>
        <AnimatedTitle
          text={content.title}
          accentWord={1}
          className="font-heading mt-5 max-w-[16ch] text-[clamp(40px,5.2vw,84px)] font-normal leading-[1.02]"
        />

        <Reveal className="mt-14 flex flex-col gap-4 min-[900px]:h-[68svh] min-[900px]:flex-row">
          {content.items.map((item, i) => {
            const door = DOORS[i % DOORS.length];
            const product = getProduct(door.product);
            return (
              <a
                key={item.title}
                data-reveal
                href={item.href}
                onClick={(event) => onClick(event, item.href)}
                className="group relative isolate flex min-h-[340px] flex-1 flex-col justify-between overflow-hidden border border-ink/12 p-7 text-ink transition-[flex-grow,color] duration-700 ease-power3-out hover:text-white focus-visible:text-white min-[900px]:p-10 min-[900px]:hover:grow-[1.7]"
              >
                {/* Paint rising from the floor */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-700 ease-power4-inout group-hover:scale-y-100 group-focus-visible:scale-y-100"
                  style={{ background: door.paint }}
                />
                <span className="label tabular flex items-center justify-between">
                  <span>{pad(i + 1)}</span>
                  <span className="text-[20px] transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
                </span>

                <Image
                  src={product.image}
                  alt=""
                  width={product.width}
                  height={product.height}
                  sizes="(min-width: 900px) 20vw, 50vw"
                  className="pointer-events-none absolute -bottom-6 right-4 h-auto w-[44%] max-w-[240px] translate-y-10 rotate-6 opacity-0 transition-[opacity,transform] duration-700 ease-power3-out group-hover:translate-y-0 group-hover:rotate-0 group-hover:opacity-100"
                />

                <span className="relative block max-w-[30ch]">
                  <span className="font-heading block text-[clamp(32px,3vw,52px)] leading-[1]">{item.title}</span>
                  <span className="mt-4 block text-[15px] leading-relaxed opacity-75">{item.text}</span>
                  <span className="label mt-8 inline-block border-b border-current pb-2">{item.cta}</span>
                </span>
              </a>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
