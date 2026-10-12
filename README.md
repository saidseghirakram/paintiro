# PAINTIRO website

Next.js 16 (App Router, TypeScript, Tailwind v4) + GSAP ScrollTrigger + Lenis.
The hero plays a 3D product animation as a scroll-controlled image sequence on a canvas.

## Install and run

```bash
npm install
npm run dev        # http://localhost:3000  (regenerates the frame manifest first)
npm run build      # production build (also regenerates the manifest)
npm start
```

`/` redirects to `/en`. French lives at `/fr`.

## Page sections

| # | Section | Component |
| --- | --- | --- |
| 01–03 | Hero: scroll-controlled product film, product texts | `components/FrameSequence.tsx` |
| 04 | 3D product experience (pinned, one category per scroll step) | `components/sections/ProductShowcase.tsx` |
| 05 | Featured products | `components/sections/FeaturedProducts.tsx` |
| 06 | PAINTIRO AI floating assistant (keyword-based recommendations, no API) | `components/AiAssistant.tsx` |
| 07 | Solutions | `components/sections/Solutions.tsx` |
| 08 | Colors (families, swatches, live wall preview) | `components/sections/Colors.tsx` + `lib/colors.ts` |
| 09 | Why PAINTIRO (benefits + count-up numbers) | `components/sections/WhyPaintiro.tsx` |
| 10 | Latest articles carousel | `components/sections/Articles.tsx` |
| 11 | About + film player | `components/sections/About.tsx` (video: `public/video/paintiro.mp4`) |
| 12 | Find a distributor (opens Google Maps for the typed city) | `components/sections/Distributor.tsx` |
| 13 | Newsletter (client validation; connect it to your mailing service) | `components/sections/Newsletter.tsx` |
| 14 | Footer (social URLs at the top of the file) | `components/Footer.tsx` |

Texts of sections 04–14 (EN / FR): `lib/content-sections.ts`. Product images: `public/products/*.webp`,
product data: `lib/products.ts`.

## The hero animation (video -> frames)

The source video is `videos/hero.mp4`. Cut it into frames with:

```bash
npm run frames:extract
```

This writes `public/frames/frame_0001.webp ...` and `public/frames/manifest.json`.
Requires **ffmpeg** on your PATH. Options:

```bash
npm run frames:extract -- --video videos/new.mp4   # another video
npm run frames:extract -- --width 1600 --quality 78 # lighter frames
npm run frames:extract -- --start 0.4 --end 9.6     # trim (seconds)
npm run frames:extract -- --fps 30                  # resample the frame rate
```

Any frame count works, the manifest is detected automatically.
If you already have image frames, drop them in `public/frames/` and run
`npm run frames:manifest` (or `npm run frames:optimize` to convert png/jpg to WebP first).

Smoothness: the canvas cross-fades between neighbouring frames, so the motion is continuous
even with the native 24 fps of the video.

## Where to change things

| What | File |
| --- | --- |
| All texts (EN / FR), product descriptions | `lib/content.ts` |
| Product names + frame ranges, scroll pacing (`SCROLL_MAP`), when the pour / CTA start | `lib/chapters.ts` |
| Scroll length (`SCROLL_LENGTH`, in svh), scrub, loader timing, canvas fit | `lib/config.ts` |
| Colors (`--red`, `--surface`, `--bg`, `--ink`...) | `app/globals.css` |
| Fonts | `lib/fonts.ts` |

Brand theme: PAINTIRO red `#E8372C` + white. `--surface` (white) is the page color; red is used for the loader, logo, buttons and accents.
`--bg` (`#d0cfcb`) is used only behind the hero canvas: it is sampled from the studio background of the frames, so the canvas edges
blend into the page. Change it if you render a new video with another background.

`SCROLL_MAP` in `lib/chapters.ts` is a list of `[scroll, frame]` points: flat parts give the
reader time on each product, steep parts make the spin between products quick.
If you replace the video, update the product `start` / `end` values (frame progress 0..1)
and the points of `SCROLL_MAP`.

## Logo

Put your logo at `public/logo.png` (about 28px tall is used). Without it, a serif "PAINTIRO"
text logo is shown.

## Debug

Add `?debug=1` to the URL to see the current frame and FPS.

## Deploy on Vercel

Push the project to GitHub, import it on vercel.com and keep the defaults
(framework: Next.js, build command `npm run build`). The frames in `public/frames` are
committed and served with a one-year cache header.
