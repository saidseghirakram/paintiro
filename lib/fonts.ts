/**
 * Font setup. Swap the families here; the CSS variables stay the same
 * (--font-heading and --font-body) so nothing else has to change.
 */
import { Cormorant_Garamond, Inter } from "next/font/google";

export const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
  display: "swap",
});

export const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

/** Class names to put on <html> so both CSS variables are available everywhere. */
export const fontVariables = `${headingFont.variable} ${bodyFont.variable}`;
