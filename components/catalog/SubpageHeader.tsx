"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import type { Locale } from "@/lib/content";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { LanguageSwitch, Logo } from "../NavParts";
import Icon from "../ui/Icon";

type SubpageHeaderProps = {
  locale: Locale;
  hasLogo: boolean;
  backHref: string;
  backLabel: string;
  homeLabel: string;
  ctaLabel: string;
  languageLabel: string;
  /** Path after the locale, kept by the language switch (server value, before any in-page URL change). */
  path: string;
  /** "dark" when the page starts on a photo (white header text until the bar turns solid). */
  tone?: "dark" | "light";
  /** Keep the bar hidden once the first screen is passed (the page has its own sticky bar). */
  hideBelowFold?: boolean;
};

/**
 * Header of the catalogue pages: back link left, logo centered, language + distributor right.
 * Same frosted bar and hide-on-scroll-down behaviour as the homepage navbar.
 */
export default function SubpageHeader({
  locale,
  hasLogo,
  backHref,
  backLabel,
  homeLabel,
  ctaLabel,
  languageLabel,
  path,
  tone = "light",
  hideBelowFold = false,
}: SubpageHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);
  const reducedMotion = useReducedMotion();
  // The category page changes its URL in place: follow it for the language links.
  const pathname = usePathname();
  const light = solid || tone === "light";
  const currentPath = pathname.startsWith(`/${locale}/`) ? pathname.slice(locale.length + 1) : path;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let lastY = window.scrollY;
    let hidden = false;

    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      setSolid(y > 80);
      const belowFold = hideBelowFold && y > window.innerHeight * 0.85;
      const hide = belowFold || (y > 10 && delta > 4) ? true : delta < -4 || y <= 10 ? false : hidden;
      if (hide !== hidden) {
        hidden = hide;
        gsap.to(header, { yPercent: hide ? -100 : 0, duration: reducedMotion ? 0 : 0.5, ease: "power3.out", overwrite: true });
      }
      if (Math.abs(delta) > 4 || y <= 10) lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion, hideBelowFold]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header || reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-sub-intro]", { opacity: 0, y: -14, duration: 0.9, stagger: 0.08, ease: "power3.out", delay: 0.35 });
    }, header);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? "bg-white/90 backdrop-blur-[12px]" : "bg-transparent"
      }`}
    >
      <nav aria-label="Main" className="relative flex h-[var(--nav-h)] items-center justify-between px-[var(--nav-px)]">
        <Link
          href={backHref}
          data-sub-intro
          className={`label group inline-flex items-center gap-3 transition-colors duration-500 ${light ? "text-ink" : "text-white"}`}
        >
          <span
            className={`flex size-10 items-center justify-center rounded-full border transition-colors duration-500 group-hover:border-red group-hover:bg-red group-hover:text-white ${
              light ? "border-ink/20" : "border-white/40"
            }`}
          >
            <Icon name="arrowLeft" size={16} className="transition-transform duration-500 group-hover:-translate-x-0.5" />
          </span>
          <span className="hidden min-[600px]:inline">{backLabel}</span>
        </Link>

        <Link
          href={`/${locale}`}
          aria-label={homeLabel}
          data-sub-intro
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${
            light ? "text-red" : "text-white"
          }`}
        >
          <Logo hasLogo={hasLogo} />
        </Link>

        <div className="flex items-center gap-3 min-[900px]:gap-8">
          <div data-sub-intro className={`hidden min-[900px]:block ${light ? "" : "[&_a]:!text-white"}`}>
            <LanguageSwitch locale={locale} label={languageLabel} path={currentPath} />
          </div>
          <div data-sub-intro className="hidden min-[600px]:block">
            <a href={`/${locale}#contact`} className="label btn-red !px-[22px] !py-3">
              {ctaLabel}
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
