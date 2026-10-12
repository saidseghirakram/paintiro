/**
 * Story chapters of the hero animation.
 * All ranges are expressed in STORY progress (0 = start, 1 = end of the hero).
 * One 3D product at a time, centered: each transition is a full spin and the product
 * swaps while it faces away (Klimt Wine style), then all gather into a final lineup.
 */

export type Product = {
  /** Display name in the indicator and the product text. */
  name: string;
  /** Story progress where this product becomes active. */
  start: number;
  /** Story progress where the next product takes over. */
  end: number;
  /** GLB model in /public. */
  model: string;
  /** Cut-out photo, wrapped on the shared bucket mesh when the GLB has no geometry. */
  photo: string;
  /** Size relative to the 18 kg bucket. */
  scale: number;
  /** Muted background tint of the hero while this product is on show. */
  tint: string;
};

export const PRODUCTS: Product[] = [
  { name: "IROVELLA", start: 0.0, end: 0.1, model: "/3d-products/IROVELLA.glb", photo: "/products/irovella.webp", scale: 1, tint: "#bccbbb" },
  { name: "PLAFONYA", start: 0.1, end: 0.225, model: "/3d-products/PLAFONYA.glb", photo: "/products/plafonya.webp", scale: 1, tint: "#b9c4ce" },
  { name: "FIX-ONE", start: 0.225, end: 0.35, model: "/3d-products/FIXONE.glb", photo: "/products/fix-one.webp", scale: 1, tint: "#b5cdd6" },
  { name: "IROCRYL", start: 0.35, end: 0.475, model: "/3d-products/IROCRYL.glb", photo: "/products/irocryl-4l.webp", scale: 1, tint: "#d6c0b8" },
  { name: "IROFAÇADE", start: 0.475, end: 1.0, model: "/3d-products/IROFACADE.glb", photo: "/products/irofacade.webp", scale: 1, tint: "#d8cda4" },
];

/** Hero background outside the product chapters (title and final lineup). */
export const NEUTRAL_TINT = "#d0cfcb";

/** Scroll progress where the floating intro product has settled upright in the center. */
export const INTRO_END = 0.075;

/** Story progress where the product spins end and the final lineup starts. */
export const FINALE_START = 0.67;

/** Story progress after which the final CTA is shown. */
export const CTA_START = 0.93;

/** Scroll progress range during which the hero title fades out. */
export const HERO_TEXT_FADE_END = 0.06;

/** Scroll progress after which the scroll hint is hidden. */
export const SCROLL_HINT_FADE_END = 0.03;

/** Scroll progress after which the product texts may appear (once the title is gone). */
export const PRODUCT_TEXT_START = 0.05;

/**
 * Scroll -> story mapping as [scrollProgress, storyProgress] points (linear in between).
 * Flat parts (much scroll, little story) = product facing the camera, time to read.
 * Steep parts (little scroll, much story) = the quick spin to the next product.
 * The last segment is the final lineup, played slowly.
 */
export const SCROLL_MAP: [number, number][] = [
  [0.0, 0.0],
  [0.05, 0.01], // title, almost still
  [0.12, 0.065], // IROVELLA, hold
  [0.19, 0.135], // spin
  [0.26, 0.19], // PLAFONYA, hold
  [0.33, 0.26], // spin
  [0.4, 0.315], // FIX-ONE, hold
  [0.47, 0.385], // spin
  [0.54, 0.44], // IROCRYL, hold
  [0.61, 0.51], // spin
  [0.72, 0.67], // IROFAÇADE, hold
  [1.0, 1.0], // final lineup, slow and cinematic
];

/**
 * Story progress -> product position as [storyProgress, productIndex] points.
 * Each spin is centered on the PRODUCTS boundary, so the texts swap mid-spin.
 */
export const FOCUS_MAP: [number, number][] = [
  [0.0, 0],
  [0.065, 0],
  [0.135, 1],
  [0.19, 1],
  [0.26, 2],
  [0.315, 2],
  [0.385, 3],
  [0.44, 3],
  [0.51, 4],
  [FINALE_START, 4],
];

/**
 * Scroll progress where each product faces the camera (middle of its hold).
 * When the scroll stops between two of them, the page glides to one of these,
 * one product per scroll gesture, so a fast flick never skips a product.
 */
export const PRODUCT_SNAPS = [0.09, 0.225, 0.365, 0.505, 0.665];

/** Snapping only happens in this scroll progress range (title and finale scroll freely). */
export const SNAP_RANGE: [number, number] = [0.05, 0.69];

/** Linear interpolation through [x, y] points, clamped to the ends. */
function piecewise(points: [number, number][], x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      const t = x1 === x0 ? 1 : (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }
  return points[points.length - 1][1];
}

/** Converts scroll progress (0..1) to story progress (0..1) using SCROLL_MAP. */
export function mapProgress(scroll: number): number {
  return piecewise(SCROLL_MAP, Math.min(1, Math.max(0, scroll)));
}

/** Carousel position (fractional product index) for a story progress. */
export function mapFocus(progress: number): number {
  return piecewise(FOCUS_MAP, progress);
}

/** Returns the index of the active product for a given story progress. */
export function getActiveProduct(frameProgress: number): number {
  for (let i = PRODUCTS.length - 1; i >= 0; i--) {
    if (frameProgress >= PRODUCTS[i].start) return i;
  }
  return 0;
}
