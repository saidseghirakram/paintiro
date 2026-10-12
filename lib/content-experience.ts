/**
 * Texts of the "experience" sections (paint-the-wall, factory, 10-year test,
 * Algeria in color, audiences), EN / FR.
 *
 * Factory figures are PLACEHOLDERS: replace them with the real numbers of the plant.
 */
import type { Locale } from "./content";

export type ExperienceContent = {
  wall: {
    eyebrow: string;
    title: string;
    text: string;
    hint: string;
    hintTouch: string;
    painted: string;
    badge: string;
    cta: string;
  };
  factory: {
    eyebrow: string;
    title: string;
    intro: string;
    counterLabel: string;
    steps: { title: string; text: string; stat: string; statLabel: string }[];
    labels: {
      silos: [string, string, string];
      vat: string;
      tint: string;
      lab: string;
      filling: string;
      specs: [string, string, string];
    };
  };
  test: {
    eyebrow: string;
    title: string;
    text: string;
    ordinary: string;
    paintiro: string;
    yearsLabel: string;
    conditions: string[];
    verdict: string;
  };
  cities: {
    eyebrow: string;
    title: string;
    intro: string;
    cta: string;
    items: { city: string; line: string }[];
  };
  audience: {
    eyebrow: string;
    title: string;
    items: { title: string; text: string; cta: string; href: string }[];
  };
};

