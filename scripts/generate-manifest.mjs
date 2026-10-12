/**
 * Scans /public/frames and writes /public/frames/manifest.json:
 * { count, pattern, width, height, files, signature, blurry }
 * Runs automatically before `npm run dev` and `npm run build`.
 *
 * `blurry` lists the indexes (0-based) of frames with motion blur (fast spins in the
 * video). The hero never comes to rest on them: when the scroll stops on a blurry
 * frame, the picture glides to the nearest sharp one. The analysis is cached through
 * `signature` and only re-runs when the frame files change.
 */
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const FRAMES_DIR = path.join(process.cwd(), "public", "frames");
const MANIFEST = path.join(FRAMES_DIR, "manifest.json");
const EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** A frame is blurry when its sharpness is below this share of the sharpest neighbour. */
const BLUR_RATIO = 0.85;
/** Neighbourhood used for that comparison (frames on each side). */
const BLUR_WINDOW = 12;

/** Sharpness = standard deviation of the Laplacian (edge energy) on a small greyscale copy. */
async function sharpness(file) {
  const { data } = await sharp(file)
    .greyscale()
    .resize(480)
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  let sumSq = 0;
  for (const v of data) {
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / data.length;
  return Math.sqrt(sumSq / data.length - mean * mean);
}

async function detectBlurry(files) {
  const scores = [];
  for (const file of files) scores.push(await sharpness(path.join(FRAMES_DIR, file)));
  const blurry = [];
  scores.forEach((score, i) => {
    let best = 0;
    for (let j = Math.max(0, i - BLUR_WINDOW); j <= Math.min(scores.length - 1, i + BLUR_WINDOW); j++) {
      best = Math.max(best, scores[j]);
    }
    if (score < best * BLUR_RATIO) blurry.push(i);
  });
  return blurry;
}

async function main() {
  if (!existsSync(FRAMES_DIR)) await mkdir(FRAMES_DIR, { recursive: true });

  const files = (await readdir(FRAMES_DIR))
    .filter((file) => EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort(collator.compare);

  let width = 0;
  let height = 0;
  if (files.length > 0) {
    const meta = await sharp(path.join(FRAMES_DIR, files[0])).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  }

  // Report the canonical pattern only when every file follows frame_0001.ext.
  const ext = files.length ? path.extname(files[0]) : ".webp";
  const followsPattern =
    files.length > 0 &&
    files.every((file, i) => file === `frame_${String(i + 1).padStart(4, "0")}${ext}`);

  // Names + sizes identify a frame set; reuse the blur analysis when nothing changed.
  const sizes = await Promise.all(files.map((file) => stat(path.join(FRAMES_DIR, file)).then((s) => s.size)));
  const signature = files.map((file, i) => `${file}:${sizes[i]}`).join("|");
  let blurry = null;
  if (existsSync(MANIFEST)) {
    try {
      const previous = JSON.parse(await readFile(MANIFEST, "utf8"));
      if (previous.signature === signature && Array.isArray(previous.blurry)) blurry = previous.blurry;
    } catch {
      // Unreadable manifest: analyse again.
    }
  }
  if (!blurry) {
    if (files.length) console.log(`[frames] analysing sharpness of ${files.length} frames...`);
    blurry = await detectBlurry(files);
  }

  const manifest = {
    count: files.length,
    pattern: followsPattern ? `frame_{index}${ext}` : null,
    width,
    height,
    files,
    signature,
    blurry,
  };

  await writeFile(MANIFEST, JSON.stringify(manifest));
  console.log(
    `[frames] manifest.json written: ${files.length} frames` +
      (files.length ? ` (${width}x${height}), ${blurry.length} with motion blur` : " — add your frames to public/frames"),
  );
}

main().catch((error) => {
  console.error("[frames] could not generate the manifest:", error);
  process.exit(1);
});
