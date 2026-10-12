Build a complete, production-ready Next.js website (App Router, TypeScript) for the paint brand PAINTIRO. This first step contains: (1) a premium NAVBAR, (2) a full-screen HERO that plays a scroll-controlled IMAGE SEQUENCE animation with GSAP + ScrollTrigger, (3) a loader. More sections will be added later, so structure the code so I can add sections easily.

I have 200+ pre-rendered frames of a 3D animation in /public/frames/ (six paint products rotate one by one at the center, then the last bucket flies in 3D, opens and slowly pours white paint into a red paint tray). When the user scrolls, the frames change so it feels like a video that plays forward and backward.

==================================================
1. DESIGN DIRECTION (STYLE REFERENCE: klimtwine.com/en)
==================================================
Take the STYLE of klimtwine.com/en: minimal, editorial, luxurious, lots of white space, large elegant serif headlines, small uppercase navigation, very clean layout, slow smooth animations, subtle details. But the COLORS are PAINTIRO brand colors: red and white.

Colors (CSS variables in globals.css, easy to change):
--red: #E8372C        (brand red, from the logo)
--red-dark: #C42A20
--white: #FFFFFF
--bg: #F2F2F2         (must match the studio background of the frames so edges blend invisibly)
--ink: #141414        (text color)
--muted: #6B6B6B

Rules: red is used only for accents (buy button, small indicators, progress line, hover states, mobile menu background). White and soft grey are the base. No gradients, no shadows heavy, no rounded cartoon shapes. Buttons are rectangular or pill with thin borders, uppercase small text with wide letter-spacing.

Fonts (use next/font/google, define in ONE file lib/fonts.ts so I can swap them):
- Headings: "Cormorant Garamond" (weights 400, 500, 600), large, tight line-height (1.0 to 1.05), letter-spacing -0.01em
- Body, navigation, buttons: "Inter" (weights 400, 500), navigation at 12 to 13px, UPPERCASE, letter-spacing 0.14em
- Numbers/indicators: "Inter" tabular numbers

==================================================
2. TECH STACK
==================================================
- Next.js latest (App Router) + TypeScript + Tailwind CSS
- gsap + ScrollTrigger (npm "gsap")
- Lenis smooth scroll synced with GSAP: lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)
- sharp (for scripts only)
- No other animation libraries. Do the text split manually (no SplitText dependency).

==================================================
3. i18n (EN / FR)
==================================================
- Routes /en and /fr (app/[locale]/page.tsx), default redirect "/" to "/en".
- All texts live in lib/content.ts as { en: {...}, fr: {...} } so I can edit them in one place. Language switch in the navbar "EN / FR" (active language in ink, inactive in muted, red underline on hover).
- Provide placeholder copy:
  EN hero title: "Color, crafted to last." 
  EN hero subtitle: "Professional paints, primers and fixers made for walls that matter."
  FR hero title: "La couleur, faite pour durer."
  FR hero subtitle: "Peintures, primaires et fixateurs professionnels pour des murs qui comptent."
  Nav: Products / Brand / Contact (FR: Produits / Marque / Contact)
  Buy button: "Order now" (FR: "Commander")
  Loader line: "Color is loading..." (FR: "La couleur arrive...")
  Scroll hint: "Scroll to explore" (FR: "Faites défiler")

