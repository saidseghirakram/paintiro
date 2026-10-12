/**
 * Global tuning knobs for the hero frame sequence and the loader.
 * Change values here, every component reads them from this single file.
 */

/** Height of the hero scroll section, in viewport-height units (1200 = 1200svh). */
export const SCROLL_LENGTH = 1200;

/** GSAP ScrollTrigger scrub smoothing in seconds (0 = locked to the scrollbar). */
export const SCRUB = 0.6;

/** Default canvas fit on desktop / landscape. Mobile portrait always uses "contain". */
export const DEFAULT_FIT: "cover" | "contain" = "cover";

/**
 * On mobile portrait the frame is drawn with "contain" logic, multiplied by this
 * zoom so the product stays large. 1 = whole frame visible, 1.8 = central part only.
 */
export const MOBILE_CONTAIN_ZOOM = 1.9;

/** Folder (inside /public) that holds the frames and manifest.json. */
export const FRAMES_DIR = "/frames";

/** Loader: fraction of the 3D products that must be loaded before the loader can leave. */
export const LOADER_READY_RATIO = 1;

/** Loader: minimum time on screen, in milliseconds. */
export const LOADER_MIN_TIME = 1200;

/** Frame loader: number of frames loaded first with high priority. */
export const PRIORITY_FRAMES = 30;

/** Frame loader: number of frames requested in parallel after the priority group. */
export const BATCH_SIZE = 12;

/** Above this many frames, only a sliding window of decoded frames is kept in memory. */
export const WINDOW_THRESHOLD = 400;

/** Size of the sliding window of decoded frames (used only above WINDOW_THRESHOLD). */
export const WINDOW_SIZE = 120;

/** Max devicePixelRatio for the canvas (desktop / screens under 768px). */
export const MAX_DPR = 2;
export const MAX_DPR_MOBILE = 1.5;

/** 3D hero: max devicePixelRatio of the WebGL canvas (desktop / screens under 768px). */
export const MAX_DPR_3D = 2;
export const MAX_DPR_3D_MOBILE = 1.5;
