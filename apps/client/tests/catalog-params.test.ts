import { describe, expect, it } from "vitest";
import { catalogListParamsSchema } from "@repo/contracts";

const DEFAULTS = {
  q: "",
  category: "",
  brand: "",
  priceMin: 0,
  priceMax: 0,
  inStock: "0",
  sort: "newest",
  page: 1,
};

describe("catalogListParamsSchema", () => {
  it("falls back to every default for an empty URL", () => {
    expect(catalogListParamsSchema.parse({})).toEqual(DEFAULTS);
  });

  it("reads a fully specified URL", () => {
    expect(
      catalogListParamsSchema.parse({
        q: "keyboard",
        category: "displays",
        brand: "dell",
        priceMin: "50",
        priceMax: "900",
        inStock: "1",
        sort: "price-asc",
        page: "3",
      }),
    ).toEqual({
      q: "keyboard",
      category: "displays",
      brand: "dell",
      priceMin: 50,
      priceMax: 900,
      inStock: "1",
      sort: "price-asc",
      page: 3,
    });
  });

  describe("the search term", () => {
    it("is trimmed", () => {
      expect(catalogListParamsSchema.parse({ q: "  keyboard  " }).q).toBe("keyboard");
    });

    /**
     * `.max().catch("")` would answer an over-long `?q=` by showing the entire catalogue, which
     * is a stranger result than searching for the first hundred characters of what was pasted.
     */
    it("is truncated rather than discarded when absurdly long", () => {
      const q = catalogListParamsSchema.parse({ q: "k".repeat(5000) }).q;
      expect(q).toHaveLength(100);
    });

    it("falls back to empty for a repeated parameter", () => {
      expect(catalogListParamsSchema.parse({ q: ["a", "b"] }).q).toBe("");
    });

    // Special characters reach the query as a literal value; Prisma parameterises them.
    it("keeps characters that look like SQL or URL syntax", () => {
      expect(catalogListParamsSchema.parse({ q: "100% off'; --" }).q).toBe("100% off'; --");
    });
  });

  /**
   * The whole point of `.catch()` on every field: a storefront link gets edited, truncated and
   * pasted by people, and none of those must produce a 500.
   */
  it.each([
    ["an unknown sort", { sort: "banana" }, { sort: "newest" }],
    ["a negative page", { page: "-3" }, { page: 1 }],
    ["a non-numeric page", { page: "abc" }, { page: 1 }],
    ["a fractional page", { page: "1.5" }, { page: 1 }],
    ["an absurd page", { page: "99999999" }, { page: 1 }],
    ["a non-numeric price", { priceMin: "abc" }, { priceMin: 0 }],
    ["a negative price", { priceMin: "-20" }, { priceMin: 0 }],
    ["an out-of-range price", { priceMax: "99999999" }, { priceMax: 0 }],
    ["a junk in-stock flag", { inStock: "yes" }, { inStock: "0" }],
    ["an array value", { sort: ["price-asc", "newest"] }, { sort: "newest" }],
  ])("clamps %s", (_label, input, expected) => {
    expect(catalogListParamsSchema.parse(input)).toEqual({ ...DEFAULTS, ...expected });
  });

  /**
   * `coerce.boolean()` would read "0" as true, because a non-empty string is truthy in
   * JavaScript. That would turn the filter on for the very URL that asks for it to be off.
   */
  it("treats inStock=0 as off, not as a truthy string", () => {
    expect(catalogListParamsSchema.parse({ inStock: "0" }).inStock).toBe("0");
  });

  it("swaps a reversed price range so it matches something", () => {
    const params = catalogListParamsSchema.parse({ priceMin: "900", priceMax: "50" });
    expect(params).toMatchObject({ priceMin: 50, priceMax: 900 });
  });

  it("leaves a one-sided range alone, because there is nothing to swap it with", () => {
    expect(catalogListParamsSchema.parse({ priceMin: "900" })).toMatchObject({
      priceMin: 900,
      priceMax: 0,
    });
  });

  it("ignores parameters it does not know about", () => {
    expect(catalogListParamsSchema.parse({ utm_source: "newsletter" })).toEqual(DEFAULTS);
  });
});
