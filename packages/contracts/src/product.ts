import { z } from "zod";
import { searchTermSchema } from "./search";
import { MONEY_PATTERN, moneyToCents } from "./money";
import { CATALOG_SORTS, PRODUCT_STATUSES } from "./catalog";

/** Status filter for an admin list — the statuses plus "any status". */
export const PRODUCT_STATUS_FILTERS = ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ProductStatusFilter = (typeof PRODUCT_STATUS_FILTERS)[number];

export const PRODUCTS_PAGE_SIZE = 10;

// Mirrors the CHECK constraint in database/migrations/008_create_products.sql, so a bad value
// becomes a field message instead of a 500.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const STOCK_PATTERN = /^\d{1,7}$/;
const MAX_NAME_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_ALT_LENGTH = 200;

const MONEY_MESSAGE = "Enter an amount like 159 or 159.00.";

/**
 * The create/edit contract, shared by the admin form and the API.
 *
 * Input is all strings (what an `<input>` produces); output has money as integer cents and empty
 * optional selects as `null` — the shape the database wants.
 */
export const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Product name is required.")
      .max(MAX_NAME_LENGTH, `Keep the name under ${MAX_NAME_LENGTH} characters.`),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .regex(SLUG_PATTERN, "Lowercase letters, numbers and single hyphens only."),
    description: z
      .string()
      .trim()
      .max(
        MAX_DESCRIPTION_LENGTH,
        `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`,
      ),
    price: z.string().trim().regex(MONEY_PATTERN, MONEY_MESSAGE).transform(moneyToCents),
    compareAtPrice: z
      .string()
      .trim()
      .refine((value) => value === "" || MONEY_PATTERN.test(value), MONEY_MESSAGE)
      .transform((value) => (value === "" ? null : moneyToCents(value))),
    stock: z
      .string()
      .trim()
      .regex(STOCK_PATTERN, "Enter a whole number of units.")
      .transform(Number),
    status: z.enum(PRODUCT_STATUSES),
    categoryId: z.string().transform((value) => (value === "" ? null : value)),
    brandId: z.string().transform((value) => (value === "" ? null : value)),
    images: z.array(
      z.object({
        url: z.string().trim().url("Enter a full image URL, starting with https://"),
        alt: z.string().trim().max(MAX_ALT_LENGTH),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    if (values.compareAtPrice !== null && values.compareAtPrice <= values.price) {
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "Compare-at price must be higher than the price.",
      });
    }
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

export const productStatusSchema = z.object({ status: z.enum(PRODUCT_STATUSES) });

/** A product as an admin list row needs it. */
export interface ProductRowDto {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  stock: number;
  status: (typeof PRODUCT_STATUSES)[number];
  categoryName: string | null;
  brandName: string | null;
  thumbnailUrl: string | null;
  updatedAt: string;
}

/** A product as the edit form needs it, with money still in cents. */
export interface ProductEditDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  status: (typeof PRODUCT_STATUSES)[number];
  categoryId: string | null;
  brandId: string | null;
  images: { url: string; alt: string | null }[];
}

export type ProductStatsDto = Record<(typeof PRODUCT_STATUSES)[number], number>;

const MAX_PAGE = 10_000;

/**
 * Admin list parameters — a different list from the storefront's, so a different schema.
 *
 * Every field uses `.catch()`, so a hand-edited URL falls back to its default instead of throwing.
 */
export const productListParamsSchema = z.object({
  q: searchTermSchema,
  status: z.enum(PRODUCT_STATUS_FILTERS).catch("ALL"),
  sort: z.enum(CATALOG_SORTS).catch("newest"),
  page: z.coerce.number().int().min(1).max(MAX_PAGE).catch(1),
});

export type ProductListParams = z.output<typeof productListParamsSchema>;
