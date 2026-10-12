/**
 * Every visible text of the website, per locale.
 * Edit the copy here, components never hard-code text.
 */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export type Content = {
  meta: { title: string; description: string };
  nav: {
    products: string;
    brand: string;
    contact: string;
    buy: string;
    menuOpen: string;
    menuClose: string;
    language: string;
    home: string;
  };
  hero: {
    title: string;
    subtitle: string;
    scrollHint: string;
    cta: string;
    productLabel: string;
  };
  loader: { line: string };
  /** One entry per product, same order as PRODUCTS in lib/chapters.ts. */
  products: ProductCopy[];
};

export type ProductCopy = {
  /** Small uppercase category above the name. */
  tag: string;
  description: string;
  /** Three short selling points. */
  features: [string, string, string];
  /** Pack size shown next to the features. */
  size: string;
};

export const content: Record<Locale, Content> = {
  en: {
    meta: {
      title: "PAINTIRO — Color, crafted to last",
      description: "Professional paints, primers and fixers made for walls that matter.",
    },
    nav: {
      products: "Products",
      brand: "Brand",
      contact: "Contact",
      buy: "Order now",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      language: "Language",
      home: "PAINTIRO home",
    },
    hero: {
      title: "Color, crafted to last.",
      subtitle: "Professional paints, primers and fixers made for walls that matter.",
      scrollHint: "Scroll to explore",
      cta: "Explore products",
      productLabel: "Current product",
    },
    loader: { line: "Color is loading..." },
    products: [
      {
        tag: "Satin acrylic paint",
        description: "A satin acrylic finish for interior walls: smooth, washable and deep in color.",
        features: ["Professional quality", "Satin finish", "Smooth, even film"],
        size: "18 kg",
      },
      {
        tag: "Ceiling paint",
        description: "Made for ceilings: high coverage that goes on easily and never drips.",
        features: ["High coverage", "No drips", "Seamless film"],
        size: "18 kg",
      },
      {
        tag: "Water-based acrylic fixer",
        description: "A water-based fixer with 98% opacity that prepares every wall for a perfect finish.",
        features: ["Extreme opacity", "Absolute resistance", "Premium performance"],
        size: "18 kg",
      },
      {
        tag: "Transparent liquid fixer",
        description: "Penetrates deep into the surface to lock it, protect it and help paint hold.",
        features: ["Excellent penetration", "Maximum adhesion", "Reinforced protection"],
        size: "4 L",
      },
      {
        tag: "High-quality façade paint",
        description: "Built for exterior walls: weather resistant, long-lasting color, quick drying.",
        features: ["Weather resistant", "Long-lasting color", "Quick drying"],
        size: "20 kg",
      },
    ],
  },
  fr: {
    meta: {
      title: "PAINTIRO — La couleur, faite pour durer",
      description: "Peintures, primaires et fixateurs professionnels pour des murs qui comptent.",
    },
    nav: {
      products: "Produits",
      brand: "Marque",
      contact: "Contact",
      buy: "Commander",
      menuOpen: "Ouvrir le menu",
      menuClose: "Fermer le menu",
      language: "Langue",
      home: "Accueil PAINTIRO",
    },
    hero: {
      title: "La couleur, faite pour durer.",
      subtitle: "Peintures, primaires et fixateurs professionnels pour des murs qui comptent.",
      scrollHint: "Faites défiler",
      cta: "Voir les produits",
      productLabel: "Produit actuel",
    },
    loader: { line: "La couleur arrive..." },
    products: [
      {
        tag: "Peinture acrylique satinée",
        description: "Une finition acrylique satinée pour les murs intérieurs : lisse, lessivable et intense.",
        features: ["Qualité professionnelle", "Finition satinée", "Film lisse et régulier"],
        size: "18 kg",
      },
      {
        tag: "Peinture spéciale plafond",
        description: "Pensée pour les plafonds : haute couverture, facile à appliquer et sans coulures.",
        features: ["Haute couverture", "Ne goutte pas", "Film tendu sans raccord"],
        size: "18 kg",
      },
      {
        tag: "Fixateur acrylique à base d’eau",
        description: "Un fixateur à base d’eau, 98 % d’opacité, qui prépare chaque mur à une finition parfaite.",
        features: ["Opacité extrême", "Résistance absolue", "Performance premium"],
        size: "18 kg",
      },
      {
        tag: "Fixateur liquide transparent",
        description: "Pénètre en profondeur pour fixer le support, le protéger et faire tenir la peinture.",
        features: ["Excellente pénétration", "Adhérence maximale", "Protection renforcée"],
        size: "4 L",
      },
      {
        tag: "Peinture spéciale façade",
        description: "Conçue pour l’extérieur : résiste aux intempéries, couleur durable, séchage rapide.",
        features: ["Résiste aux intempéries", "Couleur longue durée", "Séchage rapide"],
        size: "20 kg",
      },
    ],
  },
};