export const experienceContent: Record<Locale, ExperienceContent> = {
  en: {
    wall: {
      eyebrow: "Try it yourself",
      title: "Every wall deserves a second life.",
      text: "Cracks, stains, tired plaster: one PAINTIRO system and the wall is new again.",
      hint: "Move your roller to paint the wall",
      hintTouch: "Scroll to paint the wall",
      painted: "painted",
      badge: "IROVELLA · 1 coat",
      cta: "See how we make it",
    },
    factory: {
      eyebrow: "Made in our factory",
      title: "From raw mineral to your wall.",
      intro: "Every bucket of PAINTIRO is formulated, mixed, tested and filled in our own plant.",
      counterLabel: "liters produced while you scroll",
      steps: [
        { title: "Selected raw materials", text: "Titanium dioxide, mineral fillers and pure resins, weighed to the gram for every batch.", stat: "100%", statLabel: "traceable batches" },
        { title: "High-speed dispersion", text: "Pigments are dispersed until every particle is wrapped in resin: that is where coverage is born.", stat: "1 450", statLabel: "rpm dispersion" },
        { title: "Precision tinting", text: "Our tinting system doses each pigment by the drop, so your color is identical from one bucket to the next.", stat: "1 000+", statLabel: "shades on demand" },
        { title: "Laboratory control", text: "Opacity, viscosity, adhesion, drying time: no batch leaves the plant before passing the lab.", stat: "98%", statLabel: "opacity, tested" },
        { title: "Filled and sealed", text: "Filled, weighed, sealed and labeled: from our line straight to distributors in every wilaya.", stat: "58", statLabel: "wilayas delivered" },
      ],
      labels: { silos: ["TiO₂", "CaCO₃", "RESIN"], vat: "DISPERSION", tint: "TINTING", lab: "QUALITY LAB", filling: "FILLING", specs: ["OPACITY · 98%", "VISCOSITY · OK", "ADHESION · OK"] },
    },
    test: {
      eyebrow: "The 10-year test",
      title: "Scroll ten years of sun, rain and sand.",
      text: "Same façade, same weather. Only the paint changes.",
      ordinary: "Ordinary paint",
      paintiro: "PAINTIRO IROFAÇADE",
      yearsLabel: "Year",
      conditions: ["UV sun", "Rain", "Sand wind", "Heat"],
      verdict: "Ten years later, the color is still there.",
    },
    cities: {
      eyebrow: "Algeria in color",
      title: "Palettes born from our cities.",
      intro: "Five cities, five light moods, twenty PAINTIRO shades.",
      cta: "Try it in a room",
      items: [
        { city: "Algiers", line: "The white city, facing the blue sea." },
        { city: "Ghardaïa", line: "Ochre walls warmed by the M’zab sun." },
        { city: "Constantine", line: "Stone grey, suspended above the gorges." },
        { city: "Tlemcen", line: "Olive green and cream from Andalusian gardens." },
        { city: "Sahara", line: "Sand, brick and the pink of the evening dunes." },
      ],
    },
    audience: {
      eyebrow: "Who are you?",
      title: "A PAINTIRO answer for every hand.",
      items: [
        { title: "Homeowner", text: "Find your color, preview it in a room and get the right quantity.", cta: "Try a color", href: "#visualizer" },
        { title: "Painter & contractor", text: "Large formats, steady quality from batch to batch, technical support on site.", cta: "Talk to us", href: "#contact" },
        { title: "Distributor & store", text: "Join the network and bring PAINTIRO to your wilaya.", cta: "Become a distributor", href: "#contact" },
      ],
    },
  },
  fr: {
    wall: {
      eyebrow: "Essayez vous-même",
      title: "Chaque mur mérite une seconde vie.",
      text: "Fissures, taches, enduit fatigué : un système PAINTIRO et le mur est comme neuf.",
      hint: "Passez le rouleau pour peindre le mur",
      hintTouch: "Faites défiler pour peindre le mur",
      painted: "peint",
      badge: "IROVELLA · 1 couche",
      cta: "Voir comment on la fabrique",
    },
    factory: {
      eyebrow: "Fabriqué dans notre usine",
      title: "Du minéral brut à votre mur.",
      intro: "Chaque seau PAINTIRO est formulé, mélangé, testé et conditionné dans notre propre usine.",
      counterLabel: "litres produits pendant que vous défilez",
      steps: [
        { title: "Matières premières choisies", text: "Dioxyde de titane, charges minérales et résines pures, pesés au gramme pour chaque lot.", stat: "100%", statLabel: "lots traçables" },
        { title: "Dispersion haute vitesse", text: "Les pigments sont dispersés jusqu’à ce que chaque particule soit enrobée de résine : c’est là que naît le pouvoir couvrant.", stat: "1 450", statLabel: "tr/min de dispersion" },
        { title: "Teinte de précision", text: "Notre système dose chaque pigment à la goutte : votre couleur est identique d’un seau à l’autre.", stat: "1 000+", statLabel: "teintes à la demande" },
        { title: "Contrôle laboratoire", text: "Opacité, viscosité, adhérence, temps de séchage : aucun lot ne sort sans validation du laboratoire.", stat: "98%", statLabel: "d’opacité, testée" },
        { title: "Rempli et scellé", text: "Rempli, pesé, scellé et étiqueté : de notre ligne directement aux distributeurs de chaque wilaya.", stat: "58", statLabel: "wilayas livrées" },
      ],
      labels: { silos: ["TiO₂", "CaCO₃", "RÉSINE"], vat: "DISPERSION", tint: "TEINTE", lab: "LABORATOIRE", filling: "CONDITIONNEMENT", specs: ["OPACITÉ · 98%", "VISCOSITÉ · OK", "ADHÉRENCE · OK"] },
    },
    test: {
      eyebrow: "Le test des 10 ans",
      title: "Faites défiler dix ans de soleil, de pluie et de sable.",
      text: "Même façade, même climat. Seule la peinture change.",
      ordinary: "Peinture ordinaire",
      paintiro: "PAINTIRO IROFAÇADE",
      yearsLabel: "Année",
      conditions: ["Soleil UV", "Pluie", "Vent de sable", "Chaleur"],
      verdict: "Dix ans plus tard, la couleur est toujours là.",
    },
    cities: {
      eyebrow: "L’Algérie en couleurs",
      title: "Des palettes nées de nos villes.",
      intro: "Cinq villes, cinq lumières, vingt teintes PAINTIRO.",
      cta: "Essayer dans une pièce",
      items: [
        { city: "Alger", line: "La ville blanche, face à la mer bleue." },
        { city: "Ghardaïa", line: "Des murs ocre chauffés par le soleil du M’zab." },
        { city: "Constantine", line: "Le gris de la pierre, suspendu au-dessus des gorges." },
        { city: "Tlemcen", line: "Vert olive et crème des jardins andalous." },
        { city: "Sahara", line: "Le sable, la brique et le rose des dunes au soir." },
      ],
    },
    audience: {
      eyebrow: "Vous êtes ?",
      title: "Une réponse PAINTIRO pour chaque main.",
      items: [
        { title: "Particulier", text: "Trouvez votre couleur, essayez-la dans une pièce et calculez la bonne quantité.", cta: "Essayer une couleur", href: "#visualizer" },
        { title: "Peintre & entreprise", text: "Grands formats, qualité constante d’un lot à l’autre, assistance technique sur chantier.", cta: "Nous contacter", href: "#contact" },
        { title: "Distributeur & magasin", text: "Rejoignez le réseau et apportez PAINTIRO dans votre wilaya.", cta: "Devenir distributeur", href: "#contact" },
      ],
    },
  },
};
