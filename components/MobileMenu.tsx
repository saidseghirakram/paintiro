"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { gsap } from "gsap";
import type { Content, Locale } from "@/lib/content";
import { getSiteState, scrollToTarget } from "@/lib/store";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { NavLink } from "./Navbar";
import { LanguageSwitch, Logo } from "./NavParts";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  locale: Locale;
  nav: Content["nav"];
  hasLogo: boolean;
};

/**
 * Full-screen red menu for screens under 900px.
 * Locks the page scroll (lenis.stop) while open, Escape closes it.
 */
export default function MobileMenu({ open, onClose, links, locale, nav, hasLogo }: MobileMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  // Open / close animation + scroll lock.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-menu-item]");
    const lenis = getSiteState().lenis;
    const duration = reducedMotion ? 0 : 1;

    const ctx = gsap.context(() => {
      if (open) {
        lenis?.stop();
        document.documentElement.style.overflow = "hidden";
        gsap.set(root, { visibility: "visible" });
        gsap.fromTo(
          root,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration, ease: "power4.inOut" },
        );
        gsap.fromTo(
          items,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: reducedMotion ? 0 : 0.9,
            stagger: 0.08,
            ease: "power3.out",
            delay: reducedMotion ? 0 : 0.45,
          },
        );
        closeRef.current?.focus({ preventScroll: true });
      } else {
        lenis?.start();
        document.documentElement.style.overflow = "";
        gsap.to(root, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reducedMotion ? 0 : 0.8,
          ease: "power4.inOut",
          onComplete: () => {
            gsap.set(root, { visibility: "hidden" });
          },
        });
      }
    }, root);

    return () => ctx.kill();
  }, [open, reducedMotion]);

  // Escape closes the menu; Tab stays inside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !rootRef.current) return;
      const focusable = rootRef.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    onClose();
    // Let Lenis restart before scrolling to the section.
    window.setTimeout(() => scrollToTarget(href), 50);
  };

  return (
    <div
      ref={rootRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={nav.menuOpen}
      aria-hidden={!open}
      className="invisible fixed inset-0 z-[60] flex flex-col bg-red text-white min-[900px]:hidden"
      style={{ clipPath: "inset(0% 0% 100% 0%)", height: "100dvh" }}
    >
      <div className="flex h-[var(--nav-h)] items-center justify-between px-[var(--nav-px)]">
        <Logo hasLogo={hasLogo} className={hasLogo ? "brightness-0 invert" : ""} />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={nav.menuClose}
          className="relative h-10 w-10"
          tabIndex={open ? 0 : -1}
        >
          <span className="absolute left-1/2 top-1/2 block h-px w-7 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
          <span className="absolute left-1/2 top-1/2 block h-px w-7 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white" />
        </button>
      </div>

      <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center px-[var(--nav-px)]">
        <ul className="flex flex-col gap-3">
          {links.map((link) => (
            <li key={link.href} className="overflow-hidden">
              <a
                data-menu-item
                href={link.href}
                onClick={(e) => onLinkClick(e, link.href)}
                tabIndex={open ? 0 : -1}
                className="font-heading block text-[48px] font-medium leading-[1.05] focus-visible:outline-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="overflow-hidden px-[var(--nav-px)] pb-[max(32px,env(safe-area-inset-bottom))]">
        <div data-menu-item>
          <LanguageSwitch locale={locale} label={nav.language} tone="white" />
        </div>
      </div>
    </div>
  );
}
