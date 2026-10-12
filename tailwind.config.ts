import type { Config } from "tailwindcss";

/**
 * Tailwind v4 reads this file through `@config` in app/globals.css.
 * Colors and fonts point to the CSS variables, so the real values live in globals.css.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: "var(--red)", dark: "var(--red-dark)" },
        "red-dark": "var(--red-dark)",
        white: "var(--white)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        "power3-out": "cubic-bezier(0.215, 0.61, 0.355, 1)",
        "power4-inout": "cubic-bezier(0.77, 0, 0.175, 1)",
      },
    },
  },
};

export default config;
