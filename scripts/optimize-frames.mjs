/**
 * Optional: converts every png/jpg in /public/frames (or the folder given as
 * the first argument) to WebP, width 1920, quality 82, renamed to
 * frame_0001.webp, frame_0002.webp ... in /public/frames.
 * Originals are removed only after every frame converted successfully.
 *
 *   npm run frames:optimize
 *   npm run frames:optimize -- ./my-render-folder
 */
import { readdir, rename, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUTPUT_DIR = path.join(process.cwd(), "public", "frames");
const SOURCE_DIR = path.resolve(process.argv[2] ?? OUTPUT_DIR);
const WIDTH = 1920;
const QUALITY = 82;
const INPUT_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

async function main() {
  const sources = (await readdir(SOURCE_DIR))
    .filter((file) => INPUT_EXT.has(path.extname(file).toLowerCase()))
    .sort(collator.compare);

  if (sources.length === 0) {
    console.log(`[frames] no png/jpg/webp found in ${SOURCE_DIR}`);
    return;
  }

  // Write into a temporary folder first so a failure never leaves a half-converted set.
  const tempDir = path.join(OUTPUT_DIR, ".optimized-tmp");
  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });

  let done = 0;
  for (const [i, file] of sources.entries()) {
    const name = `frame_${String(i + 1).padStart(4, "0")}.webp`;
    await sharp(path.join(SOURCE_DIR, file))
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(path.join(tempDir, name));
    done++;
    if (done % 25 === 0 || done === sources.length) {
      console.log(`[frames] ${done}/${sources.length} converted`);
    }
  }

  // Remove originals that live in the output folder, then move the new frames in.
  if (SOURCE_DIR === OUTPUT_DIR) {
    await Promise.all(sources.map((file) => rm(path.join(OUTPUT_DIR, file))));
  }
  for (const file of await readdir(tempDir)) {
    await rename(path.join(tempDir, file), path.join(OUTPUT_DIR, file));
  }
  await rm(tempDir, { recursive: true, force: true });
  console.log(`[frames] done: ${sources.length} WebP frames in public/frames`);
}

main().catch((error) => {
  console.error("[frames] optimisation failed:", error);
  process.exit(1);
});
