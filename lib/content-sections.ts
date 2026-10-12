/**
 * Texts of the homepage sections below the hero (EN / FR).
 * Hero, navbar and loader texts live in lib/content.ts.
 */
import type { IconName } from "@/components/ui/Icon";
import type { ColorFamilyKey } from "./colors";
import type { Locale } from "./content";
import type { ProductId } from "./products";

type Link = { label: string; href: string };

export type SectionsContent = {
  ai: {
    open: string;
    close: string;
    title: string;
    intro: string;
    placeholder: string;
    send: string;
    examplesLabel: string;
    examples: string[];
    teaser: string;
    thinking: string;
    fallback: string;
    recommendation: string;
    answers: Record<ProductId, string>;
    disclaimer: string;
  };
  solutions: {
    eyebrow: string;
    title: string;
    viewAll: string;
    /** Short line under the title in the intro panel. */
    intro: string;
    /** Hint shown next to the progress bar. */
    scrollHint: string;
    /** Button label on each panel. */
    cta: string;
    /** Label before the recommended product name. */
    productLabel: string;
    items: {
      icon: IconName;
      title: string;
      text: string;
      details: string;
      /** Photo shown in the panel (from /public). */
      image: string;
      productId: ProductId;
    }[];
  };
  colors: {
    eyebrow: string;
    title: string;
    intro: string;
    /** Hint under the deck: how to interact. */
    hint: string;
    families: string;
    explore: string;
    selected: string;
    copy: string;
    copied: string;
    familyNames: Record<ColorFamilyKey, string>;
  };
  visualizer: {
    eyebrow: string;
    title: string;
    text: string;
    chooseColor: string;
    finish: string;
    finishes: Record<"matte" | "satin" | "gloss", string>;
    before: string;
    after: string;
    rooms: Record<"living" | "dining" | "bedroom", string>;
    sliderLabel: string;
    cta: string;
  };
  why: {
    eyebrow: string;
    title: string;
    items: { icon: IconName; title: string; text: string }[];
    stats: { value: number; suffix: string; label: string }[];
  };
  articles: {
    eyebrow: string;
    title: string;
    viewAll: string;
    previous: string;
    next: string;
    items: { tag: string; title: string; date: string; image: string }[];
  };
  about: {
    eyebrow: string;
    title: string;
    /** Brand story chapters: one giant word + one short sentence + a photo. */
    chapters: { word: string; text: string; image: string }[];
    /** Label of the film card under the chapters. */
    film: string;
    cta: string;
    play: string;
    closeVideo: string;
  };
  distributor: {
    eyebrow: string;
    title: string;
    text: string;
    placeholder: string;
    distributors: string;
    wilayas: string;
    allAlgeria: string;
    listTitle: string;
    directions: string;
    call: string;
    none: string;
    nearest: string;
    noResults: string;
    types: Record<"distributor" | "store" | "showroom", string>;
    mapLabel: string;
    zoomIn: string;
    zoomOut: string;
    attribution: string;
  };
  newsletter: {
    title: string;
    text: string;
    placeholder: string;
    button: string;
    success: string;
    invalid: string;
  };
  footer: {
    description: string;
    columns: { title: string; links: Link[] }[];
    rights: string;
    social: string;
    backToTop: string;
  };
};

