import { buildListHref } from "@repo/ui/list-href";
import type { ProductListParams } from "@repo/contracts";

export const PRODUCTS_ROUTE = "/products";

const DEFAULTS: ProductListParams = { q: "", status: "ALL", sort: "newest", page: 1 };

export function productsHref(
  params: ProductListParams,
  overrides: Partial<ProductListParams> = {},
): string {
  return buildListHref(PRODUCTS_ROUTE, DEFAULTS, params, overrides);
}

/** True when any filter is narrowing the list — drives the "clear filters" affordances. */
export function hasActiveFilters(params: ProductListParams): boolean {
  return params.q !== "" || params.status !== "ALL";
}
