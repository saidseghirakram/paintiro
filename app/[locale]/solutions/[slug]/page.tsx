import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryView from "@/components/catalog/CategoryView";
import SubpageHeader from "@/components/catalog/SubpageHeader";
import Footer from "@/components/Footer";
import { CATEGORY_SLUGS, isCategorySlug } from "@/lib/catalog";
import { content, isLocale } from "@/lib/content";
import { catalogContent } from "@/lib/content-catalog";
import { sectionsContent } from "@/lib/content-sections";

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/solutions/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCategorySlug(slug)) return {};
  const solution = sectionsContent[locale].solutions.items.find((item) => item.slug === slug);
  if (!solution) return {};
  return {
    title: `${solution.title} — PAINTIRO`,
    description: solution.details,
    alternates: { languages: { en: `/en/solutions/${slug}`, fr: `/fr/solutions/${slug}` } },
  };
}

/** /[locale]/solutions/[slug] — every product of one solution (Interior, Exterior...). */
export default async function SolutionPage({ params }: PageProps<"/[locale]/solutions/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCategorySlug(slug)) notFound();

  const t = content[locale];
  const s = sectionsContent[locale];
  const c = catalogContent[locale];
  const hasLogo = existsSync(path.join(process.cwd(), "public", "logo.png"));

  return (
    <>
      <SubpageHeader
        locale={locale}
        hasLogo={hasLogo}
        backHref={`/${locale}#solutions`}
        backLabel={c.home}
        homeLabel={t.nav.home}
        ctaLabel={c.distributor}
        languageLabel={t.nav.language}
        path={`/solutions/${slug}`}
        tone="dark"
        hideBelowFold
      />
      <main>
        <CategoryView locale={locale} initialSlug={slug} solutions={s.solutions.items} copy={c} />
      </main>
      <Footer
        content={s.footer}
        locale={locale}
        languageLabel={t.nav.language}
        hasLogo={hasLogo}
        linkPrefix={`/${locale}`}
        path={`/solutions/${slug}`}
      />
    </>
  );
}
