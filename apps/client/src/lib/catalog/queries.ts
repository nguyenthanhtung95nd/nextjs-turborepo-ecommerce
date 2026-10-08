import { cache } from "react";
import { ApiError, apiFetch } from "@repo/api-client";
import type {
  CatalogListParams,
  TaxonomyDto,
  FacetDto,
  PageDto,
  ProductCardDto,
  ProductDetailDto,
} from "@repo/contracts";

export type CatalogProduct = ProductCardDto;
export type FacetOption = FacetDto;
export type CategoryEntry = TaxonomyDto;
export type ProductImage = ProductDetailDto["images"][number];

export interface CatalogPage {
  products: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
}

export type ProductDetail = Omit<ProductDetailDto, "updatedAt">;

export interface SitemapProduct {
  slug: string;
  updatedAt: Date;
}

/** How long a catalog response may be reused. Matches the pages that render it. */
const REVALIDATE_SECONDS = 60;

function toQuery(params: Partial<CatalogListParams>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== 0) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

function listProductPage(params: Partial<CatalogListParams>, tag: string) {
  return apiFetch<PageDto<ProductCardDto>>(`/products${toQuery(params)}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
  });
}

export async function listProducts(params: CatalogListParams): Promise<CatalogPage> {
  const page = await listProductPage(params, "products");
  return { products: page.items, total: page.total, page: page.page, pageCount: page.pageCount };
}

/** The newest published products, for the home page. */
export async function listLatestProducts(limit: number): Promise<CatalogProduct[]> {
  const page = await listProductPage({ sort: "newest" }, "products");
  return page.items.slice(0, limit);
}

/** @returns `null` when no published product has that slug, which the page turns into a 404. */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    return await apiFetch<ProductDetailDto>(`/products/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["products"] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

interface SitemapProductDto {
  slug: string;
  updatedAt: string;
}

export const listSitemapProducts = cache(async (): Promise<SitemapProduct[]> => {
  const records = await apiFetch<SitemapProductDto[]>("/products/slugs", {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["products"] },
  });
  return records.map((record) => ({ slug: record.slug, updatedAt: new Date(record.updatedAt) }));
});

export async function listPublishedSlugs(): Promise<string[]> {
  const records = await listSitemapProducts();
  return records.map((record) => record.slug);
}

/**
 * Categories that have something to show.
 *
 * Wrapped in React's `cache` because the layout and the page both need this list.
 */
export const listCategoryEntries = cache(async (): Promise<CategoryEntry[]> =>
  apiFetch<TaxonomyDto[]>("/categories?hasPublished=1", {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["categories"] },
  }),
);

const listBrandEntries = cache(async (): Promise<FacetOption[]> =>
  apiFetch<FacetDto[]>("/brands?hasPublished=1", {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["brands"] },
  }),
);

export const listFilterOptions = cache(
  async (): Promise<{ categories: FacetOption[]; brands: FacetOption[] }> => {
    const [categories, brands] = await Promise.all([listCategoryEntries(), listBrandEntries()]);
    return { categories, brands };
  },
);

/** @returns `null` when the category does not exist or has nothing published. */
export const getCategoryBySlug = cache(async (slug: string): Promise<FacetOption | null> => {
  const categories = await listCategoryEntries();
  return categories.find((category) => category.slug === slug) ?? null;
});

/** @returns `null` when the brand does not exist or has nothing published. */
export const getBrandBySlug = cache(async (slug: string): Promise<FacetOption | null> => {
  const brands = await listBrandEntries();
  return brands.find((brand) => brand.slug === slug) ?? null;
});
