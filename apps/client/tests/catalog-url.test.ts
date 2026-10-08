import { describe, expect, it } from "vitest";
import type { CatalogListParams } from "@repo/contracts";
import {
  activeFilterCount,
  brandRoute,
  categoryRoute,
  clearedHref,
  listingHref,
  productsRoute,
  searchRoute,
} from "@/lib/catalog/url";

const BASE: CatalogListParams = {
  q: "",
  category: "",
  brand: "",
  priceMin: 0,
  priceMax: 0,
  inStock: "0",
  sort: "newest",
  page: 1,
};

const FILTERED: CatalogListParams = {
  ...BASE,
  category: "displays",
  brand: "dell",
  priceMin: 50,
  priceMax: 900,
  inStock: "1",
  sort: "price-asc",
  page: 2,
};

describe("listingHref on /products", () => {
  it("is a bare path when nothing is filtered", () => {
    expect(listingHref(productsRoute, BASE)).toBe("/products");
  });

  // A shared link should carry what the recipient needs and nothing else — no `?page=1&sort=newest`
  // trailing every URL in the UI.
  it("leaves defaults out of the query string", () => {
    expect(listingHref(productsRoute, BASE, { category: "audio" })).toBe(
      "/products?category=audio",
    );
  });

  it("keeps the other filters when one changes", () => {
    expect(listingHref(productsRoute, FILTERED, { page: 3 })).toBe(
      "/products?category=displays&brand=dell&priceMin=50&priceMax=900&inStock=1&sort=price-asc&page=3",
    );
  });

  it("drops a filter that is set back to its default", () => {
    expect(listingHref(productsRoute, FILTERED, { brand: "", page: 1 })).toBe(
      "/products?category=displays&priceMin=50&priceMax=900&inStock=1&sort=price-asc",
    );
  });

  it("produces the same URL for the same filters regardless of how they were reached", () => {
    const viaCategory = listingHref(productsRoute, BASE, { category: "audio", brand: "sony" });
    const viaBrand = listingHref(productsRoute, { ...BASE, brand: "sony" }, { category: "audio" });
    expect(viaCategory).toBe(viaBrand);
  });
});

describe("listingHref on a landing page", () => {
  /**
   * The point of the whole `implied` mechanism: the path already says "displays", so repeating it
   * in the query would produce `/categories/displays?category=displays`.
   */
  it("omits the filter the path already expresses", () => {
    const route = categoryRoute("displays");
    expect(listingHref(route, { ...BASE, category: "displays" })).toBe("/categories/displays");
  });

  it("keeps the shopper on the landing page as they filter", () => {
    const route = categoryRoute("displays");
    const params = { ...BASE, category: "displays" };
    expect(listingHref(route, params, { inStock: "1" })).toBe("/categories/displays?inStock=1");
  });

  it("still carries filters the path does not express", () => {
    const route = categoryRoute("displays");
    const params = { ...BASE, category: "displays", brand: "dell", page: 3 };
    expect(listingHref(route, params)).toBe("/categories/displays?brand=dell&page=3");
  });

  it("does the same for brands", () => {
    const route = brandRoute("dell");
    const params = { ...BASE, brand: "dell", category: "displays" };
    expect(listingHref(route, params)).toBe("/brands/dell?category=displays");
  });
});

describe("listingHref on /search", () => {
  it("carries the term, because the path does not", () => {
    expect(listingHref(searchRoute, { ...BASE, q: "keyboard" })).toBe("/search?q=keyboard");
  });

  it("narrows the search rather than replacing it", () => {
    const params = { ...BASE, q: "monitor" };
    expect(listingHref(searchRoute, params, { inStock: "1" })).toBe("/search?q=monitor&inStock=1");
  });

  it("escapes a term that would otherwise break the query string", () => {
    expect(listingHref(searchRoute, { ...BASE, q: "a&b=c" })).toBe("/search?q=a%26b%3Dc");
  });
});

describe("clearedHref", () => {
  /** Sort is a preference, not a filter: clearing the filters should not reorder the grid too. */
  it("removes the filters but keeps the sort", () => {
    expect(clearedHref(productsRoute, FILTERED)).toBe("/products?sort=price-asc");
  });

  it("returns to page 1", () => {
    expect(clearedHref(productsRoute, FILTERED)).not.toContain("page=");
  });

  it("keeps the search term, which is the reason the page exists", () => {
    const params = { ...BASE, q: "monitor", inStock: "1" as const, priceMin: 50 };
    expect(clearedHref(searchRoute, params)).toBe("/search?q=monitor");
  });

  /** "Clear filters" on a category page means "all of this category", not "leave". */
  it("stays on the landing page", () => {
    const route = categoryRoute("displays");
    const params = { ...BASE, category: "displays", brand: "dell", inStock: "1" as const };
    expect(clearedHref(route, params)).toBe("/categories/displays");
  });
});

describe("activeFilterCount", () => {
  it("is zero for an unfiltered list", () => {
    expect(activeFilterCount(productsRoute, BASE)).toBe(0);
  });

  it("counts each filter once", () => {
    expect(activeFilterCount(productsRoute, FILTERED)).toBe(5);
  });

  it("does not count the sort or the page", () => {
    expect(activeFilterCount(productsRoute, { ...BASE, sort: "name-asc", page: 7 })).toBe(0);
  });

  /** The heading already says what was searched for. */
  it("does not count the search term", () => {
    expect(activeFilterCount(searchRoute, { ...BASE, q: "keyboard" })).toBe(0);
  });

  /**
   * A category page reporting "1 filter" before the shopper touches anything would be telling
   * them their results are narrowed by something they did.
   */
  it("does not count a filter the path implies", () => {
    const route = categoryRoute("displays");
    expect(activeFilterCount(route, { ...BASE, category: "displays" })).toBe(0);
    expect(activeFilterCount(route, { ...BASE, category: "displays", inStock: "1" })).toBe(1);
  });

  it("still counts a brand on a category page", () => {
    const route = categoryRoute("displays");
    expect(activeFilterCount(route, { ...BASE, category: "displays", brand: "dell" })).toBe(1);
  });
});
