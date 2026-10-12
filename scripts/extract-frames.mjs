/**
 * Cuts a video into WebP frames for the hero sequence:
 *   public/frames/frame_0001.webp, frame_0002.webp ...
 * then regenerates public/frames/manifest.json.
 *
 *   npm run frames:extract
 *   npm run frames:extract -- --video videos/my-video.mp4 --fps 24 --width 1920 --quality 82
 *   npm run frames:extract -- --start 0.5 --end 9.5      (trim, in seconds)
 *
 * Requires ffmpeg on the PATH (https://ffmpeg.org/download.html).
 * Frames go through a temporary PNG step so sharp controls the WebP quality.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "public", "frames");
const FRAME_EXT = /\.(webp|jpe?g|png|avif)$/i;

/** Reads "--name value" pairs from the command line. */
function readArgs() {
  const args = process.argv.slice(2);
  const options = {
    video: "videos/hero.mp4",
    fps: null,
    width: 1920,
    quality: 82,
    start: null,
    end: null,
  };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    const value = args[i + 1];
    if (!(key in options) || value === undefined) {
      console.error(`[frames] unknown or empty option: ${args[i]}`);
      process.exit(1);
    }
    options[key] = key === "video" ? value : Number(value);
  }
  return options;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: ["ignore", "inherit", "inherit"] });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with code ${result.status}`);
}

async function main() {
  const options = readArgs();
  const video = path.resolve(ROOT, options.video);
  if (!existsSync(video)) {
    console.error(`[frames] video not found: ${video}`);
    process.exit(1);
  }
  if (spawnSync("ffmpeg", ["-version"]).status !== 0) {
    console.error("[frames] ffmpeg is not installed or not on the PATH.");
    process.exit(1);
  }

  const tempDir = path.join(os.tmpdir(), `paintiro-frames-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  try {
    // 1. Video -> lossless PNG frames (native frame rate unless --fps is given).
    const ffmpegArgs = ["-hide_banner", "-loglevel", "error"];
    if (options.start !== null) ffmpegArgs.push("-ss", String(options.start));
    if (options.end !== null) ffmpegArgs.push("-to", String(options.end));
    ffmpegArgs.push("-i", video);
    const filters = [`scale=${options.width}:-2:flags=lanczos`];
    if (options.fps) filters.unshift(`fps=${options.fps}`);
    ffmpegArgs.push("-vf", filters.join(","), "-an", path.join(tempDir, "frame_%04d.png"));
    console.log(`[frames] extracting ${path.basename(video)} ...`);
    run("ffmpeg", ffmpegArgs);

    const pngs = (await readdir(tempDir)).filter((f) => f.endsWith(".png")).sort();
    if (pngs.length === 0) throw new Error("ffmpeg produced no frames");

    // 2. Remove the previous frame set (manifest is regenerated below).
    await mkdir(OUTPUT_DIR, { recursive: true });
    const old = (await readdir(OUTPUT_DIR)).filter((f) => FRAME_EXT.test(f));
    await Promise.all(old.map((f) => rm(path.join(OUTPUT_DIR, f))));

    // 3. PNG -> WebP.
    let done = 0;
    for (const file of pngs) {
      await sharp(path.join(tempDir, file))
        .webp({ quality: options.quality, effort: 5 })
        .toFile(path.join(OUTPUT_DIR, file.replace(".png", ".webp")));
      done++;
      if (done % 40 === 0 || done === pngs.length) {
        console.log(`[frames] ${done}/${pngs.length} converted`);
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  // 4. Manifest.
  run(process.execPath, [path.join(ROOT, "scripts", "generate-manifest.mjs")]);
}

main().catch((error) => {
  console.error("[frames] extraction failed:", error.message ?? error);
  process.exit(1);
});
