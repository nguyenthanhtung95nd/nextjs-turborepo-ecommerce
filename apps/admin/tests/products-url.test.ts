import { describe, expect, it } from "vitest";
import type { ProductListParams } from "@repo/contracts";
import { hasActiveFilters, productsHref } from "@/features/products/url";

const DEFAULTS: ProductListParams = { q: "", status: "ALL", sort: "newest", page: 1 };

describe("productsHref", () => {
  it("omits every default, so an unfiltered list is a bare path", () => {
    expect(productsHref(DEFAULTS)).toBe("/products");
  });

  it("keeps the existing filters when only the page changes", () => {
    const params: ProductListParams = { ...DEFAULTS, q: "key", status: "DRAFT" };
    expect(productsHref(params, { page: 2 })).toBe("/products?q=key&status=DRAFT&page=2");
  });

  it("encodes values that are not URL-safe", () => {
    expect(productsHref(DEFAULTS, { q: "a & b" })).toBe("/products?q=a+%26+b");
  });

  it("drops a filter when it is cleared", () => {
    const params: ProductListParams = { ...DEFAULTS, q: "key", status: "DRAFT", page: 4 };
    expect(productsHref(params, { status: "ALL", page: 1 })).toBe("/products?q=key");
  });
});

describe("hasActiveFilters", () => {
  it("ignores sort and page, which narrow nothing", () => {
    expect(hasActiveFilters({ ...DEFAULTS, sort: "price-asc", page: 5 })).toBe(false);
  });

  it.each([{ q: "key" }, { status: "DRAFT" as const }])("detects %o", (override) => {
    expect(hasActiveFilters({ ...DEFAULTS, ...override })).toBe(true);
  });
});
