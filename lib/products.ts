/**
 * Product catalogue data shared by every section (language-neutral).
 * Texts per language live in lib/content.ts (`products`, same order as this list).
 */

export type ProductId =
  | "irovella"
  | "plafonya"
  | "fix-one"
  | "irocryl-1l"
  | "irocryl-4l"
  | "irofacade";

export type BadgeKey = "bestSeller" | "new" | "recommended";

export type ProductData = {
  id: ProductId;
  name: string;
  /** Transparent WebP in /public/products. */
  image: string;
  /** Intrinsic size of the image, used by next/image. */
  width: number;
  height: number;
  badge: BadgeKey;
};

export const PRODUCT_DATA: ProductData[] = [
  { id: "irovella", name: "IROVELLA", image: "/products/irovella.webp", width: 1019, height: 1000, badge: "bestSeller" },
  { id: "plafonya", name: "PLAFONYA", image: "/products/plafonya.webp", width: 1023, height: 1000, badge: "recommended" },
  { id: "fix-one", name: "FIX-ONE", image: "/products/fix-one.webp", width: 1023, height: 1000, badge: "bestSeller" },
  { id: "irocryl-1l", name: "IROCRYL 1L", image: "/products/irocryl-1l.webp", width: 381, height: 1000, badge: "new" },
  { id: "irocryl-4l", name: "IROCRYL 4L", image: "/products/irocryl-4l.webp", width: 909, height: 1000, badge: "recommended" },
  { id: "irofacade", name: "IROFAÇADE", image: "/products/irofacade.webp", width: 1020, height: 1000, badge: "new" },
];

export function getProduct(id: ProductId): ProductData {
  const product = PRODUCT_DATA.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown product ${id}`);
  return product;
}

export function getProductIndex(id: ProductId): number {
  return PRODUCT_DATA.findIndex((p) => p.id === id);
}
