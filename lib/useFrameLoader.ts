"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BATCH_SIZE,
  FRAMES_DIR,
  PRIORITY_FRAMES,
  WINDOW_SIZE,
  WINDOW_THRESHOLD,
} from "./config";
import { setSiteState } from "./store";

/** Shape of /public/frames/manifest.json, written by scripts/generate-manifest.mjs. */
export type FrameManifest = {
  count: number;
  /** Naming pattern when files follow it (e.g. "frame_{index}.webp"), otherwise null. */
  pattern: string | null;
  width: number;
  height: number;
  /** Ordered file names, always present so any naming works. */
  files: string[];
  /** Indexes of frames with motion blur; the hero never rests on them. */
  blurry?: number[];
};

export type Drawable = HTMLImageElement;

export type LoadedFrame = { image: Drawable; index: number };

/**
 * Fetches and decodes one frame as an <img>.
 * ImageBitmaps were avoided on purpose: they pin the fully decoded pixels in memory
 * (300 frames at 1920x1080 is about 2.5 GB), which crashes mobile tabs. An <img> keeps
 * the small compressed file and lets the browser manage its decoded-image cache.
 * img.decode() still decodes off the main thread before the first draw.
 */
async function decodeFrame(url: string, signal: AbortSignal): Promise<Drawable> {
  const image = new Image();
  image.decoding = "async";
  const abort = () => {
    image.src = "";
  };
  signal.addEventListener("abort", abort, { once: true });
  image.src = url;
  try {
    await image.decode();
  } finally {
    signal.removeEventListener("abort", abort);
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return image;
}

/** Drops a frame so the browser can free its memory. */
function release(image: Drawable | null): void {
  if (image) image.src = "";
}

/**
 * Loads the frame manifest and decodes every frame progressively.
 * - frame 1 first, then PRIORITY_FRAMES in parallel, then batches of BATCH_SIZE
 * - images live in a ref (never in React state), decoded before first use
 * - progress is pushed to the shared store for the Loader
 * - above WINDOW_THRESHOLD frames only a sliding window around the playhead is kept
 */
export function useFrameLoader() {
  const [manifest, setManifest] = useState<FrameManifest | null>(null);
  const framesRef = useRef<(Drawable | null)[]>([]);
  const windowedRef = useRef(false);
  const centerRef = useRef(0);
  const pumpRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const pending = new Set<number>();
    let active = 0;
    setSiteState({ loadProgress: 0 });

    const run = async () => {
      let data: FrameManifest;
      try {
        const response = await fetch(`${FRAMES_DIR}/manifest.json`, { signal: controller.signal });
        data = (await response.json()) as FrameManifest;
      } catch {
        // No manifest: let the site open anyway instead of blocking on the loader.
        if (!cancelled) setSiteState({ loadProgress: 1 });
        return;
      }
      if (cancelled) return;
      if (!data.count || !data.files?.length) {
        setSiteState({ loadProgress: 1 });
        return;
      }

      framesRef.current = new Array<Drawable | null>(data.count).fill(null);
      windowedRef.current = data.count > WINDOW_THRESHOLD;
      setManifest(data);

      // The loader measures progress against what we actually plan to keep in memory.
      const target = windowedRef.current ? Math.min(data.count, WINDOW_SIZE) : data.count;
      let settled = 0;
      const report = () => {
        if (!cancelled) setSiteState({ loadProgress: Math.min(1, settled / target) });
      };

      const load = async (index: number, counts: boolean): Promise<void> => {
        if (framesRef.current[index] || pending.has(index)) return;
        pending.add(index);
        try {
          const image = await decodeFrame(`${FRAMES_DIR}/${data.files[index]}`, controller.signal);
          if (cancelled) {
            release(image);
            return;
          }
          framesRef.current[index] = image;
        } catch {
          // A broken frame is skipped: the renderer falls back to the nearest loaded one.
        } finally {
          pending.delete(index);
          if (counts) {
            settled++;
            report();
          }
        }
      };

      // Sliding-window pump: keeps BATCH_SIZE requests in flight around the playhead.
      const nextMissing = (): number => {
        const half = Math.floor(WINDOW_SIZE / 2);
        const center = centerRef.current;
        for (let offset = 0; offset <= half; offset++) {
          for (const index of [center + offset, center - offset]) {
            if (index < 0 || index >= data.count) continue;
            if (!framesRef.current[index] && !pending.has(index)) return index;
          }
        }
        return -1;
      };
      pumpRef.current = () => {
        while (!cancelled && active < BATCH_SIZE) {
          const index = nextMissing();
          if (index === -1) return;
          active++;
          void load(index, false).finally(() => {
            active--;
            pumpRef.current();
          });
        }
      };

      // 1. First frame alone, so the canvas is never blank.
      await load(0, true);
      if (cancelled) return;

      // 2. Priority group in parallel.
      const priorityEnd = Math.min(target, PRIORITY_FRAMES);
      const priority: Promise<void>[] = [];
      for (let i = 1; i < priorityEnd; i++) priority.push(load(i, true));
      await Promise.all(priority);

      // 3. The rest in parallel batches.
      for (let start = priorityEnd; start < target && !cancelled; start += BATCH_SIZE) {
        const batch: Promise<void>[] = [];
        for (let i = start; i < Math.min(target, start + BATCH_SIZE); i++) batch.push(load(i, true));
        await Promise.all(batch);
      }

      // 4. Windowed mode: from now on frames follow the playhead.
      if (windowedRef.current && !cancelled) pumpRef.current();
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
      framesRef.current.forEach(release);
      framesRef.current = [];
      pumpRef.current = () => {};
    };
  }, []);

  /** Returns the requested frame, or the nearest previously loaded one (then the next one). */
  const getFrame = useCallback((index: number): LoadedFrame | null => {
    const frames = framesRef.current;
    for (let i = Math.min(index, frames.length - 1); i >= 0; i--) {
      const image = frames[i];
      if (image) return { image, index: i };
    }
    for (let i = index + 1; i < frames.length; i++) {
      const image = frames[i];
      if (image) return { image, index: i };
    }
    return null;
  }, []);

  /** Tells the loader where the playhead is (only matters in sliding-window mode). */
  const focus = useCallback((index: number) => {
    if (!windowedRef.current) return;
    if (Math.abs(index - centerRef.current) < 4) return;
    centerRef.current = index;
    const half = Math.floor(WINDOW_SIZE / 2);
    const frames = framesRef.current;
    for (let i = 0; i < frames.length; i++) {
      // Frame 0 is always kept as the ultimate fallback.
      if (i !== 0 && frames[i] && Math.abs(i - index) > half) {
        release(frames[i]);
        frames[i] = null;
      }
    }
    pumpRef.current();
  }, []);

  return { manifest, getFrame, focus };
}
