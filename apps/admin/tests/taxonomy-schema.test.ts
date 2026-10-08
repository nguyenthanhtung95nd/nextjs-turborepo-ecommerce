import { describe, expect, it } from "vitest";
import { TAXONOMY, TAXONOMY_KINDS, isTaxonomyKind } from "@/features/taxonomy/kinds";
import { type TaxonomyFormInput, taxonomyFormSchema } from "@repo/contracts";

const VALID: TaxonomyFormInput = { name: "Peripherals", slug: "peripherals" };

function firstErrorFor(input: TaxonomyFormInput, field: keyof TaxonomyFormInput) {
  const result = taxonomyFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("taxonomyFormSchema", () => {
  it("accepts a well-formed record and trims it", () => {
    const result = taxonomyFormSchema.safeParse({ name: "  Displays  ", slug: " displays " });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "Displays", slug: "displays" });
  });

  it("requires both fields", () => {
    expect(firstErrorFor({ ...VALID, name: "   " }, "name")).toMatch(/required/i);
    expect(firstErrorFor({ ...VALID, slug: "" }, "slug")).toMatch(/required/i);
  });

  it.each(["Peripherals", "has_underscore", "trailing-", "-leading", "double--hyphen", "có-dấu"])(
    "rejects the invalid slug %s",
    (slug) => {
      expect(firstErrorFor({ ...VALID, slug }, "slug")).toBeDefined();
    },
  );

  it.each(["peripherals", "usb-c-hubs", "4k", "a1-b2-c3"])("accepts the slug %s", (slug) => {
    expect(taxonomyFormSchema.safeParse({ ...VALID, slug }).success).toBe(true);
  });

  it("rejects an over-long name", () => {
    expect(firstErrorFor({ ...VALID, name: "x".repeat(81) }, "name")).toBeDefined();
  });
});

describe("taxonomy kinds", () => {
  // `kind` reaches the server actions from a client call, so it must not be trusted.
  it.each(["categories", "product", "", "__proto__", null, undefined, 1])(
    "rejects %s as a kind",
    (value) => {
      expect(isTaxonomyKind(value)).toBe(false);
    },
  );

  it.each(TAXONOMY_KINDS)("accepts %s", (kind) => {
    expect(isTaxonomyKind(kind)).toBe(true);
  });

  // Pinned rather than derived: appending "s" to "category" gives "categorys", which is how
  // the list heading once read.
  it.each([
    ["category", "category", "categories"],
    ["brand", "brand", "brands"],
  ] as const)("spells %s out as %s / %s", (kind, singular, pluralLower) => {
    expect(TAXONOMY[kind].singular).toBe(singular);
    expect(TAXONOMY[kind].pluralLower).toBe(pluralLower);
  });

  it("uses the same word in the heading and mid-sentence", () => {
    for (const kind of TAXONOMY_KINDS) {
      const { plural, pluralLower } = TAXONOMY[kind];
      expect(plural.toLowerCase()).toBe(pluralLower);
    }
  });

  it("gives every kind a distinct route and permission", () => {
    const routes = TAXONOMY_KINDS.map((kind) => TAXONOMY[kind].route);
    const permissions = TAXONOMY_KINDS.map((kind) => TAXONOMY[kind].permission);
    expect(new Set(routes).size).toBe(TAXONOMY_KINDS.length);
    expect(new Set(permissions).size).toBe(TAXONOMY_KINDS.length);
  });
});
