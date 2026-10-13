import type { NextRequest } from "next/server";
import { getCategoryProducts, isCategorySlug } from "@/lib/catalog";
import { DEFAULT_LOCALE, isLocale } from "@/lib/content";

/** Simulated network latency while the catalogue is dummy data. Remove with the real backend. */
const FAKE_LATENCY_MS = 650;

/** GET /api/solutions/[slug]?locale=en → products of one solution category. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/solutions/[slug]">) {
  const { slug } = await ctx.params;
  if (!isCategorySlug(slug)) {
    return Response.json({ error: "Unknown category" }, { status: 404 });
  }

  const requested = request.nextUrl.searchParams.get("locale") ?? DEFAULT_LOCALE;
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));
  const products = await getCategoryProducts(slug, locale);
  return Response.json({ slug, products });
}
