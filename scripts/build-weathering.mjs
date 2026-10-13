/**
 * Bakes the "ordinary paint" weathering layers for the 10-year test section.
 *
 *   node scripts/build-weathering.mjs [--preview <dir>]
 *
 * From public/solutions/exterior.webp it finds the painted (white render) surfaces
 * of the house inside hand-drawn wall polygons, so sky, glass, plants and the pool
 * are never touched, then writes four transparent layers that line up pixel
 * for pixel with the photo (public/ten-year/):
 *   faded.webp    - the paint yellowed, chalky and blotchy after years of UV
 *   streaks.webp  - dirt run-off under every ledge, splash grime at the bottom
 *   cracks.webp   - hairline and structural cracks, map-cracking around them
 *   peeling.webp  - paint lifted off, exposing the grey render underneath
 * The section stacks them over the photo and fades them in with the years.
 * --preview writes the mask and the fully aged composite to check the result.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "solutions", "exterior.webp");
const OUT_DIR = path.join(ROOT, "public", "ten-year");
const previewIndex = process.argv.indexOf("--preview");
const PREVIEW_DIR = previewIndex > 0 ? path.resolve(process.argv[previewIndex + 1]) : null;

/* ---------- zones (image pixels, 1600x1068) ---------- */

/** The painted surfaces of the left half of the house (the section only shows x < 800). */
const WALLS = [
  [[328, 234], [882, 234], [882, 346], [328, 346]], // roof slab: front face and soffit
  [[738, 346], [816, 346], [816, 432], [738, 432]], // pier between the upper windows
  [[196, 507], [782, 507], [782, 566], [196, 566]], // balcony slab
  [[258, 566], [364, 566], [364, 772], [258, 772]], // left column
  [[776, 466], [882, 466], [882, 532], [836, 532], [836, 834], [776, 834]], // pergola frame
];
/** Peeled patches: center x, y, radius, seed. */
const PEELS = [
  [300, 540, 15, 1], [610, 544, 9, 3],
  [304, 622, 12, 4], [430, 270, 11, 6], [802, 640, 8, 8],
];
/** Crack seeds: start x, y, main heading (radians, 0 = right, PI/2 = down), length, seed. */
const CRACKS = [
  [332, 238, 1.15, 60, 11], // corner crack off the roof slab
  [700, 236, 1.7, 52, 13],
  [470, 509, 1.5, 46, 15],
  [336, 568, 1.6, 130, 17], // long crack down the column
  [794, 470, 1.56, 150, 19],
];

/* ---------- helpers ---------- */

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function hash2(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function noise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const u = smooth(x - xi), v = smooth(y - yi);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, seed = 0, octaves = 4) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(x, y, seed + o * 31);
    norm += amp;
    x *= 2.03; y *= 2.03; amp *= 0.5;
  }
  return sum / norm;
}

