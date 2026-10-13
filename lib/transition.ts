/**
 * Shared-element page transition: a fixed "curtain" grows from the clicked element
 * to the full screen, the route changes underneath, then the new page releases it.
 * The curtain lives on <body>, so it survives the navigation.
 */
import { gsap } from "gsap";
import { getSiteState } from "./store";

const CURTAIN_ID = "route-curtain";
/** The curtain never blocks the site longer than this, even if the next page never calls release. */
const SAFETY_MS = 8000;

type CurtainOptions = {
  /** Element the curtain starts from (its bounding box). */
  from: Element;
  /** Background color of the curtain. */
  color: string;
  /** Optional photo covering the curtain. */
  image?: string;
  /** Optional red gradient from the bottom, like the Solutions panels. */
  tint?: boolean;
  /** Big text shown in the middle while the route changes. */
  label?: string;
};

let safetyTimer: ReturnType<typeof setTimeout> | undefined;

/** Grows the curtain to full screen. Resolves when the screen is covered. */
export function coverWithCurtain({ from, color, image, tint, label }: CurtainOptions): Promise<void> {
  document.getElementById(CURTAIN_ID)?.remove();
  const rect = from.getBoundingClientRect();

  const curtain = document.createElement("div");
  curtain.id = CURTAIN_ID;
  curtain.setAttribute("aria-hidden", "true");
  Object.assign(curtain.style, {
    position: "fixed",
    zIndex: "200",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    overflow: "hidden",
    background: color,
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);

  if (image) {
    const img = document.createElement("div");
    Object.assign(img.style, {
      position: "absolute",
      inset: "0",
      backgroundImage: `url("${image}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    });
    curtain.appendChild(img);
  }
  if (tint) {
    const gradient = document.createElement("div");
    Object.assign(gradient.style, {
      position: "absolute",
      inset: "0",
      background:
        "linear-gradient(to top, rgba(232,55,44,0.92) 0%, rgba(232,55,44,0.55) 28%, rgba(232,55,44,0.12) 55%, rgba(232,55,44,0) 70%), rgba(232,55,44,0.15)",
    });
    curtain.appendChild(gradient);
  }
  let text: HTMLSpanElement | undefined;
  if (label) {
    text = document.createElement("span");
    text.textContent = label;
    text.className = "font-heading";
    Object.assign(text.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      color: "#fff",
      fontSize: "clamp(56px, 11vw, 200px)",
      lineHeight: "1",
      whiteSpace: "nowrap",
      opacity: "0",
    });
    curtain.appendChild(text);
  }
  document.body.appendChild(curtain);

  getSiteState().lenis?.stop();
  clearTimeout(safetyTimer);
  safetyTimer = setTimeout(releaseCurtain, SAFETY_MS);

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: () => resolve() });
    tl.to(curtain, {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 0.9,
      ease: "power4.inOut",
    });
    if (text) tl.fromTo(text, { opacity: 0, yPercent: 30 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: "power3.out" }, 0.45);
  });
}

/** Called by the destination page once it is mounted: fades the curtain away. */
export function releaseCurtain(): void {
  clearTimeout(safetyTimer);
  const lenis = getSiteState().lenis;
  lenis?.start();
  const curtain = document.getElementById(CURTAIN_ID);
  if (!curtain) return;
  curtain.id = "";
  gsap.fromTo(curtain, { clipPath: "inset(0% 0% 0% 0%)" }, {
    clipPath: "inset(0% 0% 100% 0%)",
    duration: 0.9,
    ease: "power4.inOut",
    delay: 0.1,
    onComplete: () => curtain.remove(),
  });
}

/** New pages start at the top, also when Lenis kept the previous position. */
export function resetScroll(): void {
  const lenis = getSiteState().lenis;
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}
