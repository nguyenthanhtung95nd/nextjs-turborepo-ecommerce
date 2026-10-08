import { z } from "zod";
import { searchTermSchema } from "./search";

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CATALOG_SORTS = ["newest", "price-asc", "price-desc", "name-asc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

/** Twelve divides by 2, 3 and 4 — a full last row at every grid breakpoint. */
export const CATALOG_PAGE_SIZE = 12;

export const MAX_PRICE = 100_000;

const MAX_SLUG_LENGTH = 80;
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

/**
 * Catalog list parameters, as they appear in a URL or a query string.
 *
 * Every field uses `.catch()` so a hand-edited or hostile URL falls back to its default instead
 * of throwing.
 */
export const catalogListParamsSchema = z
  .object({
    q: searchTermSchema,
    category: z.string().trim().max(MAX_SLUG_LENGTH).catch(""),
    brand: z.string().trim().max(MAX_SLUG_LENGTH).catch(""),
    priceMin: z.coerce.number().min(0).max(MAX_PRICE).catch(0),
    priceMax: z.coerce.number().min(0).max(MAX_PRICE).catch(0),
    // Not `coerce.boolean()`: that reads the string "0" as true.
    inStock: z.enum(["0", "1"]).catch("0"),
    // Honoured only for callers holding `product:read`; ignored for everyone else. Absence
    // always means published, so a token can never widen the result by accident.
    status: z
      .enum(["ALL", ...PRODUCT_STATUSES] as const)
      .optional()
      .catch(undefined),
    // Clamped, because it reaches `take` in a database query.
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional().catch(undefined),
    sort: z.enum(CATALOG_SORTS).catch("newest"),
    page: z.coerce.number().int().min(1).max(MAX_PAGE).catch(1),
  })
  .transform((params) => {
    // A reversed range matches nothing, and an empty grid is a poor way to report a typo.
    const isReversed =
      params.priceMin > 0 && params.priceMax > 0 && params.priceMin > params.priceMax;
    return isReversed
      ? { ...params, priceMin: params.priceMax, priceMax: params.priceMin }
      : params;
  });

export type CatalogListParams = z.output<typeof catalogListParamsSchema>;

/** A product as a listing card needs it. Ids are strings — Postgres bigint is not serializable. */
export interface ProductCardDto {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  inStock: boolean;
  categoryName: string | null;
  brandName: string | null;
  imageUrl: string | null;
  imageAlt: string;
  stock: number;
  status: ProductStatus;
  updatedAt: string;
}

export interface ProductImageDto {
  url: string;
  alt: string;
}

export interface FacetDto {
  id: string;
  name: string;
  slug: string;
}

/** Everything a product detail page shows. */
export interface ProductDetailDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  category: FacetDto | null;
  brand: FacetDto | null;
  images: ProductImageDto[];
  updatedAt: string;
}

export interface PageDto<T> {
  items: T[];
  total: number;
  /** The page actually returned. Not always the one asked for — out-of-range pages are clamped. */
  page: number;
  pageCount: number;
}

/** A category or a brand. They are the same shape, and both endpoints return it. */
export interface TaxonomyDto extends FacetDto {
  /** Published products only — what a storefront tile counts. */
  productCount: number;
  /** Every status. A delete is refused while this is above zero (ON DELETE RESTRICT). */
  totalProductCount: number;
  updatedAt: string;
}