function inPoly(x, y, poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** sRGB -> Lab lightness + chroma. */
function lightChroma(r, g, b) {
  const lin = (c) => ((c /= 255) > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
  const R = lin(r), G = lin(g), B = lin(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const L = 116 * f(y) - 16;
  return [L, Math.hypot(500 * (f(x) - f(y)), 200 * (f(y) - f(z)))];
}

async function writeLayer(rgba, width, height, name) {
  await sharp(Buffer.from(rgba.buffer), { raw: { width, height, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(path.join(OUT_DIR, name));
}

/* ---------- main ---------- */

async function main() {
  const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const n = W * H;
  await mkdir(OUT_DIR, { recursive: true });

  // 1. Wall mask: the wall polygons minus anything dark or colored in front of them (plants, furniture).
  const raw = new Uint8Array(n);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!WALLS.some((poly) => inPoly(x + 0.5, y + 0.5, poly))) continue;
      const i = y * W + x;
      const [L, C] = lightChroma(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
      if (L > 58 && C < 16) raw[i] = 255;
    }
  }
  const closed = await sharp(Buffer.from(raw), { raw: { width: W, height: H, channels: 1 } })
    .blur(1.6).threshold(120, { grayscale: true }).extractChannel(0).raw().toBuffer();
  const soft = await sharp(closed, { raw: { width: W, height: H, channels: 1 } })
    .blur(0.7).extractChannel(0).raw().toBuffer();
  const mask = new Float32Array(n);
  for (let i = 0; i < n; i++) mask[i] = soft[i] / 255;

  // Distance (px) from the top and the bottom of each vertical run of wall: dirt runs down from ledges.
  const fromTop = new Float32Array(n).fill(1e4);
  const fromBottom = new Float32Array(n).fill(1e4);
  for (let x = 0; x < W; x++) {
    let d = 1e4;
    for (let y = 0; y < H; y++) {
      const i = y * W + x;
      d = closed[i] ? (d >= 1e4 ? 0 : d + 1) : 1e4;
      fromTop[i] = d;
    }
    d = 1e4;
    for (let y = H - 1; y >= 0; y--) {
      const i = y * W + x;
      d = closed[i] ? (d >= 1e4 ? 0 : d + 1) : 1e4;
      fromBottom[i] = d;
    }
  }

  const faded = new Uint8ClampedArray(n * 4);
  const streaks = new Uint8ClampedArray(n * 4);
  const cracks = new Uint8ClampedArray(n * 4);
  const peeling = new Uint8ClampedArray(n * 4);

  // 2. Faded paint: UV yellowing, chalking (lower contrast), blotchy uneven tone.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const m = mask[i];
      if (m <= 0) continue;
      const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      const blotch = fbm(x / 70, y / 70, 3, 5);
      const fine = fbm(x / 9, y / 9, 7, 3);
      const k = 1 - Math.max(0, blotch - 0.42) * 0.14 - (fine - 0.5) * 0.035;
      // Off-white turning dull cream-grey (the photo's cool cast is dropped, highlights flatten: chalking).
      const lum = (0.3 * r + 0.59 * g + 0.11 * b) * 0.9 + 12;
      faded[i * 4] = lum * 0.985 * k;
      faded[i * 4 + 1] = lum * 0.955 * k;
      faded[i * 4 + 2] = lum * 0.865 * k;
      faded[i * 4 + 3] = m * 255;
    }
  }

  // 3. Streaks: rain washes dirt down from every ledge in thin irregular runs.
  const colStrength = new Float32Array(W);
  const colLength = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    const s = fbm(x / 5.5, 0.5, 21, 3);
    colStrength[x] = clamp01((s - 0.56) * 4) * (0.35 + 0.65 * noise2(x / 60, 3.3, 22));
    colLength[x] = 14 + 110 * fbm(x / 17, 7.7, 23, 3) ** 2;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const m = mask[i];
      if (m <= 0) continue;
      const dt = fromTop[i], db = fromBottom[i];
      const wobble = Math.round(2.2 * Math.sin(y / 23 + x * 0.7) + 1.5 * (noise2(x / 3, y / 31, 24) - 0.5));
      const cx = Math.min(W - 1, Math.max(0, x + wobble));
      const len = colLength[cx];
      const run = colStrength[cx] * Math.exp(-dt / len) * clamp01(dt / 3);
      const breakup = 0.6 + 0.4 * fbm(x / 3, y / 18, 25, 2);
      const sheet = 0.09 * Math.exp(-dt / 16) * clamp01(dt / 2) * (0.5 + fbm(x / 20, 1.5, 28, 3)); // grey band under the ledge
      const splash = 0.22 * Math.exp(-db / 26) * (0.4 + 0.9 * fbm(x / 7, y / 7, 26, 3)); // ground splash
      const grime = 0.05 * clamp01((fbm(x / 60, y / 60, 27, 4) - 0.5) * 3);
      const a = clamp01(run * breakup * 0.42 + sheet + splash + grime) * m;
      // Soot grey-brown near the top, greenish-brown (algae, mud) near the ground.
      const green = clamp01(1 - db / 60);
      streaks[i * 4] = 78 - 14 * green;
      streaks[i * 4 + 1] = 70 - 4 * green;
      streaks[i * 4 + 2] = 58 - 12 * green;
      streaks[i * 4 + 3] = a * 255;
    }
  }

  // 4. Cracks: jagged random walks with branches, drawn as SVG (dark gap + lit lower lip).
  const paths = [];
  const walk = (x, y, heading, length, rand, width, depth) => {
    const pts = [[x, y]];
    let h = heading;
    for (let s = 0; s < length; s += 2 + rand() * 3) {
      h += (rand() - 0.5) * 0.55 + (heading - h) * 0.3;
      x += Math.cos(h) * (2 + rand() * 3);
      y += Math.sin(h) * (2 + rand() * 3);
      pts.push([x, y]);
      if (depth < 1 && rand() < 0.03) {
        walk(x, y, h + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6), length * (0.25 + rand() * 0.3), rand, width * 0.6, depth + 1);
      }
    }
    paths.push({ d: "M" + pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L"), width });
  };
  for (const [x, y, heading, length, seed] of CRACKS) walk(x, y, heading, length, rng(seed), 0.95, 0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      ${paths.map((p) => `<path d="${p.d}" transform="translate(0.8 0.9)" stroke="rgba(255,252,244,0.4)" stroke-width="${(p.width * 0.8).toFixed(2)}"/>`).join("")}
      ${paths.map((p) => `<path d="${p.d}" stroke="rgba(66,58,50,0.62)" stroke-width="${p.width.toFixed(2)}"/>`).join("")}
    </g></svg>`;
  const crackRaster = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();

  // Map-cracking (crazing): a cell network around the damaged spots.
  const crazeAt = PEELS.map(([x, y, r]) => [x, y, r * 2.1]);
  const CELL = 9;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const m = mask[i];
      if (m <= 0) continue;
      let a = crackRaster[i * 4 + 3] / 255;
      let r = crackRaster[i * 4], g = crackRaster[i * 4 + 1], b = crackRaster[i * 4 + 2];
      let weight = 0;
      for (const [cx, cy, rad] of crazeAt) {
        const d = Math.hypot(x - cx, y - cy) / rad;
        if (d < 1) weight = Math.max(weight, smooth(1 - d));
      }
      if (weight > 0) {
        const jx = x + 4 * (noise2(x / 9, y / 9, 41) - 0.5), jy = y + 4 * (noise2(x / 9, y / 9, 42) - 0.5);
        const gx = Math.floor(jx / CELL), gy = Math.floor(jy / CELL);
        let f1 = 1e9, f2 = 1e9;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const px = (gx + ox + hash2(gx + ox, gy + oy, 43)) * CELL;
            const py = (gy + oy + hash2(gx + ox, gy + oy, 44)) * CELL;
            const d = Math.hypot(jx - px, jy - py);
            if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
          }
        }
        const edge = clamp01(1 - (f2 - f1) / 0.9) * weight * clamp01((noise2(x / 5, y / 5, 45) - 0.3) * 2);
        if (edge * 0.4 > a) { a = edge * 0.4; r = 80; g = 72; b = 62; }
      }
      cracks[i * 4] = r; cracks[i * 4 + 1] = g; cracks[i * 4 + 2] = b;
      cracks[i * 4 + 3] = a * m * 255;
    }
  }

  // 5. Peeling: irregular patches of exposed grey render, with lifted paint edges and their shadows.
  const shapeAt = (x, y, cx, cy, rad, seed) => {
    const angle = Math.atan2(y - cy, x - cx);
    const rr = rad * (0.45 + 1.1 * fbm(Math.cos(angle) * 2.2 + seed * 7, Math.sin(angle) * 2.2, seed, 5));
    // Wider than tall (paint lets go along the run of the render), ragged edge.
    return Math.hypot((x - cx) * 0.8, (y - cy) * 1.25) / rr + 0.2 * (fbm(x / 4, y / 4, seed + 50, 3) - 0.5);
  };
  const flakes = [];
  for (const [cx, cy, rad, seed] of PEELS) {
    flakes.push([cx, cy, rad, seed]);
    const rand = rng(seed * 97);
    for (let k = 0; k < 2; k++) {
      const a = rand() * Math.PI * 2, d = rad * (1.3 + rand() * 1.1);
      flakes.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, rad * (0.1 + rand() * 0.16), seed * 10 + k]);
    }
  }
  for (const [cx, cy, rad, seed] of flakes) {
    const reach = Math.ceil(rad * 1.6) + 4;
    for (let y = Math.max(0, Math.floor(cy - reach)); y < Math.min(H, cy + reach); y++) {
      for (let x = Math.max(0, Math.floor(cx - reach)); x < Math.min(W, cx + reach); x++) {
        const i = y * W + x;
        const m = mask[i];
        if (m <= 0) continue;
        const e = shapeAt(x, y, cx, cy, rad, seed);
        const eShadow = shapeAt(x - 1.6, y - 1.8, cx, cy, rad, seed); // light from the upper left
        let r, g, b, a;
        if (e < 1) {
          // Exposed render: grey, grainy, darker in the shade of the lifted top-left edge.
          const grain = fbm(x / 1.7, y / 1.7, seed + 60, 3) - 0.5;
          const rim = clamp01((e - 0.78) / 0.22);
          const top = clamp01(-((x - cx) + (y - cy)) / (rad * 1.4) + 0.3);
          const shade = 1 - 0.18 * rim * top;
          r = (192 + grain * 34) * shade; g = (184 + grain * 32) * shade; b = (168 + grain * 28) * shade;
          a = 0.96;
          if (e > 0.9 && (x - cx) + (y - cy) > rad * 0.2) { r = 240; g = 236; b = 226; a = 0.55; } // lit broken edge of the paint
        } else if (eShadow < 1) {
          r = 70; g = 62; b = 52; a = 0.26;
        } else continue;
        peeling[i * 4] = r; peeling[i * 4 + 1] = g; peeling[i * 4 + 2] = b;
        peeling[i * 4 + 3] = Math.max(peeling[i * 4 + 3], a * m * 255);
      }
    }
  }

  await writeLayer(faded, W, H, "faded.webp");
  await writeLayer(streaks, W, H, "streaks.webp");
  await writeLayer(cracks, W, H, "cracks.webp");
  await writeLayer(peeling, W, H, "peeling.webp");
  console.log(`[weathering] wrote 4 layers (${W}x${H}) to ${path.relative(ROOT, OUT_DIR)}`);

  if (PREVIEW_DIR) {
    await mkdir(PREVIEW_DIR, { recursive: true });
    await sharp(closed, { raw: { width: W, height: H, channels: 1 } }).png().toFile(path.join(PREVIEW_DIR, "mask.png"));
    const layer = (buf) => sharp(Buffer.from(buf.buffer), { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    await sharp(SOURCE)
      .composite([
        { input: await layer(faded) },
        { input: await layer(streaks) },
        { input: await layer(cracks) },
        { input: await layer(peeling) },
      ])
      .png()
      .toFile(path.join(PREVIEW_DIR, "aged.png"));
    console.log(`[weathering] preview in ${PREVIEW_DIR}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