export const sectionsContent: Record<Locale, SectionsContent> = {
  en: {
    ai: {
      open: "Open the PAINTIRO assistant",
      close: "Close the assistant",
      title: "Need help choosing the right paint?",
      intro: "Ask me about our products, finishes and where to use them.",
      placeholder: "Ask anything...",
      send: "Send",
      examplesLabel: "Example questions",
      examples: [
        "Best paint for a kitchen?",
        "How do I paint exterior walls?",
        "Which product for a ceiling?",
      ],
      teaser: "Need help choosing?",
      thinking: "Thinking...",
      fallback:
        "I can help with interior walls, ceilings, façades and wall preparation. Tell me which surface you want to paint.",
      recommendation: "Recommended product",
      answers: {
        irovella:
          "For kitchens, living rooms and bedrooms, choose IROVELLA: a satin acrylic finish that is washable and easy to clean.",
        plafonya:
          "For ceilings, PLAFONYA is made for the job: high coverage, no drips and a seamless matt film.",
        "fix-one":
          "Start with FIX-ONE: a water-based fixer with 98% opacity that unifies the surface before the finish coat.",
        "irocryl-1l":
          "For small repairs, IROCRYL 1L penetrates porous areas and helps the paint hold.",
        "irocryl-4l":
          "On powdery or porous walls, apply IROCRYL first: it penetrates deep, locks the surface and boosts adhesion.",
        irofacade:
          "For exterior walls, use IROFAÇADE: weather resistant, long-lasting color and quick drying. Prepare the wall with IROCRYL first.",
      },
      disclaimer: "Automatic suggestions based on the PAINTIRO range.",
    },
    solutions: {
      eyebrow: "Solutions",
      title: "Solutions for every project",
      viewAll: "View all solutions",
      intro: "From the first coat of fixer to the last touch of color, a PAINTIRO answer for every surface.",
      scrollHint: "Scroll",
      cta: "Find a distributor",
      productLabel: "Recommended",
      items: [
        { icon: "interior", title: "Interior", text: "Perfect finishes for living spaces.", details: "Living rooms, bedrooms and kitchens deserve a finish that is smooth, washable and rich in color, coat after coat.", image: "/solutions/interior.webp", productId: "irovella" },
        { icon: "exterior", title: "Exterior", text: "Durable protection for façades.", details: "Rain, sun and wind: façade paint that resists the weather, keeps its color for years and dries fast.", image: "/solutions/exterior.webp", productId: "irofacade" },
        { icon: "ceiling", title: "Ceilings", text: "Bright, seamless ceilings.", details: "A deep matt white that goes on easily, never drips and dries into one seamless film.", image: "/solutions/ceiling.webp", productId: "plafonya" },
        { icon: "renovation", title: "Renovation", text: "New life for old surfaces.", details: "Unify tired, stained or uneven walls with a 98% opacity fixer before the finishing coat.", image: "/solutions/renovation.webp", productId: "fix-one" },
        { icon: "primer", title: "Preparation", text: "Fixers and primers that hold.", details: "Powdery or porous supports are locked and protected so the paint grips and lasts.", image: "/solutions/preparation.webp", productId: "irocryl-4l" },
        { icon: "pro", title: "Professionals", text: "Large formats for job sites.", details: "18 and 20 kg formats, consistent quality from one batch to the next, made for painters who work every day.", image: "/solutions/professionals.webp", productId: "irofacade" },
      ],
    },
    colors: {
      eyebrow: "Colors",
      title: "Colors that inspire",
      intro: "Open the PAINTIRO fan deck and pick a shade: the whole room takes its color.",
      hint: "Click a card · use ← → keys",
      families: "Color families",
      explore: "Find this color",
      selected: "Selected color",
      copy: "Copy code",
      copied: "Copied",
      familyNames: {
        whites: "Whites",
        beiges: "Beiges",
        greys: "Greys",
        blues: "Blues",
        greens: "Greens",
        reds: "Reds",
      },
    },
    visualizer: {
      eyebrow: "Visualizer",
      title: "See the color in your room",
      text: "Pick a shade and a finish, then drag the slider to compare before and after.",
      chooseColor: "Choose a color",
      finish: "Finish",
      finishes: { matte: "Matte", satin: "Satin", gloss: "Gloss" },
      before: "Before",
      after: "After",
      rooms: { living: "Living room", dining: "Dining room", bedroom: "Bedroom" },
      sliderLabel: "Compare before and after",
      cta: "Find this color",
    },
    why: {
      eyebrow: "Why PAINTIRO",
      title: "Why choose PAINTIRO?",
      items: [
        { icon: "quality", title: "Premium quality", text: "High-quality raw materials for perfect results." },
        { icon: "performance", title: "High performance", text: "Exceptional coverage and long-lasting durability." },
        { icon: "expertise", title: "Expertise", text: "Years of experience and professional know-how." },
        { icon: "innovation", title: "Innovation", text: "Advanced formulas for better performance." },
        { icon: "eco", title: "Eco friendly", text: "Water-based, low odor formulas." },
      ],
      stats: [
        { value: 25, suffix: "+", label: "Years of experience" },
        { value: 500, suffix: "+", label: "Quality products" },
        { value: 1000, suffix: "+", label: "Trusted distributors" },
      ],
    },
    articles: {
      eyebrow: "Journal",
      title: "Latest articles",
      viewAll: "View all articles",
      previous: "Previous articles",
      next: "Next articles",
      items: [
        { tag: "Tips & guides", title: "How to choose the right paint finish", date: "October 2, 2026", image: "/frames/frame_0001.webp" },
        { tag: "Inspiration", title: "The colors shaping interiors this season", date: "September 24, 2026", image: "/frames/frame_0140.webp" },
        { tag: "Projects", title: "Exterior painting tips for long-lasting results", date: "September 15, 2026", image: "/frames/frame_0150.webp" },
        { tag: "Products", title: "Why a fixer changes everything", date: "September 6, 2026", image: "/frames/frame_0058.webp" },
        { tag: "Tips & guides", title: "Preparing powdery walls before painting", date: "August 28, 2026", image: "/frames/frame_0110.webp" },
        { tag: "Projects", title: "Painting a ceiling without drips", date: "August 19, 2026", image: "/frames/frame_0033.webp" },
      ],
    },
    about: {
      eyebrow: "About",
      title: "About PAINTIRO",
      chapters: [
        { word: "Passion", text: "Color is our craft. Every PAINTIRO formula starts with a love for beautiful walls.", image: "/frames/frame_0230.webp" },
        { word: "Quality", text: "High-quality raw materials for a perfect finish, coat after coat.", image: "/frames/frame_0058.webp" },
        { word: "Protection", text: "Paints and fixers that defend your walls against time, humidity and weather.", image: "/frames/frame_0150.webp" },
      ],
      film: "Watch the PAINTIRO film",
      cta: "Discover PAINTIRO",
      play: "Play the PAINTIRO film",
      closeVideo: "Close the video",
    },
    distributor: {
      eyebrow: "Distributors",
      title: "Find PAINTIRO near you",
      text: "Pick your wilaya on the map to see our distributors, stores and showrooms.",
      placeholder: "Search a wilaya or a city",
      distributors: "points of sale",
      wilayas: "wilayas",
      allAlgeria: "All of Algeria",
      listTitle: "Wilayas with PAINTIRO",
      directions: "Directions",
      call: "Call",
      none: "No point of sale in this wilaya yet.",
      nearest: "Nearest",
      noResults: "No wilaya or city found.",
      types: { distributor: "Distributor", store: "Store", showroom: "Showroom" },
      mapLabel: "Map of Algeria with PAINTIRO points of sale",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      attribution: "Map data © OpenStreetMap contributors, geoBoundaries",
    },
    newsletter: {
      title: "Stay updated",
      text: "Subscribe for tips, new products and exclusive offers.",
      placeholder: "Your email address",
      button: "Subscribe",
      success: "Thank you! You are on the list.",
      invalid: "Please enter a valid email address.",
    },
    footer: {
      description: "Premium paints and coatings for beauty, protection and performance.",
      columns: [
        {
          title: "Products",
          links: [
            { label: "Interior paints", href: "#solutions" },
            { label: "Ceiling paints", href: "#solutions" },
            { label: "Fixers", href: "#solutions" },
            { label: "Primers", href: "#solutions" },
            { label: "Façade paints", href: "#solutions" },
          ],
        },
        {
          title: "Colors",
          links: [
            { label: "Popular colors", href: "#colors" },
            { label: "Color families", href: "#colors" },
            { label: "Inspiration", href: "#articles" },
          ],
        },
        {
          title: "Solutions",
          links: [
            { label: "Interior", href: "#solutions" },
            { label: "Exterior", href: "#solutions" },
            { label: "Renovation", href: "#solutions" },
            { label: "Professionals", href: "#solutions" },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "About us", href: "#brand" },
            { label: "Why PAINTIRO", href: "#why" },
            { label: "Journal", href: "#articles" },
          ],
        },
        {
          title: "Support",
          links: [
            { label: "Find a distributor", href: "#contact" },
            { label: "Contact us", href: "#contact" },
            { label: "Newsletter", href: "#newsletter" },
          ],
        },
      ],
      rights: "All rights reserved.",
      social: "Follow PAINTIRO",
      backToTop: "Back to top",
    },
  },
  fr: {
    ai: {
      open: "Ouvrir l’assistant PAINTIRO",
      close: "Fermer l’assistant",
      title: "Besoin d’aide pour choisir votre peinture ?",
      intro: "Posez vos questions sur nos produits, les finitions et leurs usages.",
      placeholder: "Posez votre question...",
      send: "Envoyer",
      examplesLabel: "Exemples de questions",
      examples: [
        "Quelle peinture pour une cuisine ?",
        "Comment peindre un mur extérieur ?",
        "Quel produit pour un plafond ?",
      ],
      teaser: "Besoin d’aide ?",
      thinking: "Réflexion...",
      fallback:
        "Je peux vous aider pour les murs intérieurs, les plafonds, les façades et la préparation des supports. Dites-moi quelle surface vous voulez peindre.",
      recommendation: "Produit recommandé",
      answers: {
        irovella:
          "Pour une cuisine, un salon ou une chambre, choisissez IROVELLA : une finition acrylique satinée, lessivable et facile à nettoyer.",
        plafonya:
          "Pour les plafonds, PLAFONYA est fait pour ça : haute couverture, ne goutte pas et film mat sans raccord.",
        "fix-one":
          "Commencez par FIX-ONE : un fixateur à base d’eau, 98 % d’opacité, qui unifie le support avant la finition.",
        "irocryl-1l":
          "Pour les petites réparations, IROCRYL 1L pénètre les zones poreuses et aide la peinture à tenir.",
        "irocryl-4l":
          "Sur un mur farineux ou poreux, appliquez d’abord IROCRYL : il pénètre en profondeur, fixe le support et renforce l’adhérence.",
        irofacade:
          "Pour un mur extérieur, utilisez IROFAÇADE : résiste aux intempéries, couleur longue durée et séchage rapide. Préparez le mur avec IROCRYL avant.",
      },
      disclaimer: "Suggestions automatiques basées sur la gamme PAINTIRO.",
    },
    solutions: {
      eyebrow: "Solutions",
      title: "Des solutions pour chaque projet",
      viewAll: "Toutes les solutions",
      intro: "De la première couche de fixateur à la dernière touche de couleur, une réponse PAINTIRO pour chaque support.",
      scrollHint: "Défiler",
      cta: "Trouver un distributeur",
      productLabel: "Recommandé",
      items: [
        { icon: "interior", title: "Intérieur", text: "Des finitions parfaites pour vos pièces.", details: "Salons, chambres et cuisines méritent une finition lisse, lessivable et riche en couleur, couche après couche.", image: "/solutions/interior.webp", productId: "irovella" },
        { icon: "exterior", title: "Extérieur", text: "Une protection durable des façades.", details: "Pluie, soleil et vent : une peinture façade qui résiste aux intempéries, garde sa couleur des années et sèche vite.", image: "/solutions/exterior.webp", productId: "irofacade" },
        { icon: "ceiling", title: "Plafonds", text: "Des plafonds lumineux, sans raccord.", details: "Un blanc mat profond, facile à appliquer, qui ne goutte pas et sèche en un film tendu sans raccord.", image: "/solutions/ceiling.webp", productId: "plafonya" },
        { icon: "renovation", title: "Rénovation", text: "Une nouvelle vie pour les vieux murs.", details: "Unifiez les murs fatigués, tachés ou irréguliers avec un fixateur 98 % d’opacité avant la finition.", image: "/solutions/renovation.webp", productId: "fix-one" },
        { icon: "primer", title: "Préparation", text: "Fixateurs et primaires qui tiennent.", details: "Les supports farineux ou poreux sont fixés et protégés pour que la peinture accroche et dure.", image: "/solutions/preparation.webp", productId: "irocryl-4l" },
        { icon: "pro", title: "Professionnels", text: "Grands formats pour les chantiers.", details: "Formats 18 et 20 kg, qualité constante d’un lot à l’autre, pensés pour les peintres qui travaillent chaque jour.", image: "/solutions/professionals.webp", productId: "irofacade" },
      ],
    },
    colors: {
      eyebrow: "Couleurs",
      title: "Des couleurs qui inspirent",
      intro: "Ouvrez le nuancier PAINTIRO et choisissez une teinte : toute la pièce prend sa couleur.",
      hint: "Cliquez une carte · touches ← →",
      families: "Familles de couleurs",
      explore: "Trouver cette couleur",
      selected: "Couleur choisie",
      copy: "Copier le code",
      copied: "Copié",
      familyNames: {
        whites: "Blancs",
        beiges: "Beiges",
        greys: "Gris",
        blues: "Bleus",
        greens: "Verts",
        reds: "Rouges",
      },
    },
    visualizer: {
      eyebrow: "Simulateur",
      title: "Voyez la couleur chez vous",
      text: "Choisissez une teinte et une finition, puis faites glisser le curseur pour comparer avant et après.",
      chooseColor: "Choisir une couleur",
      finish: "Finition",
      finishes: { matte: "Mat", satin: "Satiné", gloss: "Brillant" },
      before: "Avant",
      after: "Après",
      rooms: { living: "Salon", dining: "Salle à manger", bedroom: "Chambre" },
      sliderLabel: "Comparer avant et après",
      cta: "Trouver cette couleur",
    },
    why: {
      eyebrow: "Pourquoi PAINTIRO",
      title: "Pourquoi choisir PAINTIRO ?",
      items: [
        { icon: "quality", title: "Qualité premium", text: "Des matières premières de qualité pour un résultat parfait." },
        { icon: "performance", title: "Haute performance", text: "Une couverture exceptionnelle et une longue durabilité." },
        { icon: "expertise", title: "Expertise", text: "Des années d’expérience et un savoir-faire professionnel." },
        { icon: "innovation", title: "Innovation", text: "Des formules avancées, plus performantes." },
        { icon: "eco", title: "Éco-responsable", text: "Formules à base d’eau, faible odeur." },
      ],
      stats: [
        { value: 25, suffix: "+", label: "Années d’expérience" },
        { value: 500, suffix: "+", label: "Produits de qualité" },
        { value: 1000, suffix: "+", label: "Distributeurs de confiance" },
      ],
    },
    articles: {
      eyebrow: "Journal",
      title: "Derniers articles",
      viewAll: "Tous les articles",
      previous: "Articles précédents",
      next: "Articles suivants",
      items: [
        { tag: "Conseils", title: "Bien choisir la finition de sa peinture", date: "2 octobre 2026", image: "/frames/frame_0001.webp" },
        { tag: "Inspiration", title: "Les couleurs qui font les intérieurs de la saison", date: "24 septembre 2026", image: "/frames/frame_0140.webp" },
        { tag: "Projets", title: "Peindre une façade pour qu’elle dure", date: "15 septembre 2026", image: "/frames/frame_0150.webp" },
        { tag: "Produits", title: "Pourquoi un fixateur change tout", date: "6 septembre 2026", image: "/frames/frame_0058.webp" },
        { tag: "Conseils", title: "Préparer un mur farineux avant de peindre", date: "28 août 2026", image: "/frames/frame_0110.webp" },
        { tag: "Projets", title: "Peindre un plafond sans coulures", date: "19 août 2026", image: "/frames/frame_0033.webp" },
      ],
    },
    about: {
      eyebrow: "À propos",
      title: "À propos de PAINTIRO",
      chapters: [
        { word: "Passion", text: "La couleur est notre métier. Chaque formule PAINTIRO naît de l’amour des beaux murs.", image: "/frames/frame_0230.webp" },
        { word: "Qualité", text: "Des matières premières de qualité pour une finition parfaite, couche après couche.", image: "/frames/frame_0058.webp" },
        { word: "Protection", text: "Des peintures et fixateurs qui protègent vos murs du temps, de l’humidité et des intempéries.", image: "/frames/frame_0150.webp" },
      ],
      film: "Voir le film PAINTIRO",
      cta: "Découvrir PAINTIRO",
      play: "Lire le film PAINTIRO",
      closeVideo: "Fermer la vidéo",
    },
    distributor: {
      eyebrow: "Distributeurs",
      title: "Trouver PAINTIRO près de chez vous",
      text: "Choisissez votre wilaya sur la carte pour voir nos distributeurs, magasins et showrooms.",
      placeholder: "Rechercher une wilaya ou une ville",
      distributors: "points de vente",
      wilayas: "wilayas",
      allAlgeria: "Toute l’Algérie",
      listTitle: "Wilayas avec PAINTIRO",
      directions: "Itinéraire",
      call: "Appeler",
      none: "Pas encore de point de vente dans cette wilaya.",
      nearest: "Le plus proche",
      noResults: "Aucune wilaya ou ville trouvée.",
      types: { distributor: "Distributeur", store: "Magasin", showroom: "Showroom" },
      mapLabel: "Carte de l’Algérie avec les points de vente PAINTIRO",
      zoomIn: "Zoomer",
      zoomOut: "Dézoomer",
      attribution: "Données cartographiques © contributeurs OpenStreetMap, geoBoundaries",
    },
    newsletter: {
      title: "Restez informé",
      text: "Inscrivez-vous pour recevoir conseils, nouveautés et offres exclusives.",
      placeholder: "Votre adresse e-mail",
      button: "S’inscrire",
      success: "Merci ! Vous êtes inscrit.",
      invalid: "Veuillez saisir une adresse e-mail valide.",
    },
    footer: {
      description: "Peintures et revêtements premium pour la beauté, la protection et la performance.",
      columns: [
        {
          title: "Produits",
          links: [
            { label: "Peintures intérieures", href: "#solutions" },
            { label: "Peintures plafond", href: "#solutions" },
            { label: "Fixateurs", href: "#solutions" },
            { label: "Primaires", href: "#solutions" },
            { label: "Peintures façade", href: "#solutions" },
          ],
        },
        {
          title: "Couleurs",
          links: [
            { label: "Couleurs populaires", href: "#colors" },
            { label: "Familles de couleurs", href: "#colors" },
            { label: "Inspiration", href: "#articles" },
          ],
        },
        {
          title: "Solutions",
          links: [
            { label: "Intérieur", href: "#solutions" },
            { label: "Extérieur", href: "#solutions" },
            { label: "Rénovation", href: "#solutions" },
            { label: "Professionnels", href: "#solutions" },
          ],
        },
        {
          title: "Entreprise",
          links: [
            { label: "À propos", href: "#brand" },
            { label: "Pourquoi PAINTIRO", href: "#why" },
            { label: "Journal", href: "#articles" },
          ],
        },
        {
          title: "Assistance",
          links: [
            { label: "Trouver un distributeur", href: "#contact" },
            { label: "Nous contacter", href: "#contact" },
            { label: "Newsletter", href: "#newsletter" },
          ],
        },
      ],
      rights: "Tous droits réservés.",
      social: "Suivre PAINTIRO",
      backToTop: "Haut de page",
    },
  },
};
