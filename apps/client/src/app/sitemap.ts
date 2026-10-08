import type { MetadataRoute } from "next";
import { listFilterOptions, listSitemapProducts } from "@/lib/catalog/queries";
import { absoluteUrl } from "@/lib/site-url";

/** Regenerated with the same cadence as the pages it lists. */
export const revalidate = 3600;

/**
 * Every page worth indexing.
 *
 * Built from the database rather than hand-maintained, so a product published in the admin
 * appears here on the next revalidation and a product archived there disappears — a hand-written
 * sitemap is a list of 404s waiting to happen.
 *
 * Only PUBLISHED products and only facets that have one, because every query here goes through
 * the same filters the storefront itself uses. Submitting a draft's URL to a search engine would
 * leak an unreleased product's name through the sitemap even though the page itself 404s.
 *
 * `/search`, `/login`, `/register` and `/account` are deliberately absent; see `robots.ts`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, facets] = await Promise.all([listSitemapProducts(), listFilterOptions()]);
  const now = new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: now, changeFrequency: "daily", priority: 0.9 },

    ...facets.categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...facets.brands.map((brand) => ({
      url: absoluteUrl(`/brands/${brand.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),

    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
