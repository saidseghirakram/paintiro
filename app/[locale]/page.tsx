import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import AiAssistant from "@/components/AiAssistant";
import Footer from "@/components/Footer";
import ProductShowcase from "@/components/ProductShowcase";
import Loader from "@/components/Loader";
import Navbar from "@/components/Navbar";
import About from "@/components/sections/About";
import Articles from "@/components/sections/Articles";
import Audience from "@/components/sections/Audience";
import ColorCities from "@/components/sections/ColorCities";
import Colors from "@/components/sections/Colors";
import Distributor from "@/components/sections/Distributor";
import Factory from "@/components/sections/Factory";
import Newsletter from "@/components/sections/Newsletter";
import PaintWall from "@/components/sections/PaintWall";
import RoomVisualizer from "@/components/sections/RoomVisualizer";
import Solutions from "@/components/sections/Solutions";
import TenYearTest from "@/components/sections/TenYearTest";
import WhyPaintiro from "@/components/sections/WhyPaintiro";
import DripDivider from "@/components/ui/DripDivider";
import { content, isLocale } from "@/lib/content";
import { experienceContent } from "@/lib/content-experience";
import { sectionsContent } from "@/lib/content-sections";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = content[locale];
  const s = sectionsContent[locale];
  const x = experienceContent[locale];
  const hasLogo = existsSync(path.join(process.cwd(), "public", "logo.png"));

  return (
    <>
      <Loader line={t.loader.line} />
      <Navbar locale={locale} nav={t.nav} hasLogo={hasLogo} />

      <main>
        {/* 01–03 Hero: scroll-controlled 3D product showcase */}
        <ProductShowcase hero={t.hero} products={t.products} />
        {/* Interactive: the visitor paints a raw, cracked wall */}
        <PaintWall content={x.wall} />
        <DripDivider paint="#E8372C" background="#141414" />
        {/* Made in our factory: scroll-driven production line */}
        <Factory content={x.factory} />
        <DripDivider paint="#141414" background="#F6F5F2" />
        {/* 07 Solutions */}
        <Solutions content={s.solutions} />
        {/* 08 Colors */}
        <Colors content={s.colors} locale={locale} />
        {/* Algeria in color: city palettes, horizontal journey */}
        <ColorCities content={x.cities} locale={locale} />
        {/* Room color visualizer (before / after) */}
        <RoomVisualizer content={s.visualizer} locale={locale} />
        {/* The 10-year test: ordinary paint vs PAINTIRO */}
        <TenYearTest content={x.test} />
        {/* 09 Why PAINTIRO */}
        <WhyPaintiro content={s.why} />
        {/* 10 Latest articles */}
        <Articles content={s.articles} />
        {/* 11 About */}
        <About content={s.about} stats={s.why.stats} />
        {/* Who are you? Homeowner / painter / distributor */}
        <Audience content={x.audience} />
        {/* 12 Find a distributor */}
        <Distributor content={s.distributor} />
        {/* 13 Newsletter */}
        <Newsletter content={s.newsletter} />
      </main>

      {/* 14 Footer */}
      <Footer content={s.footer} locale={locale} languageLabel={t.nav.language} hasLogo={hasLogo} />

      {/* 06 PAINTIRO AI (floating) */}
      <AiAssistant content={s.ai} />
    </>
  );
}
