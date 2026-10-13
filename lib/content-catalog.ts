/**
 * Texts of the catalogue pages: /[locale]/solutions/[slug] and /[locale]/products/[id] (EN / FR).
 * Category titles, photos and intros come from `solutions` in lib/content-sections.ts.
 */
import type { Locale } from "./content";
import type { BadgeKey } from "./products";

export type CatalogContent = {
  back: string;
  home: string;
  distributor: string;
  badges: Record<BadgeKey, string>;
  category: {
    eyebrow: string;
    products: string;
    loading: string;
    error: string;
    retry: string;
    empty: string;
    viewList: string;
    viewGrid: string;
    filterAll: string;
    filterLabel: string;
    details: string;
    specFinish: string;
    specCoverage: string;
    specSizes: string;
    scrollHint: string;
    otherSolutions: string;
    helpTitle: string;
    helpText: string;
    helpCta: string;
  };
  product: {
    tabs: { overview: string; specs: string; application: string; colors: string; gallery: string };
    sizes: string;
    findDistributor: string;
    downloadSheet: string;
    figures: { coverage: string; touchDry: string; recoat: string; coats: string };
    figureUnits: { touchDry: string; recoat: string; coats: string };
    aboutEyebrow: string;
    aboutTitle: string;
    specsEyebrow: string;
    specsTitle: string;
    specsNote: string;
    applicationEyebrow: string;
    applicationTitle: string;
    colorsEyebrow: string;
    colorsTitle: string;
    colorsText: string;
    noColors: string;
    galleryEyebrow: string;
    galleryTitle: string;
    relatedEyebrow: string;
    relatedTitle: string;
    usedIn: string;
    closeImage: string;
    openImage: string;
  };
};

export const catalogContent: Record<Locale, CatalogContent> = {
  en: {
    back: "Back",
    home: "Home",
    distributor: "Find a distributor",
    badges: { bestSeller: "Best seller", new: "New", recommended: "Recommended" },
    category: {
      eyebrow: "Solution",
      products: "products",
      loading: "Mixing the range...",
      error: "We could not load the products.",
      retry: "Try again",
      empty: "No product matches this finish.",
      viewList: "Story view",
      viewGrid: "Grid view",
      filterAll: "All",
      filterLabel: "Finish",
      details: "View product",
      specFinish: "Finish",
      specCoverage: "Coverage",
      specSizes: "Sizes",
      scrollHint: "Scroll to discover",
      otherSolutions: "Other solutions",
      helpTitle: "Not sure which one?",
      helpText: "Our distributors mix, advise and deliver everywhere in Algeria.",
      helpCta: "Find a distributor",
    },
    product: {
      tabs: { overview: "Overview", specs: "Technical sheet", application: "Application", colors: "Colors", gallery: "Gallery" },
      sizes: "Pack size",
      findDistributor: "Find a distributor",
      downloadSheet: "Technical sheet (PDF)",
      figures: { coverage: "Coverage", touchDry: "Touch dry", recoat: "Recoat", coats: "Coats" },
      figureUnits: { touchDry: "min", recoat: "hours", coats: "coats" },
      aboutEyebrow: "About",
      aboutTitle: "Made to last, made to be lived with.",
      specsEyebrow: "Technical sheet",
      specsTitle: "Every number, nothing hidden.",
      specsNote: "Values measured at 20 °C and 65 % relative humidity. Drying times lengthen in cold or humid weather.",
      applicationEyebrow: "Application",
      applicationTitle: "Four steps to a perfect wall.",
      colorsEyebrow: "Colors",
      colorsTitle: "Tinted to your shade.",
      colorsText: "Pick a color to preview it. Every shade is mixed on demand by your distributor.",
      noColors: "Transparent product: it disappears into the wall once dry.",
      galleryEyebrow: "Gallery",
      galleryTitle: "On real walls.",
      relatedEyebrow: "Goes well with",
      relatedTitle: "Complete the system",
      usedIn: "Used in",
      closeImage: "Close image",
      openImage: "Open image",
    },
  },
  fr: {
    back: "Retour",
    home: "Accueil",
    distributor: "Trouver un distributeur",
    badges: { bestSeller: "Best-seller", new: "Nouveau", recommended: "Recommandé" },
    category: {
      eyebrow: "Solution",
      products: "produits",
      loading: "On mélange la gamme...",
      error: "Impossible de charger les produits.",
      retry: "Réessayer",
      empty: "Aucun produit ne correspond à cet aspect.",
      viewList: "Vue récit",
      viewGrid: "Vue grille",
      filterAll: "Tous",
      filterLabel: "Aspect",
      details: "Voir le produit",
      specFinish: "Aspect",
      specCoverage: "Rendement",
      specSizes: "Formats",
      scrollHint: "Défilez pour découvrir",
      otherSolutions: "Autres solutions",
      helpTitle: "Vous hésitez ?",
      helpText: "Nos distributeurs teintent, conseillent et livrent partout en Algérie.",
      helpCta: "Trouver un distributeur",
    },
    product: {
      tabs: { overview: "Présentation", specs: "Fiche technique", application: "Application", colors: "Couleurs", gallery: "Galerie" },
      sizes: "Conditionnement",
      findDistributor: "Trouver un distributeur",
      downloadSheet: "Fiche technique (PDF)",
      figures: { coverage: "Rendement", touchDry: "Sec au toucher", recoat: "Recouvrable", coats: "Couches" },
      figureUnits: { touchDry: "min", recoat: "heures", coats: "couches" },
      aboutEyebrow: "À propos",
      aboutTitle: "Faite pour durer, faite pour être vécue.",
      specsEyebrow: "Fiche technique",
      specsTitle: "Tous les chiffres, rien de caché.",
      specsNote: "Valeurs mesurées à 20 °C et 65 % d’humidité relative. Les temps de séchage s’allongent par temps froid ou humide.",
      applicationEyebrow: "Application",
      applicationTitle: "Quatre étapes vers un mur parfait.",
      colorsEyebrow: "Couleurs",
      colorsTitle: "Teintée à votre couleur.",
      colorsText: "Choisissez une couleur pour la prévisualiser. Chaque teinte est préparée à la demande par votre distributeur.",
      noColors: "Produit transparent : il disparaît dans le mur une fois sec.",
      galleryEyebrow: "Galerie",
      galleryTitle: "Sur de vrais murs.",
      relatedEyebrow: "Va bien avec",
      relatedTitle: "Complétez le système",
      usedIn: "Utilisé en",
      closeImage: "Fermer l’image",
      openImage: "Ouvrir l’image",
    },
  },
};
