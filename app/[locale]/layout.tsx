import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import SmoothScroll from "@/components/SmoothScroll";
import { content, isLocale, LOCALES } from "@/lib/content";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { meta } = content[locale];
  return {
    title: meta.title,
    description: meta.description,
    alternates: { languages: { en: "/en", fr: "/fr" } },
  };
}

export const viewport: Viewport = {
  themeColor: "#e8372c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={fontVariables}>
      <body className="m-0 overflow-x-hidden bg-surface font-body text-ink antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
