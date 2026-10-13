/**
 * Product catalogue per solution (dummy data for now).
 * Pages and the /api/solutions route only talk to the async functions at the bottom,
 * so swapping this file for a real backend later means rewriting those functions only.
 */
import type { IconName } from "@/components/ui/Icon";
import type { Locale } from "./content";
import type { BadgeKey } from "./products";

export const CATEGORY_SLUGS = [
  "interior",
  "exterior",
  "ceilings",
  "renovation",
  "preparation",
  "professionals",
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

type L = Record<Locale, string>;
type Finish = "matte" | "satin" | "velvet" | "transparent";
type Kind = "interior" | "ceiling" | "fixer" | "primer" | "facade";

type CatalogEntry = {
  id: string;
  name: string;
  /** Transparent WebP in /public/products. */
  image: string;
  width: number;
  height: number;
  /** Tint behind the product in cards and on the detail hero. */
  accent: string;
  categories: CategorySlug[];
  kind: Kind;
  finish: Finish;
  badge?: BadgeKey;
  sizes: string[];
  tag: L;
  tagline: L;
  description: L;
  about: L[];
  highlights: { icon: IconName; label: L }[];
  /** Key figures shown as big counters. */
  figures: { coverage: number; touchDry: number; recoat: number; coats: number };
  specs: {
    binder: L;
    density: string;
    dryExtract: string;
    voc: string;
    coverage: string;
    dilution: L;
    temperature: string;
    fullCure: L;
    resistance: L;
    shelfLife: L;
  };
  /** Swatch codes from lib/colors.ts (empty for transparent products). */
  colors: string[];
  gallery: string[];
};

const IMG = {
  irovella: { image: "/products/irovella.webp", width: 1019, height: 1000 },
  plafonya: { image: "/products/plafonya.webp", width: 1023, height: 1000 },
  fixOne: { image: "/products/fix-one.webp", width: 1023, height: 1000 },
  irocryl1: { image: "/products/irocryl-1l.webp", width: 381, height: 1000 },
  irocryl4: { image: "/products/irocryl-4l.webp", width: 909, height: 1000 },
  irofacade: { image: "/products/irofacade.webp", width: 1020, height: 1000 },
};

const TWO_YEARS = { en: "24 months in the closed original pack", fr: "24 mois en emballage d’origine fermé" };
const TEN_DAYS = { en: "7 to 10 days", fr: "7 à 10 jours" };

const CATALOG: CatalogEntry[] = [
  {
    id: "irovella",
    name: "IROVELLA",
    ...IMG.irovella,
    accent: "#E9E1D6",
    categories: ["interior", "professionals"],
    kind: "interior",
    finish: "satin",
    badge: "bestSeller",
    sizes: ["4 kg", "18 kg"],
    tag: { en: "Satin acrylic paint", fr: "Peinture acrylique satinée" },
    tagline: { en: "The satin that lives with you.", fr: "Le satiné qui vit avec vous." },
    description: {
      en: "A satin acrylic finish for interior walls: smooth, washable and deep in color.",
      fr: "Une finition acrylique satinée pour les murs intérieurs : lisse, lessivable et intense.",
    },
    about: [
      {
        en: "IROVELLA was formulated for rooms that are truly lived in. Its soft satin sheen catches the light without ever looking plastic, and its tight film resists fingerprints, steam and daily scrubbing.",
        fr: "IROVELLA a été formulée pour les pièces vraiment vécues. Son satiné doux accroche la lumière sans jamais faire plastique, et son film serré résiste aux traces de doigts, à la vapeur et aux lavages quotidiens.",
      },
      {
        en: "Made in our Algerian factory from selected acrylic resins and pure titanium dioxide, it spreads easily, levels on its own and covers in two coats, even on dark colors.",
        fr: "Fabriquée dans notre usine algérienne à partir de résines acryliques sélectionnées et de dioxyde de titane pur, elle s’étale facilement, se tend toute seule et couvre en deux couches, même sur les teintes foncées.",
      },
    ],
    highlights: [
      { icon: "washable", label: { en: "Washable, class 1", fr: "Lessivable, classe 1" } },
      { icon: "lowOdor", label: { en: "Low odor", fr: "Faible odeur" } },
      { icon: "coverage", label: { en: "Two-coat coverage", fr: "Couvre en deux couches" } },
      { icon: "sun", label: { en: "Soft satin sheen", fr: "Satiné doux" } },
    ],
    figures: { coverage: 12, touchDry: 30, recoat: 4, coats: 2 },
    specs: {
      binder: { en: "Acrylic copolymer in dispersion", fr: "Copolymère acrylique en dispersion" },
      density: "1.32 ± 0.05 kg/L",
      dryExtract: "58 % ± 2",
      voc: "< 30 g/L",
      coverage: "10 – 12 m²/kg",
      dilution: { en: "5 – 10 % water", fr: "5 – 10 % d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: TEN_DAYS,
      resistance: { en: "Wet scrub class 1 (ISO 11998)", fr: "Abrasion humide classe 1 (ISO 11998)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-101", "PT-201", "PT-202", "PT-301", "PT-401", "PT-502", "PT-602"],
    gallery: ["/solutions/interior.webp", "/rooms/living.webp", "/rooms/bedroom.webp", "/rooms/dining.webp"],
  },
  {
    id: "irovella-mat",
    name: "IROVELLA MAT",
    ...IMG.irovella,
    accent: "#DCD6CC",
    categories: ["interior", "ceilings", "renovation"],
    kind: "interior",
    finish: "matte",
    badge: "recommended",
    sizes: ["4 kg", "18 kg"],
    tag: { en: "Deep matt acrylic paint", fr: "Peinture acrylique mate profonde" },
    tagline: { en: "Matt that hides everything.", fr: "Le mat qui cache tout." },
    description: {
      en: "A velvety deep matt that erases small wall defects and gives colors a mineral depth.",
      fr: "Un mat velouté qui efface les petits défauts du mur et donne aux couleurs une profondeur minérale.",
    },
    about: [
      {
        en: "Matt is the most forgiving finish there is: no reflection, no visible roller marks, no shine on uneven plaster. IROVELLA MAT takes that idea further with a dense, chalky film that makes every color look calm.",
        fr: "Le mat est la finition la plus indulgente qui soit : aucun reflet, aucune trace de rouleau, aucune brillance sur un enduit irrégulier. IROVELLA MAT va plus loin avec un film dense et poudré qui rend chaque couleur apaisante.",
      },
      {
        en: "It is the go-to choice for renovation work, bedrooms and ceilings, wherever a quiet, gallery-like wall is wanted.",
        fr: "C’est le choix de référence pour la rénovation, les chambres et les plafonds, partout où l’on veut un mur calme, digne d’une galerie.",
      },
    ],
    highlights: [
      { icon: "layers", label: { en: "Hides defects", fr: "Masque les défauts" } },
      { icon: "coverage", label: { en: "High opacity", fr: "Haute opacité" } },
      { icon: "lowOdor", label: { en: "Low odor", fr: "Faible odeur" } },
      { icon: "eco", label: { en: "Water-based", fr: "À base d’eau" } },
    ],
    figures: { coverage: 11, touchDry: 30, recoat: 4, coats: 2 },
    specs: {
      binder: { en: "Vinyl-acrylic copolymer", fr: "Copolymère vinyl-acrylique" },
      density: "1.48 ± 0.05 kg/L",
      dryExtract: "63 % ± 2",
      voc: "< 25 g/L",
      coverage: "9 – 11 m²/kg",
      dilution: { en: "5 – 10 % water", fr: "5 – 10 % d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: TEN_DAYS,
      resistance: { en: "Wet scrub class 2 (ISO 11998)", fr: "Abrasion humide classe 2 (ISO 11998)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-102", "PT-103", "PT-203", "PT-304", "PT-403", "PT-503", "PT-604"],
    gallery: ["/rooms/bedroom.webp", "/solutions/renovation.webp", "/rooms/living.webp"],
  },
  {
    id: "irovella-velours",
    name: "IROVELLA VELOURS",
    ...IMG.irovella,
    accent: "#D7DCD9",
    categories: ["interior"],
    kind: "interior",
    finish: "velvet",
    badge: "new",
    sizes: ["4 kg", "18 kg"],
    tag: { en: "Velvet washable paint", fr: "Peinture velours lessivable" },
    tagline: { en: "The touch of velvet, the strength of satin.", fr: "Le toucher du velours, la force du satiné." },
    description: {
      en: "Between matt and satin: a soft velvet look that still cleans with a sponge.",
      fr: "Entre mat et satiné : un aspect velours tout doux qui se nettoie pourtant à l’éponge.",
    },
    about: [
      {
        en: "Hallways, kids’ rooms, staircases: the walls that get touched the most deserve a finish that is both beautiful and tough. IROVELLA VELOURS keeps the elegance of a matt wall while accepting water, soap and sponges.",
        fr: "Couloirs, chambres d’enfants, cages d’escalier : les murs les plus touchés méritent une finition à la fois belle et résistante. IROVELLA VELOURS garde l’élégance d’un mur mat tout en acceptant l’eau, le savon et l’éponge.",
      },
      {
        en: "Its ceramic microspheres reinforce the film and give it that unmistakable silky feel under the hand.",
        fr: "Ses microsphères céramiques renforcent le film et lui donnent ce toucher soyeux reconnaissable sous la main.",
      },
    ],
    highlights: [
      { icon: "washable", label: { en: "Sponge washable", fr: "Lavable à l’éponge" } },
      { icon: "quality", label: { en: "Ceramic reinforced", fr: "Renforcée céramique" } },
      { icon: "sun", label: { en: "Velvet finish", fr: "Finition velours" } },
      { icon: "lowOdor", label: { en: "Low odor", fr: "Faible odeur" } },
    ],
    figures: { coverage: 12, touchDry: 45, recoat: 6, coats: 2 },
    specs: {
      binder: { en: "Pure acrylic + ceramic microspheres", fr: "Acrylique pure + microsphères céramiques" },
      density: "1.38 ± 0.05 kg/L",
      dryExtract: "60 % ± 2",
      voc: "< 30 g/L",
      coverage: "10 – 12 m²/kg",
      dilution: { en: "5 % water max.", fr: "5 % d’eau max." },
      temperature: "+8 °C → +35 °C",
      fullCure: TEN_DAYS,
      resistance: { en: "Wet scrub class 1 (ISO 11998)", fr: "Abrasion humide classe 1 (ISO 11998)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-104", "PT-201", "PT-302", "PT-402", "PT-501", "PT-504", "PT-603"],
    gallery: ["/rooms/dining.webp", "/solutions/interior.webp", "/rooms/bedroom.webp"],
  },
  {
    id: "plafonya",
    name: "PLAFONYA",
    ...IMG.plafonya,
    accent: "#ECEBE7",
    categories: ["ceilings", "interior", "professionals"],
    kind: "ceiling",
    finish: "matte",
    badge: "recommended",
    sizes: ["18 kg"],
    tag: { en: "Ceiling paint", fr: "Peinture spéciale plafond" },
    tagline: { en: "White, from wall to wall.", fr: "Le blanc, d’un mur à l’autre." },
    description: {
      en: "Made for ceilings: high coverage that goes on easily and never drips.",
      fr: "Pensée pour les plafonds : haute couverture, facile à appliquer et sans coulures.",
    },
    about: [
      {
        en: "Painting above your head is hard work. PLAFONYA was made to make it easier: a thixotropic texture that stays on the roller, no drips on your face, and a long open time that erases overlap marks.",
        fr: "Peindre au-dessus de sa tête est un vrai effort. PLAFONYA a été conçue pour le faciliter : une texture thixotrope qui reste sur le rouleau, aucune goutte sur le visage et un long temps ouvert qui efface les reprises.",
      },
      {
        en: "Its deep matt white bounces natural light back into the room, so every space feels taller and brighter.",
        fr: "Son blanc mat profond renvoie la lumière naturelle dans la pièce : chaque espace paraît plus haut et plus lumineux.",
      },
    ],
    highlights: [
      { icon: "drop", label: { en: "No drips", fr: "Ne goutte pas" } },
      { icon: "coverage", label: { en: "High coverage", fr: "Haute couverture" } },
      { icon: "layers", label: { en: "No overlap marks", fr: "Sans reprises" } },
      { icon: "sun", label: { en: "Light-reflecting white", fr: "Blanc lumineux" } },
    ],
    figures: { coverage: 10, touchDry: 40, recoat: 6, coats: 2 },
    specs: {
      binder: { en: "Vinyl copolymer in dispersion", fr: "Copolymère vinylique en dispersion" },
      density: "1.55 ± 0.05 kg/L",
      dryExtract: "65 % ± 2",
      voc: "< 20 g/L",
      coverage: "8 – 10 m²/kg",
      dilution: { en: "5 – 15 % water", fr: "5 – 15 % d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: { en: "7 days", fr: "7 jours" },
      resistance: { en: "Wet scrub class 3 (ISO 11998)", fr: "Abrasion humide classe 3 (ISO 11998)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-101", "PT-103"],
    gallery: ["/solutions/ceiling.webp", "/rooms/living.webp", "/rooms/dining.webp"],
  },
  {
    id: "plafonya-plus",
    name: "PLAFONYA PLUS",
    ...IMG.plafonya,
    accent: "#DFE5E8",
    categories: ["ceilings"],
    kind: "ceiling",
    finish: "matte",
    badge: "new",
    sizes: ["4 kg", "18 kg"],
    tag: { en: "Anti-condensation ceiling paint", fr: "Peinture plafond anti-condensation" },
    tagline: { en: "For kitchens and bathrooms that breathe.", fr: "Pour les cuisines et salles de bain qui respirent." },
    description: {
      en: "A breathable ceiling white with an anti-mould film, made for humid rooms.",
      fr: "Un blanc plafond respirant au film anti-moisissure, conçu pour les pièces humides.",
    },
    about: [
      {
        en: "Steam from showers and cooking ends up on the ceiling first. PLAFONYA PLUS uses a micro-porous film that lets moisture escape instead of trapping it, and a protective agent that keeps black spots away.",
        fr: "La vapeur de la douche et de la cuisine finit d’abord au plafond. PLAFONYA PLUS utilise un film microporeux qui laisse s’échapper l’humidité au lieu de la piéger, et un agent protecteur qui éloigne les taches noires.",
      },
      {
        en: "Same easy application as PLAFONYA, same bright matt white, with years of extra peace of mind.",
        fr: "Même application facile que PLAFONYA, même blanc mat lumineux, avec des années de tranquillité en plus.",
      },
    ],
    highlights: [
      { icon: "lowOdor", label: { en: "Anti-mould film", fr: "Film anti-moisissure" } },
      { icon: "drop", label: { en: "Breathable", fr: "Respirante" } },
      { icon: "layers", label: { en: "No overlap marks", fr: "Sans reprises" } },
      { icon: "eco", label: { en: "Water-based", fr: "À base d’eau" } },
    ],
    figures: { coverage: 10, touchDry: 45, recoat: 6, coats: 2 },
    specs: {
      binder: { en: "Styrene-acrylic copolymer", fr: "Copolymère styrène-acrylique" },
      density: "1.50 ± 0.05 kg/L",
      dryExtract: "62 % ± 2",
      voc: "< 25 g/L",
      coverage: "8 – 10 m²/kg",
      dilution: { en: "5 – 10 % water", fr: "5 – 10 % d’eau" },
      temperature: "+8 °C → +30 °C",
      fullCure: { en: "7 days", fr: "7 jours" },
      resistance: { en: "Mould resistance, class 0 (ISO 846)", fr: "Résistance aux moisissures, classe 0 (ISO 846)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-101"],
    gallery: ["/solutions/ceiling.webp", "/rooms/dining.webp"],
  },
  {
    id: "fix-one",
    name: "FIX-ONE",
    ...IMG.fixOne,
    accent: "#F1D9D3",
    categories: ["renovation", "preparation", "professionals"],
    kind: "primer",
    finish: "matte",
    badge: "bestSeller",
    sizes: ["18 kg"],
    tag: { en: "Water-based acrylic fixer", fr: "Fixateur acrylique à base d’eau" },
    tagline: { en: "98 % opacity. Zero surprises.", fr: "98 % d’opacité. Zéro surprise." },
    description: {
      en: "A water-based fixer with 98% opacity that prepares every wall for a perfect finish.",
      fr: "Un fixateur à base d’eau, 98 % d’opacité, qui prépare chaque mur à une finition parfaite.",
    },
    about: [
      {
        en: "Every great finish starts underneath. FIX-ONE locks powdery plaster, unifies patched areas and hides old colors in a single coat, so the finishing paint only has to do its job: be beautiful.",
        fr: "Toute belle finition commence en dessous. FIX-ONE fixe les enduits farineux, unifie les zones rebouchées et masque les anciennes couleurs en une seule couche : la peinture de finition n’a plus qu’à être belle.",
      },
      {
        en: "Professionals use it to save one finishing coat on every job site. Homeowners use it because it simply makes walls look new again.",
        fr: "Les professionnels l’utilisent pour économiser une couche de finition sur chaque chantier. Les particuliers, parce qu’elle rend tout simplement les murs neufs à nouveau.",
      },
    ],
    highlights: [
      { icon: "coverage", label: { en: "98 % opacity", fr: "98 % d’opacité" } },
      { icon: "adhesion", label: { en: "Locks the surface", fr: "Fixe le support" } },
      { icon: "layers", label: { en: "Unifies patches", fr: "Unifie les reprises" } },
      { icon: "performance", label: { en: "Saves one coat", fr: "Économise une couche" } },
    ],
    figures: { coverage: 9, touchDry: 30, recoat: 3, coats: 1 },
    specs: {
      binder: { en: "Acrylic resin in dispersion", fr: "Résine acrylique en dispersion" },
      density: "1.60 ± 0.05 kg/L",
      dryExtract: "66 % ± 2",
      voc: "< 20 g/L",
      coverage: "7 – 9 m²/kg",
      dilution: { en: "10 – 20 % water", fr: "10 – 20 % d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: { en: "48 hours", fr: "48 heures" },
      resistance: { en: "Opacity 98 % (ISO 6504-3)", fr: "Opacité 98 % (ISO 6504-3)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-101"],
    gallery: ["/solutions/renovation.webp", "/solutions/preparation.webp", "/rooms/living.webp"],
  },
  {
    id: "fix-one-pro",
    name: "FIX-ONE PRO",
    ...IMG.fixOne,
    accent: "#E6D3C2",
    categories: ["preparation", "professionals"],
    kind: "primer",
    finish: "matte",
    sizes: ["25 kg"],
    tag: { en: "Job-site acrylic fixer", fr: "Fixateur acrylique chantier" },
    tagline: { en: "The big format for big walls.", fr: "Le grand format pour les grands murs." },
    description: {
      en: "FIX-ONE’s formula in a 25 kg job-site pail, tuned for airless spraying.",
      fr: "La formule FIX-ONE en seau chantier de 25 kg, ajustée pour la pulvérisation airless.",
    },
    about: [
      {
        en: "On large projects, time is everything. FIX-ONE PRO keeps the opacity and grip of FIX-ONE, with a rheology tuned for airless machines and a pail sized for a full day of work.",
        fr: "Sur les grands chantiers, le temps est tout. FIX-ONE PRO garde l’opacité et l’accroche de FIX-ONE, avec une rhéologie ajustée pour les machines airless et un seau dimensionné pour une journée complète.",
      },
      {
        en: "Consistent from one batch to the next, so two pails opened weeks apart give exactly the same result.",
        fr: "Constant d’un lot à l’autre : deux seaux ouverts à des semaines d’écart donnent exactement le même résultat.",
      },
    ],
    highlights: [
      { icon: "pro", label: { en: "Airless ready", fr: "Prêt pour l’airless" } },
      { icon: "coverage", label: { en: "98 % opacity", fr: "98 % d’opacité" } },
      { icon: "quality", label: { en: "Batch consistency", fr: "Constance des lots" } },
      { icon: "adhesion", label: { en: "Strong grip", fr: "Forte accroche" } },
    ],
    figures: { coverage: 9, touchDry: 30, recoat: 3, coats: 1 },
    specs: {
      binder: { en: "Acrylic resin in dispersion", fr: "Résine acrylique en dispersion" },
      density: "1.60 ± 0.05 kg/L",
      dryExtract: "66 % ± 2",
      voc: "< 20 g/L",
      coverage: "7 – 9 m²/kg",
      dilution: { en: "Airless: 5 – 10 % water", fr: "Airless : 5 – 10 % d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: { en: "48 hours", fr: "48 heures" },
      resistance: { en: "Opacity 98 % (ISO 6504-3)", fr: "Opacité 98 % (ISO 6504-3)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-101"],
    gallery: ["/solutions/professionals.webp", "/solutions/preparation.webp"],
  },
  {
    id: "irocryl-1l",
    name: "IROCRYL 1L",
    ...IMG.irocryl1,
    accent: "#E3E7EA",
    categories: ["preparation", "renovation"],
    kind: "fixer",
    finish: "transparent",
    badge: "new",
    sizes: ["1 L"],
    tag: { en: "Transparent liquid fixer", fr: "Fixateur liquide transparent" },
    tagline: { en: "Small bottle, deep grip.", fr: "Petit flacon, accroche profonde." },
    description: {
      en: "Penetrates deep into the surface to lock it, protect it and help paint hold.",
      fr: "Pénètre en profondeur pour fixer le support, le protéger et faire tenir la peinture.",
    },
    about: [
      {
        en: "Invisible once dry, IROCRYL soaks into porous plaster, old lime washes and chalky surfaces, binding the loose particles together before they can ruin your paint job.",
        fr: "Invisible une fois sec, IROCRYL pénètre dans les plâtres poreux, les anciens badigeons et les surfaces farineuses, et lie les particules instables avant qu’elles ne gâchent votre peinture.",
      },
      {
        en: "The 1 L format is made for one room or for touch-ups: just dilute, brush on and paint the next day.",
        fr: "Le format 1 L est pensé pour une pièce ou pour les retouches : il suffit de diluer, d’appliquer à la brosse et de peindre le lendemain.",
      },
    ],
    highlights: [
      { icon: "drop", label: { en: "Deep penetration", fr: "Pénétration profonde" } },
      { icon: "adhesion", label: { en: "Maximum adhesion", fr: "Adhérence maximale" } },
      { icon: "lowOdor", label: { en: "Reinforced protection", fr: "Protection renforcée" } },
      { icon: "eco", label: { en: "Water-based", fr: "À base d’eau" } },
    ],
    figures: { coverage: 15, touchDry: 60, recoat: 12, coats: 1 },
    specs: {
      binder: { en: "Fine-particle acrylic resin", fr: "Résine acrylique à particules fines" },
      density: "1.02 ± 0.02 kg/L",
      dryExtract: "18 % ± 1",
      voc: "< 10 g/L",
      coverage: "10 – 15 m²/L",
      dilution: { en: "1 part fixer, 3 – 5 parts water", fr: "1 volume de fixateur, 3 à 5 volumes d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: { en: "12 hours", fr: "12 heures" },
      resistance: { en: "Penetration up to 3 mm", fr: "Pénétration jusqu’à 3 mm" },
      shelfLife: TWO_YEARS,
    },
    colors: [],
    gallery: ["/solutions/preparation.webp", "/solutions/renovation.webp"],
  },
  {
    id: "irocryl-4l",
    name: "IROCRYL 4L",
    ...IMG.irocryl4,
    accent: "#DCE3E6",
    categories: ["preparation", "professionals"],
    kind: "fixer",
    finish: "transparent",
    badge: "recommended",
    sizes: ["4 L"],
    tag: { en: "Transparent liquid fixer", fr: "Fixateur liquide transparent" },
    tagline: { en: "Up to 300 m² of solid ground.", fr: "Jusqu’à 300 m² de support solide." },
    description: {
      en: "IROCRYL concentrate in 4 L: one can prepares a whole apartment.",
      fr: "Le concentré IROCRYL en 4 L : un bidon prépare tout un appartement.",
    },
    about: [
      {
        en: "Once diluted, a single 4 L can of IROCRYL treats up to 300 m² of porous or powdery walls. It is the most economical way to secure a surface before any PAINTIRO finish.",
        fr: "Une fois dilué, un seul bidon de 4 L d’IROCRYL traite jusqu’à 300 m² de murs poreux ou farineux. C’est la façon la plus économique de sécuriser un support avant toute finition PAINTIRO.",
      },
      {
        en: "It also regulates absorption, so the finishing coat dries evenly and keeps a uniform sheen.",
        fr: "Il régule aussi l’absorption : la couche de finition sèche de façon homogène et garde un aspect uniforme.",
      },
    ],
    highlights: [
      { icon: "drop", label: { en: "Concentrated", fr: "Concentré" } },
      { icon: "adhesion", label: { en: "Maximum adhesion", fr: "Adhérence maximale" } },
      { icon: "layers", label: { en: "Even absorption", fr: "Absorption régulée" } },
      { icon: "eco", label: { en: "Water-based", fr: "À base d’eau" } },
    ],
    figures: { coverage: 15, touchDry: 60, recoat: 12, coats: 1 },
    specs: {
      binder: { en: "Fine-particle acrylic resin", fr: "Résine acrylique à particules fines" },
      density: "1.02 ± 0.02 kg/L",
      dryExtract: "18 % ± 1",
      voc: "< 10 g/L",
      coverage: "10 – 15 m²/L",
      dilution: { en: "1 part fixer, 3 – 5 parts water", fr: "1 volume de fixateur, 3 à 5 volumes d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: { en: "12 hours", fr: "12 heures" },
      resistance: { en: "Penetration up to 3 mm", fr: "Pénétration jusqu’à 3 mm" },
      shelfLife: TWO_YEARS,
    },
    colors: [],
    gallery: ["/solutions/preparation.webp", "/solutions/professionals.webp"],
  },
  {
    id: "irofacade",
    name: "IROFAÇADE",
    ...IMG.irofacade,
    accent: "#E5DDD0",
    categories: ["exterior", "professionals"],
    kind: "facade",
    finish: "matte",
    badge: "bestSeller",
    sizes: ["20 kg"],
    tag: { en: "High-quality façade paint", fr: "Peinture spéciale façade" },
    tagline: { en: "Built for the Algerian sun.", fr: "Faite pour le soleil algérien." },
    description: {
      en: "Built for exterior walls: weather resistant, long-lasting color, quick drying.",
      fr: "Conçue pour l’extérieur : résiste aux intempéries, couleur durable, séchage rapide.",
    },
    about: [
      {
        en: "From coastal humidity to Saharan heat, façades in Algeria go through it all. IROFAÇADE combines UV-stable pigments with a pure acrylic binder that stays flexible, so the color holds and the film does not crack.",
        fr: "De l’humidité côtière à la chaleur saharienne, les façades en Algérie vivent tout. IROFAÇADE associe des pigments stables aux UV à un liant acrylique pur qui reste souple : la couleur tient et le film ne craquelle pas.",
      },
      {
        en: "It is rain-proof one hour after application and repels dirt, keeping buildings clean season after season.",
        fr: "Elle résiste à la pluie une heure après application et repousse les salissures, gardant les bâtiments propres saison après saison.",
      },
    ],
    highlights: [
      { icon: "sun", label: { en: "UV resistant", fr: "Résiste aux UV" } },
      { icon: "drop", label: { en: "Rain-proof in 1 h", fr: "Hors pluie en 1 h" } },
      { icon: "longLasting", label: { en: "Long-lasting color", fr: "Couleur longue durée" } },
      { icon: "exterior", label: { en: "Dirt repellent", fr: "Anti-salissures" } },
    ],
    figures: { coverage: 8, touchDry: 30, recoat: 4, coats: 2 },
    specs: {
      binder: { en: "Pure acrylic resin", fr: "Résine acrylique pure" },
      density: "1.50 ± 0.05 kg/L",
      dryExtract: "64 % ± 2",
      voc: "< 40 g/L",
      coverage: "6 – 8 m²/kg",
      dilution: { en: "5 – 10 % water", fr: "5 – 10 % d’eau" },
      temperature: "+5 °C → +35 °C",
      fullCure: { en: "14 days", fr: "14 jours" },
      resistance: { en: "UV class A, W3 permeability (EN 1062)", fr: "UV classe A, perméabilité W3 (EN 1062)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-101", "PT-201", "PT-202", "PT-204", "PT-301", "PT-602", "PT-603"],
    gallery: ["/solutions/exterior.webp", "/solutions/professionals.webp", "/solutions/renovation.webp"],
  },
  {
    id: "irofacade-elastic",
    name: "IROFAÇADE ELASTIC",
    ...IMG.irofacade,
    accent: "#DAD2C6",
    categories: ["exterior", "renovation"],
    kind: "facade",
    finish: "satin",
    badge: "new",
    sizes: ["20 kg"],
    tag: { en: "Crack-bridging façade coating", fr: "Revêtement façade anti-fissures" },
    tagline: { en: "It stretches. Your walls stay sealed.", fr: "Il s’étire. Vos murs restent étanches." },
    description: {
      en: "An elastomeric film that bridges micro-cracks up to 1 mm and keeps rain out.",
      fr: "Un film élastomère qui ponte les microfissures jusqu’à 1 mm et empêche la pluie d’entrer.",
    },
    about: [
      {
        en: "Concrete moves with heat and cold, and every movement opens small cracks where water gets in. IROFAÇADE ELASTIC stretches with the wall instead of breaking, sealing the façade for years.",
        fr: "Le béton bouge avec le chaud et le froid, et chaque mouvement ouvre de petites fissures par où l’eau s’infiltre. IROFAÇADE ELASTIC s’étire avec le mur au lieu de casser, et scelle la façade pendant des années.",
      },
      {
        en: "Ideal for renovating old buildings before cracks become real damage.",
        fr: "Idéal pour rénover les bâtiments anciens avant que les fissures ne deviennent de vrais dégâts.",
      },
    ],
    highlights: [
      { icon: "layers", label: { en: "Bridges 1 mm cracks", fr: "Ponte les fissures de 1 mm" } },
      { icon: "drop", label: { en: "Waterproof", fr: "Imperméable" } },
      { icon: "sun", label: { en: "UV resistant", fr: "Résiste aux UV" } },
      { icon: "longLasting", label: { en: "10-year protection", fr: "Protection 10 ans" } },
    ],
    figures: { coverage: 5, touchDry: 60, recoat: 12, coats: 2 },
    specs: {
      binder: { en: "Elastomeric acrylic resin", fr: "Résine acrylique élastomère" },
      density: "1.35 ± 0.05 kg/L",
      dryExtract: "65 % ± 2",
      voc: "< 40 g/L",
      coverage: "4 – 5 m²/kg",
      dilution: { en: "Ready to use", fr: "Prêt à l’emploi" },
      temperature: "+8 °C → +30 °C",
      fullCure: { en: "14 days", fr: "14 jours" },
      resistance: { en: "Elongation > 200 %, class A3 (EN 1062-7)", fr: "Allongement > 200 %, classe A3 (EN 1062-7)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-101", "PT-203", "PT-304", "PT-302", "PT-602"],
    gallery: ["/solutions/exterior.webp", "/solutions/renovation.webp"],
  },
  {
    id: "irofacade-siloxane",
    name: "IROFAÇADE SILOXANE",
    ...IMG.irofacade,
    accent: "#D3D9D2",
    categories: ["exterior"],
    kind: "facade",
    finish: "matte",
    sizes: ["20 kg"],
    tag: { en: "Water-repellent siloxane paint", fr: "Peinture siloxane hydrofuge" },
    tagline: { en: "Rain slides. Walls breathe.", fr: "La pluie glisse. Le mur respire." },
    description: {
      en: "A mineral-looking matt façade paint where water beads off like on a leaf.",
      fr: "Une peinture façade mate d’aspect minéral sur laquelle l’eau perle comme sur une feuille.",
    },
    about: [
      {
        en: "Siloxane resins create a micro-structured surface that water cannot wet: drops bead and roll off, taking dust with them. Yet water vapor from inside still escapes, so walls stay healthy.",
        fr: "Les résines siloxanes créent une surface microstructurée que l’eau ne mouille pas : les gouttes perlent et roulent en emportant la poussière. La vapeur d’eau intérieure s’échappe pourtant, et le mur reste sain.",
      },
      {
        en: "Its deep mineral matt suits heritage buildings, stone and traditional plasters.",
        fr: "Son mat minéral profond convient aux bâtiments anciens, à la pierre et aux enduits traditionnels.",
      },
    ],
    highlights: [
      { icon: "drop", label: { en: "Beading effect", fr: "Effet perlant" } },
      { icon: "eco", label: { en: "Breathable", fr: "Respirante" } },
      { icon: "exterior", label: { en: "Self-cleaning", fr: "Autonettoyante" } },
      { icon: "sun", label: { en: "Mineral matt", fr: "Mat minéral" } },
    ],
    figures: { coverage: 7, touchDry: 45, recoat: 6, coats: 2 },
    specs: {
      binder: { en: "Siloxane-modified acrylic", fr: "Acrylique modifiée siloxane" },
      density: "1.52 ± 0.05 kg/L",
      dryExtract: "63 % ± 2",
      voc: "< 35 g/L",
      coverage: "6 – 7 m²/kg",
      dilution: { en: "5 % water", fr: "5 % d’eau" },
      temperature: "+5 °C → +30 °C",
      fullCure: { en: "14 days", fr: "14 jours" },
      resistance: { en: "Water absorption W3, permeability V1 (EN 1062)", fr: "Absorption W3, perméabilité V1 (EN 1062)" },
      shelfLife: TWO_YEARS,
    },
    colors: ["PT-102", "PT-201", "PT-204", "PT-304", "PT-502"],
    gallery: ["/solutions/exterior.webp", "/solutions/professionals.webp"],
  },
];

/* ------------------------------------------------------------------ */
/* Application steps, shared by product kind                           */
/* ------------------------------------------------------------------ */

type Step = { title: L; text: L };

const STEPS: Record<Kind, Step[]> = {
  interior: [
    { title: { en: "Prepare", fr: "Préparer" }, text: { en: "Clean, dust off and fill the holes. Sand glossy surfaces lightly.", fr: "Nettoyer, dépoussiérer et reboucher. Poncer légèrement les fonds brillants." } },
    { title: { en: "Fix", fr: "Fixer" }, text: { en: "Apply FIX-ONE on new or uneven plaster, IROCRYL on powdery walls.", fr: "Appliquer FIX-ONE sur enduit neuf ou irrégulier, IROCRYL sur mur farineux." } },
    { title: { en: "Paint", fr: "Peindre" }, text: { en: "Stir well, then apply a first coat with a 12 mm nap roller.", fr: "Bien mélanger, puis appliquer une première couche au rouleau poils 12 mm." } },
    { title: { en: "Finish", fr: "Finir" }, text: { en: "Apply the second coat crosswise once the recoat time has passed.", fr: "Appliquer la seconde couche en croisant, une fois le délai de recouvrement passé." } },
  ],
  ceiling: [
    { title: { en: "Protect", fr: "Protéger" }, text: { en: "Cover floors and furniture, tape the top of the walls.", fr: "Protéger sols et meubles, masquer le haut des murs." } },
    { title: { en: "Fix", fr: "Fixer" }, text: { en: "Treat stained or absorbent ceilings with FIX-ONE first.", fr: "Traiter d’abord les plafonds tachés ou absorbants avec FIX-ONE." } },
    { title: { en: "Roll", fr: "Rouler" }, text: { en: "Work in strips parallel to the window, wet edge into wet edge.", fr: "Travailler par bandes parallèles à la fenêtre, frais dans frais." } },
    { title: { en: "Cross", fr: "Croiser" }, text: { en: "Second coat perpendicular to the first, for a seamless film.", fr: "Seconde couche perpendiculaire à la première, pour un film sans raccord." } },
  ],
  primer: [
    { title: { en: "Clean", fr: "Nettoyer" }, text: { en: "Remove dust, grease and any flaking paint.", fr: "Éliminer poussière, graisse et peinture écaillée." } },
    { title: { en: "Dilute", fr: "Diluer" }, text: { en: "Add 10 – 20 % water depending on the absorption of the wall.", fr: "Ajouter 10 à 20 % d’eau selon l’absorption du mur." } },
    { title: { en: "Apply", fr: "Appliquer" }, text: { en: "One generous coat with a roller, brush or airless sprayer.", fr: "Une couche généreuse au rouleau, à la brosse ou à l’airless." } },
    { title: { en: "Wait", fr: "Attendre" }, text: { en: "Let it dry 3 hours before the finishing coat.", fr: "Laisser sécher 3 heures avant la couche de finition." } },
  ],
  fixer: [
    { title: { en: "Brush off", fr: "Brosser" }, text: { en: "Brush the wall to remove loose particles.", fr: "Brosser le mur pour retirer les particules instables." } },
    { title: { en: "Dilute", fr: "Diluer" }, text: { en: "Mix 1 part IROCRYL with 3 to 5 parts water.", fr: "Mélanger 1 volume d’IROCRYL avec 3 à 5 volumes d’eau." } },
    { title: { en: "Soak", fr: "Imprégner" }, text: { en: "Apply until the surface stops absorbing, without runs.", fr: "Appliquer jusqu’à saturation du support, sans coulures." } },
    { title: { en: "Paint", fr: "Peindre" }, text: { en: "Paint after 12 hours of drying.", fr: "Peindre après 12 heures de séchage." } },
  ],
  facade: [
    { title: { en: "Wash", fr: "Laver" }, text: { en: "High-pressure wash the façade and treat any moss.", fr: "Laver la façade à haute pression et traiter les mousses." } },
    { title: { en: "Repair", fr: "Réparer" }, text: { en: "Open and fill cracks, then fix with IROCRYL.", fr: "Ouvrir et reboucher les fissures, puis fixer avec IROCRYL." } },
    { title: { en: "First coat", fr: "1re couche" }, text: { en: "Apply diluted 10 % with a long-nap roller.", fr: "Appliquer diluée à 10 % au rouleau poils longs." } },
    { title: { en: "Second coat", fr: "2e couche" }, text: { en: "Apply pure, out of direct sun and rain.", fr: "Appliquer pure, hors plein soleil et hors pluie." } },
  ],
};

const TOOLS: Record<Kind, L> = {
  interior: { en: "Roller, brush, airless", fr: "Rouleau, brosse, airless" },
  ceiling: { en: "Roller, airless", fr: "Rouleau, airless" },
  primer: { en: "Roller, brush, airless", fr: "Rouleau, brosse, airless" },
  fixer: { en: "Wide brush, low-pressure sprayer", fr: "Brosse large, pulvérisateur basse pression" },
  facade: { en: "Long-nap roller, brush, airless", fr: "Rouleau poils longs, brosse, airless" },
};

const FINISHES: Record<Finish, L> = {
  matte: { en: "Matt", fr: "Mat" },
  satin: { en: "Satin", fr: "Satiné" },
  velvet: { en: "Velvet", fr: "Velours" },
  transparent: { en: "Transparent", fr: "Transparent" },
};

const DESTINATION: Record<Kind, L> = {
  interior: { en: "Interior walls", fr: "Murs intérieurs" },
  ceiling: { en: "Interior ceilings", fr: "Plafonds intérieurs" },
  primer: { en: "Interior and exterior walls", fr: "Murs intérieurs et extérieurs" },
  fixer: { en: "Porous and powdery surfaces", fr: "Supports poreux et farineux" },
  facade: { en: "Exterior façades", fr: "Façades extérieures" },
};

/* ------------------------------------------------------------------ */
/* Localized shapes sent to the pages                                  */
/* ------------------------------------------------------------------ */

/** Short product shape used by the category lists. */
export type ProductCard = {
  id: string;
  name: string;
  image: string;
  width: number;
  height: number;
  accent: string;
  badge?: BadgeKey;
  tag: string;
  tagline: string;
  description: string;
  highlights: { icon: IconName; label: string }[];
  finish: Finish;
  finishLabel: string;
  sizes: string[];
  /** Max coverage per coat, with its unit (m²/kg or m²/L). */
  coverage: number;
  coverageUnit: string;
  colors: string[];
};

export type SpecRow = { label: string; value: string };

/** Full product shape used by the detail page. */
export type ProductDetail = ProductCard & {
  about: string[];
  figures: CatalogEntry["figures"];
  specGroups: { title: string; rows: SpecRow[] }[];
  steps: { title: string; text: string }[];
  gallery: string[];
  categories: CategorySlug[];
  /** 3D pack shown on the product page (null: the photo is used). */
  model: { url: string; photo: string } | null;
};

/**
 * 3D pack per product, by family. Empty GLB exports get the photo wrapped on the
 * shared bucket (see loadProductModel). The 1 L bottle has no 3D model: photo only.
 */
function modelFor(id: string): ProductDetail["model"] {
  if (id === "irocryl-1l") return null;
  if (id.startsWith("irovella")) return { url: "/3d-products/IROVELLA.glb", photo: "/products/irovella.webp" };
  if (id.startsWith("plafonya")) return { url: "/3d-products/PLAFONYA.glb", photo: "/products/plafonya.webp" };
  if (id.startsWith("fix-one")) return { url: "/3d-products/FIXONE.glb", photo: "/products/fix-one.webp" };
  if (id.startsWith("irocryl")) return { url: "/3d-products/IROCRYL.glb", photo: "/products/irocryl-4l.webp" };
  if (id.startsWith("irofacade")) return { url: "/3d-products/IROFACADE.glb", photo: "/products/irofacade.webp" };
  return null;
}

const SPEC_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    identity: "Identification",
    application: "Application",
    drying: "Drying",
    performance: "Performance & storage",
    destination: "Use",
    finish: "Finish",
    binder: "Binder",
    density: "Density at 20 °C",
    dryExtract: "Dry extract by weight",
    voc: "VOC content",
    tools: "Tools",
    dilution: "Dilution",
    coverage: "Coverage per coat",
    temperature: "Application temperature",
    coats: "Recommended coats",
    touchDry: "Touch dry",
    recoat: "Recoatable after",
    fullCure: "Full cure",
    resistance: "Resistance",
    sizes: "Pack sizes",
    shelfLife: "Shelf life",
    storage: "Storage",
    storageValue: "Away from frost and direct sun, between +5 °C and +35 °C",
  },
  fr: {
    identity: "Identification",
    application: "Application",
    drying: "Séchage",
    performance: "Performances & stockage",
    destination: "Destination",
    finish: "Aspect",
    binder: "Liant",
    density: "Densité à 20 °C",
    dryExtract: "Extrait sec en poids",
    voc: "Teneur en COV",
    tools: "Outils",
    dilution: "Dilution",
    coverage: "Rendement par couche",
    temperature: "Température d’application",
    coats: "Couches conseillées",
    touchDry: "Sec au toucher",
    recoat: "Recouvrable après",
    fullCure: "Dureté à cœur",
    resistance: "Résistance",
    sizes: "Conditionnements",
    shelfLife: "Conservation",
    storage: "Stockage",
    storageValue: "À l’abri du gel et du soleil, entre +5 °C et +35 °C",
  },
};

function toCard(p: CatalogEntry, locale: Locale): ProductCard {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    width: p.width,
    height: p.height,
    accent: p.accent,
    badge: p.badge,
    tag: p.tag[locale],
    tagline: p.tagline[locale],
    description: p.description[locale],
    highlights: p.highlights.map((h) => ({ icon: h.icon, label: h.label[locale] })),
    finish: p.finish,
    finishLabel: FINISHES[p.finish][locale],
    sizes: p.sizes,
    coverage: p.figures.coverage,
    coverageUnit: p.specs.coverage.endsWith("/L") ? "m²/L" : "m²/kg",
    colors: p.colors,
  };
}

function toDetail(p: CatalogEntry, locale: Locale): ProductDetail {
  const t = SPEC_LABELS[locale];
  const minutes = (n: number) => (n >= 60 ? `${n / 60} h` : `${n} min`);
  return {
    ...toCard(p, locale),
    about: p.about.map((paragraph) => paragraph[locale]),
    figures: p.figures,
    categories: p.categories,
    gallery: p.gallery,
    model: modelFor(p.id),
    steps: STEPS[p.kind].map((s) => ({ title: s.title[locale], text: s.text[locale] })),
    specGroups: [
      {
        title: t.identity,
        rows: [
          { label: t.destination, value: DESTINATION[p.kind][locale] },
          { label: t.finish, value: FINISHES[p.finish][locale] },
          { label: t.binder, value: p.specs.binder[locale] },
          { label: t.density, value: p.specs.density },
          { label: t.dryExtract, value: p.specs.dryExtract },
          { label: t.voc, value: p.specs.voc },
        ],
      },
      {
        title: t.application,
        rows: [
          { label: t.tools, value: TOOLS[p.kind][locale] },
          { label: t.dilution, value: p.specs.dilution[locale] },
          { label: t.coverage, value: p.specs.coverage },
          { label: t.coats, value: String(p.figures.coats) },
          { label: t.temperature, value: p.specs.temperature },
        ],
      },
      {
        title: t.drying,
        rows: [
          { label: t.touchDry, value: minutes(p.figures.touchDry) },
          { label: t.recoat, value: `${p.figures.recoat} h` },
          { label: t.fullCure, value: p.specs.fullCure[locale] },
        ],
      },
      {
        title: t.performance,
        rows: [
          { label: t.resistance, value: p.specs.resistance[locale] },
          { label: t.sizes, value: p.sizes.join(" · ") },
          { label: t.shelfLife, value: p.specs.shelfLife[locale] },
          { label: t.storage, value: t.storageValue },
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Data access (async, like a real backend)                            */
/* ------------------------------------------------------------------ */

export const PRODUCT_IDS = CATALOG.map((p) => p.id);

export async function getCategoryProducts(slug: CategorySlug, locale: Locale): Promise<ProductCard[]> {
  return CATALOG.filter((p) => p.categories.includes(slug)).map((p) => toCard(p, locale));
}

export async function getProductDetail(id: string, locale: Locale): Promise<ProductDetail | null> {
  const product = CATALOG.find((p) => p.id === id);
  return product ? toDetail(product, locale) : null;
}

/** Other products sharing at least one category, best matches first. */
export async function getRelatedProducts(id: string, locale: Locale, limit = 4): Promise<ProductCard[]> {
  const product = CATALOG.find((p) => p.id === id);
  if (!product) return [];
  return CATALOG.filter((p) => p.id !== id)
    .map((p) => ({ p, score: p.categories.filter((c) => product.categories.includes(c)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => toCard(x.p, locale));
}
