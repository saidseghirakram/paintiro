/**
 * Builds the room photos and their wall masks for the color visualizer.
 *
 *   node scripts/build-room-masks.mjs [--preview <dir>]
 *
 * For each room in data/rooms.json:
 *   - the photo is resized to 1600px and saved as public/rooms/<id>.webp
 *   - the wall mask (white = paintable wall) is saved as public/rooms/<id>-mask.png
 * The mask is grown from seed points (flood fill on similar colors), restricted to
 * hand-drawn wall polygons so it never leaks into the ceiling, floor or furniture.
 * Frames, windows and objects on the walls are excluded automatically because their
 * colors differ from the wall. --preview writes red overlays to check the result.
 */
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CONFIG = path.join(ROOT, "data", "rooms.json");
const OUT_DIR = path.join(ROOT, "public", "rooms");
const WIDTH = 1600;
const previewIndex = process.argv.indexOf("--preview");
const PREVIEW_DIR = previewIndex > 0 ? path.resolve(process.argv[previewIndex + 1]) : null;

/** sRGB (0-255) -> CIE Lab, for perceptual color distances. */
function toLab(r, g, b) {
  const lin = (c) => {
    c /= 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  };
  const R = lin(r), G = lin(g), B = lin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Point-in-polygon (even-odd). */
function inside(x, y, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

async function buildRoom(room) {
  const source = path.resolve(ROOT, room.source);
  const { data, info } = await sharp(source)
    .resize({ width: WIDTH })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const n = width * height;

  // Lab image (slightly smoothed per pixel neighbourhood is not needed at this size).
  const L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [l, a, b] = toLab(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
    L[i] = l; A[i] = a; B[i] = b;
  }

  const mask = new Uint8Array(n);
  for (const wall of room.walls) {
    // Allowed area: inside this wall polygon.
    const allowed = new Uint8Array(n);
    const xs = wall.polygon.map((p) => p[0]);
    const ys = wall.polygon.map((p) => p[1]);
    for (let y = Math.max(0, Math.min(...ys)); y < Math.min(height, Math.max(...ys)); y++) {
      for (let x = Math.max(0, Math.min(...xs)); x < Math.min(width, Math.max(...xs)); x++) {
        if (inside(x + 0.5, y + 0.5, wall.polygon)) allowed[y * width + x] = 1;
      }
    }
    const step = wall.step ?? room.step ?? 2.2; // max color jump between neighbours
    const range = wall.range ?? room.range ?? 14; // max distance to the seed color

    for (const [sx, sy] of wall.seeds) {
      const seed = sy * width + sx;
      if (!allowed[seed]) throw new Error(`${room.id}: seed ${sx},${sy} is outside its polygon`);
      const s = [L[seed], A[seed], B[seed]];
      const stack = [seed];
      const seen = new Uint8Array(n);
      seen[seed] = 1;
      while (stack.length) {
        const p = stack.pop();
        mask[p] = 255;
        const px = p % width;
        const py = (p - px) / width;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const qx = px + dx, qy = py + dy;
          if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
          const q = qy * width + qx;
          if (seen[q] || !allowed[q]) continue;
          seen[q] = 1;
          const dStep = Math.hypot(L[q] - L[p], A[q] - A[p], B[q] - B[p]);
          // Lightness can drift a lot across a wall (light falloff); hue/chroma cannot.
          const dSeed = Math.hypot((L[q] - s[0]) * 0.45, A[q] - s[1], B[q] - s[2]);
          if (dStep <= step && dSeed <= range) stack.push(q);
        }
      }
    }
  }

  // Clean-up: close pinholes (blur + threshold), then feather the edge slightly.
  const solid = await sharp(Buffer.from(mask), { raw: { width, height, channels: 1 } })
    .blur(2.2)
    .threshold(110, { grayscale: true })
    .extractChannel(0)
    .raw()
    .toBuffer();
  const featheredRaw = await sharp(solid, { raw: { width, height, channels: 1 } })
    .blur(0.8)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const alphaChannel = { raw: { width, height, channels: 1 } };
  // CSS masks read the alpha channel: white pixels whose opacity is the wall coverage.
  const feathered = await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .joinChannel(featheredRaw, alphaChannel)
    .png()
    .toBuffer();

  await sharp(source).resize({ width: WIDTH }).webp({ quality: 82 }).toFile(path.join(OUT_DIR, `${room.id}.webp`));
  await sharp(feathered).toFile(path.join(OUT_DIR, `${room.id}-mask.png`));

  let covered = 0;
  for (let i = 0; i < n; i++) if (solid[i] > 127) covered++;
  console.log(`[rooms] ${room.id}: ${width}x${height}, wall = ${((covered / n) * 100).toFixed(1)}% of the photo`);

  if (PREVIEW_DIR) {
    const red = await sharp({ create: { width, height, channels: 3, background: "#ff0000" } })
      .joinChannel(featheredRaw, alphaChannel)
      .png()
      .toBuffer();
    const outline = `<svg width="${width}" height="${height}">${room.walls
      .map((w) => `<polygon points="${w.polygon.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#00ff66" stroke-width="3"/>` +
        w.seeds.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#0066ff"/>`).join(""))
      .join("")}</svg>`;
    const base = await sharp(source).resize({ width: WIDTH }).png().toBuffer();
    const composed = await sharp(base)
      .composite([{ input: red, blend: "over" }, { input: Buffer.from(outline) }])
      .png()
      .toBuffer();
    await sharp(composed)
      .resize({ width: 1100 })
      .jpeg({ quality: 78 })
      .toFile(path.join(PREVIEW_DIR, `${room.id}-preview.jpg`));
  }
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG, "utf8"));
  await mkdir(OUT_DIR, { recursive: true });
  if (PREVIEW_DIR) await mkdir(PREVIEW_DIR, { recursive: true });
  for (const room of config.rooms) await buildRoom(room);
}

main().catch((error) => {
  console.error("[rooms] failed:", error.message ?? error);
  process.exit(1);
});
