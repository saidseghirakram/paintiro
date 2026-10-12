"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap } from "gsap";
import type { Content, Locale } from "@/lib/content";
import { scrollToTarget, useSiteState } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";
import MobileMenu from "./MobileMenu";
import { LanguageSwitch, Logo } from "./NavParts";

type NavbarProps = {
  locale: Locale;
  nav: Content["nav"];
  /** True when /public/logo.png exists (checked on the server). */
  hasLogo: boolean;
};

export type NavLink = { href: `#${string}`; label: string };

/** Distance after which the navbar gets its frosted background. */
const SOLID_AFTER = 80;

/**
 * Fixed top navigation (Klimt Wine layout): links left, logo centered,
 * language + buy button right. Hides on scroll down, shows on scroll up.
 */
export default function Navbar({ locale, nav, hasLogo }: NavbarProps) {
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  const introDone = useSiteState((s) => s.introDone);
  const reducedMotion = useReducedMotion();

  const links: NavLink[] = [
    { href: "#solutions", label: nav.products },
    { href: "#brand", label: nav.brand },
    { href: "#contact", label: nav.contact },
  ];

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  // Hide on scroll down / show on scroll up, frosted background after 80px.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let lastY = window.scrollY;
    let hidden = false;
    let frame = 0;

    const setHidden = (value: boolean) => {
      if (value === hidden) return;
      hidden = value;
      gsap.to(header, {
        yPercent: value ? -100 : 0,
        duration: reducedMotion ? 0 : 0.5,
        ease: "power3.out",
        overwrite: true,
      });
    };

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      setSolid(y > SOLID_AFTER);
      if (y <= 10 || menuOpenRef.current) setHidden(false);
      else if (delta > 4) setHidden(true);
      else if (delta < -4) setHidden(false);
      if (Math.abs(delta) > 4 || y <= 10) lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  // Entrance once the loader has left.
  useEffect(() => {
    if (!introDone) return;
    const header = headerRef.current;
    if (!header) return;
    const items = header.querySelectorAll<HTMLElement>("[data-nav-intro]:not([data-nav-logo])");

    if (reducedMotion) {
      gsap.set([logoRef.current, ...items], { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        logoRef.current,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
      );
      gsap.fromTo(
        items,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.1 },
      );
    }, header);
    return () => ctx.revert();
  }, [introDone, reducedMotion]);

  const onAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    scrollToTarget(href);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    burgerRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          solid ? "bg-white/90 backdrop-blur-[12px]" : "bg-transparent"
        }`}
      >
        <nav
          aria-label="Main"
          className="relative flex h-[var(--nav-h)] items-center justify-between px-[var(--nav-px)]"
        >
          {/* LEFT: desktop links */}
          <ul className="hidden items-center gap-9 min-[900px]:flex">
            {links.map((link) => (
              <li key={link.href} data-nav-intro>
                <a
                  href={link.href}
                  onClick={(e) => onAnchorClick(e, link.href)}
                  className="label link-underline text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CENTER: logo (left-aligned on mobile) */}
          <a
            ref={logoRef}
            href={`/${locale}`}
            aria-label={nav.home}
            data-nav-intro
            data-nav-logo
            className="text-red min-[900px]:absolute min-[900px]:left-1/2 min-[900px]:top-1/2 min-[900px]:-translate-x-1/2 min-[900px]:-translate-y-1/2"
          >
            <Logo hasLogo={hasLogo} />
          </a>

          {/* RIGHT: language, buy button, burger */}
          <div className="flex items-center gap-3 min-[900px]:gap-8">
            <div data-nav-intro className="hidden min-[900px]:block">
              <LanguageSwitch locale={locale} label={nav.language} />
            </div>
            <a
              data-nav-intro
              href="#contact"
              onClick={(e) => onAnchorClick(e, "#contact")}
              className="label btn-red !px-[22px] !py-3 max-[899px]:!px-4 max-[899px]:!py-[10px]"
            >
              {nav.buy}
            </a>
            <button
              ref={burgerRef}
              data-nav-intro
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={nav.menuOpen}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="flex h-10 w-10 flex-col items-end justify-center gap-[7px] min-[900px]:hidden"
            >
              <span className="block h-px w-7 bg-ink" />
              <span className="block h-px w-5 bg-ink" />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        links={links}
        locale={locale}
        nav={nav}
        hasLogo={hasLogo}
      />
    </>
  );
}
