import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailView from "@/components/catalog/ProductDetailView";
import SubpageHeader from "@/components/catalog/SubpageHeader";
import Footer from "@/components/Footer";
import { getProductDetail, getRelatedProducts, PRODUCT_IDS } from "@/lib/catalog";
import { content, isLocale } from "@/lib/content";
import { catalogContent } from "@/lib/content-catalog";
import { sectionsContent } from "@/lib/content-sections";

export function generateStaticParams() {
  return PRODUCT_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProductDetail(id, locale);
  if (!product) return {};
  return {
    title: `${product.name} — PAINTIRO`,
    description: product.description,
    alternates: { languages: { en: `/en/products/${id}`, fr: `/fr/products/${id}` } },
    openGraph: { images: [product.image] },
  };
}

/** /[locale]/products/[id] — product page with its full technical sheet. */
export default async function ProductPage({ params }: PageProps<"/[locale]/products/[id]">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const product = await getProductDetail(id, locale);
  if (!product) notFound();
  const related = await getRelatedProducts(id, locale);

  const t = content[locale];
  const s = sectionsContent[locale];
  const c = catalogContent[locale];
  const hasLogo = existsSync(path.join(process.cwd(), "public", "logo.png"));
  const backSlug = product.categories[0];

  return (
    <>
      <SubpageHeader
        locale={locale}
        hasLogo={hasLogo}
        backHref={`/${locale}/solutions/${backSlug}`}
        backLabel={s.solutions.items.find((item) => item.slug === backSlug)?.title ?? c.back}
        homeLabel={t.nav.home}
        ctaLabel={c.distributor}
        languageLabel={t.nav.language}
        path={`/products/${id}`}
      />
      <main>
        <ProductDetailView locale={locale} product={product} related={related} solutions={s.solutions.items} copy={c} />
      </main>
      <Footer
        content={s.footer}
        locale={locale}
        languageLabel={t.nav.language}
        hasLogo={hasLogo}
        linkPrefix={`/${locale}`}
        path={`/products/${id}`}
      />
    </>
  );
}
