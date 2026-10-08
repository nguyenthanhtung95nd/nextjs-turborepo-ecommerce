import { buildListHref } from "@repo/ui/list-href";
import type { CatalogListParams } from "@repo/contracts";

export const PRODUCTS_PATH = "/products";
export const SEARCH_PATH = "/search";

const DEFAULTS: CatalogListParams = {
  q: "",
  category: "",
  brand: "",
  priceMin: 0,
  priceMax: 0,
  inStock: "0",
  sort: "newest",
  page: 1,
};

/**
 * Where a listing lives, and what its path already says.
 *
 * The same listing is reached four ways — `/products`, `/search`, `/categories/{slug}` and
 * `/brands/{slug}` — and every filter link has to come back to the route the shopper is on. A
 * category page whose "In stock" link pointed at `/products` would quietly throw away the page
 * they were browsing.
 */
export interface ListingRoute {
  path: string;
  /**
   * Filters the path itself expresses.
   *
   * On `/categories/displays` the category is in the path, so it must never also appear in the
   * query string. Treating it as that route's *default* is all it takes: `buildListHref` already
   * drops anything equal to its default, so `/categories/displays?inStock=1` falls out with no
   * special case anywhere.
   */
  implied: Partial<CatalogListParams>;
}

export const productsRoute: ListingRoute = { path: PRODUCTS_PATH, implied: {} };
export const searchRoute: ListingRoute = { path: SEARCH_PATH, implied: {} };

export function categoryRoute(slug: string): ListingRoute {
  return { path: `/categories/${slug}`, implied: { category: slug } };
}

export function brandRoute(slug: string): ListingRoute {
  return { path: `/brands/${slug}`, implied: { brand: slug } };
}

/**
 * A listing URL on `route`, carrying the current filters plus the ones being changed.
 *
 * Defaults and anything the path already implies are dropped, so an unfiltered view is a bare
 * path and a shared link holds only what the recipient needs.
 */
export function listingHref(
  route: ListingRoute,
  params: CatalogListParams,
  overrides: Partial<CatalogListParams> = {},
): string {
  return buildListHref(route.path, { ...DEFAULTS, ...route.implied }, params, overrides);
}

/**
 * Everything back to defaults except the sort, which is a preference rather than a filter, and
 * the search term, which is the whole reason a `/search` page exists.
 *
 * Filters implied by the path stay too — "clear filters" on a category page means "show me all of
 * this category", not "take me somewhere else".
 */
export function clearedHref(route: ListingRoute, params: CatalogListParams): string {
  return listingHref(route, params, {
    category: "",
    brand: "",
    priceMin: 0,
    priceMax: 0,
    inStock: "0",
    page: 1,
    ...route.implied,
  });
}

/**
 * How many filters the shopper has applied — drives the "clear" affordances and the drawer badge.
 *
 * A filter the path implies is not counted: it is the page, not something applied to it, and a
 * category page reporting "1 filter" before anything is touched would be telling a shopper their
 * results are narrowed by something they did.
 *
 * The search term is not counted either; the heading already says what was searched for.
 */
export function activeFilterCount(route: ListingRoute, params: CatalogListParams): number {
  return [
    params.category !== "" && route.implied.category === undefined,
    params.brand !== "" && route.implied.brand === undefined,
    params.priceMin > 0,
    params.priceMax > 0,
    params.inStock === "1",
  ].filter(Boolean).length;
}