==================================================
4. NAVBAR (components/Navbar.tsx)
==================================================
Layout, same logic as Klimt Wine:
- Fixed at top, full width, height 80px desktop / 64px mobile, horizontal padding 40px desktop / 20px mobile, transparent background (no border) over the hero.
- LEFT: three links (Products, Brand, Contact) as uppercase small text, smooth anchor scroll via Lenis (#products, #brand, #contact).
- CENTER: the PAINTIRO logo (use /public/logo.png, with a text fallback "PAINTIRO" in the heading font if the file is missing), absolutely centered, height about 28px.
- RIGHT: language switch "EN / FR" + a BUY button: uppercase small text, 1px ink border, padding 12px 22px, on hover the background fills red from bottom to top (GSAP or CSS transition 400ms), text turns white.
- Behavior: the navbar HIDES when scrolling down (slide up, 500ms ease power3.out) and SHOWS when scrolling up. At the very top it is always visible. After 80px scroll it gets a background of rgba(242,242,242,0.85) with backdrop-filter blur(12px).
- Link hover: a thin 1px red underline grows from left to right.
- Entrance animation on first load (after the loader): the logo fades in and moves down 12px to place, the links and buttons stagger in (opacity 0 to 1, y 12 to 0, 0.8s, stagger 0.08, ease power3.out).
- MOBILE (under 900px): logo on the left, BUY button + burger icon on the right. The burger opens a full-screen menu with RED background (#E8372C), white large serif links (48px, Cormorant Garamond), stacked, each link slides up with a stagger, a close button (two thin crossing lines) and the EN / FR switch at the bottom. Lock body scroll (lenis.stop()) while it is open, resume on close.
- Accessible: proper nav tag, aria-labels, focus-visible outlines in red, Escape closes the menu.

==================================================
5. LOADER (components/Loader.tsx)
==================================================
- Full-screen, background var(--bg), centered.
- Shows the loader line from content (serif, 28px), a big percentage counter (tabular numbers) and a 1px thin progress line in RED at the bottom of the screen growing with the real loading progress of the frames.
- Disappears with a smooth slide-up (clip-path or translateY -100%, 1s, ease power4.inOut) once at least 40% of frames are ready and the minimum display time of 1.2s has passed. Remaining frames keep loading in the background.
- On disappearance, trigger the hero text intro and navbar entrance animations.

==================================================
6. HERO + FRAME SEQUENCE (components/FrameSequence.tsx)
==================================================
STRUCTURE
- A section with height = SCROLL_LENGTH (default 700vh, constant in lib/config.ts) containing a sticky/pinned 100vh x 100vw container.
- Inside: one <canvas> filling the viewport, plus HTML overlays (hero text, product indicator, scroll hint, final CTA). The overlays are HTML, NEVER painted into the canvas.
- Section id="hero". Background var(--bg).

CANVAS RENDERING
- 2D context, size = viewport x devicePixelRatio (cap 2, cap 1.5 on screens under 768px).
- Draw with "cover" logic by default (scale = max(cw/iw, ch/ih), centered). Prop fit: "cover" | "contain". On mobile portrait use "contain" with the background color filling the rest so the product is never cropped.
- imageSmoothingEnabled = true, imageSmoothingQuality = "high".
- Redraw on resize (debounced 150ms), keep the current frame.
- Only call drawImage when the frame index changes (lastDrawnIndex).
- Render through gsap.ticker.

FRAMES AND PRELOADING
- Frames: /public/frames/frame_0001.webp ... (4-digit, extension may be webp, jpg or png).
- scripts/generate-manifest.mjs reads /public/frames, sorts naturally, writes /public/frames/manifest.json { count, pattern, width, height } (use sharp for size). npm scripts: "predev" and "prebuild" run it.
- scripts/optimize-frames.mjs (optional): converts png/jpg to WebP, width 1920, quality 82, renames to the 4-digit pattern.
- lib/useFrameLoader.ts: load manifest, draw frame 1 immediately, load the first 30 frames with priority, then the rest in parallel batches of 12. Use createImageBitmap when available. Keep images in a useRef (not state). Report progress to the Loader. If the current frame is not loaded yet, draw the nearest previous loaded frame. Never show a blank canvas.
- If frame count is above 400, keep a sliding window of about 120 decoded frames.

SCROLL BINDING
- const playhead = { frame: 0 }; gsap.to(playhead, { frame: count - 1, ease: "none", snap: "frame", scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 }, onUpdate }).
- Inside onUpdate use mapProgress(progress) from lib/chapters.ts to convert scroll progress to frame progress: the product-swap part (first 38% of frames) takes about 30% of the scroll distance, the pour part takes about 70%, so the pour feels slow and cinematic. Configurable.
- Works forward, backward, fast, slow, and when refreshing in the middle of the page (correct frame restored).
- Clean up on unmount (ScrollTrigger.kill, ticker.remove, lenis.destroy) so React Strict Mode never duplicates triggers.

HERO TEXT OVERLAY (Klimt Wine style)
- Centered at the top third of the viewport, over the first frames: the hero title in Cormorant Garamond (clamp(48px, 7vw, 120px)), color var(--ink), and the subtitle below in Inter 16px, muted, max-width 480px.
- Intro animation after the loader: each WORD of the title is wrapped in an overflow-hidden span and slides up from 110% to 0 (1s, stagger 0.08, ease power4.out). The subtitle fades in after.
- On scroll, between 0% and 6% of the total scroll, the title and subtitle fade out and move up 40px (scrubbed), so the product is clean and alone afterwards.
- Make sure the text never covers the product badly: on the first frame the product is centered, so place the text above it with enough top margin, and the text color must stay readable on the light background.

SCROLL HINT
- Bottom center: "Scroll to explore" in uppercase small Inter, with a thin 1px vertical line (40px tall) below it, with a looping animation where a red dot or the line fills from top to bottom (2s, repeat, ease power2.inOut). Fades out after 3% scroll.

PRODUCT INDICATOR (like the "01 Grüner Veltliner" list on klimtwine.com)
- Bottom-left (desktop) / bottom-center above the hint (mobile): a small indicator showing the current product: "01" in red, a thin line, and the product name in uppercase small text, plus "/ 06" in muted.
- It is driven by lib/chapters.ts, which has a list of products with frame progress ranges (editable):
  01 IROVELLA 0.00 - 0.05 → active until swap at 0.05
  02 PLAFONYA 0.05 - 0.117
  03 FIX-ONE 0.117 - 0.183
  04 IROCRYL 1L 0.183 - 0.25
  05 IROCRYL 4L 0.25 - 0.328
  06 IROFAÇADE 0.328 - 1.00
- When the active product changes, the name animates: the old text slides up and fades, the new one slides in from below (0.5s, power3.out). Also a row of 6 small ticks (1px lines) where the active tick is red and longer.
- Fades out when the pour phase starts (frame progress > 0.38) and the section chapter label changes to "POURING" is NOT needed, no extra text.

FINAL CTA
- At the end of the sequence (frame progress above 0.93), a small centered block fades in at the bottom: a red filled button "Explore products" (white text, uppercase, hover: becomes ink color) linking to #products. Fades out again when scrolling back up.

CONTROLS
- Props: scrollLength, scrub, fit.
- Respect prefers-reduced-motion: show a static frame (the last frame, with product and tray), normal scrolling, no scrub, no text animation.
- Debug mode ?debug=1 shows current frame number and FPS at top-left in a tiny monospace label. Only in debug mode.

==================================================
7. PAGE STRUCTURE
==================================================
app/[locale]/layout.tsx: html lang, fonts, body background var(--bg), margin 0, overflow-x hidden, Lenis provider (components/SmoothScroll.tsx), hide the scrollbar visually but keep scrolling.
app/[locale]/page.tsx, in this order:
1. <Loader />
2. <Navbar />
3. <FrameSequence /> (id="hero")
4. Empty placeholder sections for later, each min-height 100vh with the same background and a small invisible anchor: id="products", id="brand", id="contact". NO text inside them yet, because I will ask for them one by one.

==================================================
8. FILES TO CREATE
==================================================
package.json (next, react, react-dom, gsap, lenis, sharp, tailwindcss, typescript, postcss, autoprefixer)
app/page.tsx (redirect to /en), app/[locale]/layout.tsx, app/[locale]/page.tsx, app/globals.css
components/Navbar.tsx, components/MobileMenu.tsx, components/Loader.tsx, components/FrameSequence.tsx, components/HeroText.tsx, components/ProductIndicator.tsx, components/ScrollHint.tsx, components/SmoothScroll.tsx
lib/fonts.ts, lib/content.ts, lib/config.ts, lib/chapters.ts, lib/useFrameLoader.ts
scripts/generate-manifest.mjs, scripts/optimize-frames.mjs
public/logo.png (placeholder instruction: I will add my logo)
tailwind.config.ts (extend colors red, red-dark, bg, ink, muted and font families)
README.md: install, where to put the frames and the logo, run commands, how to change scroll length, scrub, colors, fonts, texts, product ranges, and how to deploy on Vercel.

==================================================
9. QUALITY RULES
==================================================
- Everything responsive: desktop, tablet, mobile (test at 1440, 1024, 768, 390 widths).
- No layout shift, no flicker between frames, no blank flashes, no jump when resizing or when the mobile browser bar hides (use 100svh / dvh).
- Smooth, slow, premium easing everywhere (power3.out, power4.inOut). Nothing bouncy, nothing fast.
- Clean typed code with comments. No placeholders, no TODO, no pseudo-code. Complete code for every file.

==================================================
10. ACCEPTANCE CHECKLIST
==================================================
1. npm run dev starts with no errors or TypeScript warnings.
2. Frames are detected automatically whatever the count.
3. First frame shows instantly, the loader slides away smoothly, then navbar and hero title animate in.
4. Navbar hides on scroll down, shows on scroll up, mobile red full-screen menu works.
5. Scrolling down plays the animation forward, scrolling up plays it backward, smooth, no stutter, and the pour phase feels slower.
6. Product indicator follows the six products correctly, final CTA appears at the end.
7. /en and /fr both work and the language switch keeps the scroll position at the top.
8. Refresh in the middle shows the right frame. No duplicate ScrollTriggers in React Strict Mode.
9. Looks and feels like klimtwine.com/en but in PAINTIRO red and white.

Now generate every file completely.