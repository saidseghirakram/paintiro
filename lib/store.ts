/**
 * Tiny shared state between the Loader, Navbar, hero overlays and smooth scroll.
 * Plain module store + useSyncExternalStore: no context, no re-render storms.
 */
import { useSyncExternalStore } from "react";
import type Lenis from "lenis";

type SiteState = {
  /** Fraction (0..1) of hero assets loaded, reported by useProductModels. */
  loadProgress: number;
  /** True once the loader has left; triggers the navbar and hero intros. */
  introDone: boolean;
  /** True from the moment the loader curtain starts to leave (the hero must be drawn). */
  revealing: boolean;
  /** Active Lenis instance (null when reduced motion or not mounted yet). */
  lenis: Lenis | null;
};

let state: SiteState = { loadProgress: 0, introDone: false, revealing: false, lenis: null };
const listeners = new Set<() => void>();

export function getSiteState(): SiteState {
  return state;
}

export function setSiteState(partial: Partial<SiteState>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverState: SiteState = { loadProgress: 0, introDone: false, revealing: false, lenis: null };

/** React hook: select a slice of the site state. */
export function useSiteState<T>(selector: (s: SiteState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(serverState),
  );
}

/** Smooth-scrolls to a selector (#solutions...) with Lenis, or natively as a fallback. */
export function scrollToTarget(target: string): void {
  const { lenis } = state;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  document.querySelector(target)?.scrollIntoView({ behavior: "auto", block: "start" });
}
