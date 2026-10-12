/**
 * Color inspiration data for the "Colors" section.
 * `code` is the reference shown to customers; replace it with your real color codes.
 */

export type ColorFamilyKey = "whites" | "beiges" | "greys" | "blues" | "greens" | "reds";

export type Swatch = {
  code: string;
  hex: string;
  name: { en: string; fr: string };
  family: ColorFamilyKey;
  popular?: boolean;
};

export const COLOR_FAMILIES: { key: ColorFamilyKey; hex: string }[] = [
  { key: "whites", hex: "#F4F2EE" },
  { key: "beiges", hex: "#D9C7AE" },
  { key: "greys", hex: "#A7A7A4" },
  { key: "blues", hex: "#7F96AE" },
  { key: "greens", hex: "#7E8F7A" },
  { key: "reds", hex: "#B5513F" },
];

export const SWATCHES: Swatch[] = [
  { code: "PT-101", hex: "#F7F5F0", name: { en: "Pure Linen", fr: "Lin pur" }, family: "whites", popular: true },
  { code: "PT-102", hex: "#EFEAE0", name: { en: "Soft Cotton", fr: "Coton doux" }, family: "whites" },
  { code: "PT-103", hex: "#E9E6DF", name: { en: "Morning Mist", fr: "Brume du matin" }, family: "whites" },
  { code: "PT-104", hex: "#F2EEE3", name: { en: "Ivory Veil", fr: "Voile ivoire" }, family: "whites" },
  { code: "PT-201", hex: "#DCCBB2", name: { en: "Desert Sand", fr: "Sable du désert" }, family: "beiges", popular: true },
  { code: "PT-202", hex: "#C9B08F", name: { en: "Warm Clay", fr: "Argile chaude" }, family: "beiges", popular: true },
  { code: "PT-203", hex: "#E6D8C3", name: { en: "Oat Milk", fr: "Lait d’avoine" }, family: "beiges" },
  { code: "PT-204", hex: "#B89B78", name: { en: "Caramel Stone", fr: "Pierre caramel" }, family: "beiges" },
  { code: "PT-301", hex: "#BDBDBA", name: { en: "Silver Haze", fr: "Brume argent" }, family: "greys", popular: true },
  { code: "PT-302", hex: "#8E8E8B", name: { en: "Urban Stone", fr: "Pierre urbaine" }, family: "greys", popular: true },
  { code: "PT-303", hex: "#5E605F", name: { en: "Graphite", fr: "Graphite" }, family: "greys" },
  { code: "PT-304", hex: "#D6D5D1", name: { en: "Pebble", fr: "Galet" }, family: "greys" },
  { code: "PT-401", hex: "#8BA0B4", name: { en: "Coastal Blue", fr: "Bleu côtier" }, family: "blues", popular: true },
  { code: "PT-402", hex: "#2F3E52", name: { en: "Midnight Navy", fr: "Marine minuit" }, family: "blues", popular: true },
  { code: "PT-403", hex: "#B9C8D4", name: { en: "Sky Whisper", fr: "Souffle de ciel" }, family: "blues" },
  { code: "PT-404", hex: "#5C7891", name: { en: "Harbor", fr: "Port" }, family: "blues" },
  { code: "PT-501", hex: "#33463D", name: { en: "Forest Deep", fr: "Forêt profonde" }, family: "greens", popular: true },
  { code: "PT-502", hex: "#9DAA94", name: { en: "Sage Leaf", fr: "Feuille de sauge" }, family: "greens" },
  { code: "PT-503", hex: "#C5CDBA", name: { en: "Mint Cream", fr: "Crème menthe" }, family: "greens" },
  { code: "PT-504", hex: "#66755F", name: { en: "Olive Grove", fr: "Oliveraie" }, family: "greens" },
  { code: "PT-601", hex: "#E8372C", name: { en: "PAINTIRO Red", fr: "Rouge PAINTIRO" }, family: "reds" },
  { code: "PT-602", hex: "#A8483A", name: { en: "Terracotta", fr: "Terre cuite" }, family: "reds" },
  { code: "PT-603", hex: "#7A3B31", name: { en: "Brick House", fr: "Brique" }, family: "reds" },
  { code: "PT-604", hex: "#D89A86", name: { en: "Clay Blush", fr: "Argile rosée" }, family: "reds" },
];
