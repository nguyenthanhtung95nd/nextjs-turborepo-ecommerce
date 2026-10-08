import type { Permission } from "@repo/contracts";

/**
 * Categories and brands are the same thing twice: one name, one slug, both referenced by
 * products with ON DELETE RESTRICT. They differ only in the words around them and the
 * permission that guards them, so the whole CRUD is built once and described here.
 */
export const TAXONOMY_KINDS = ["category", "brand"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

interface TaxonomyMeta {
  readonly permission: Permission;
  readonly route: string;
  /** Lower-case, for mid-sentence use: "Delete this category?" */
  readonly singular: string;
  /**
   * Lower-case plural, spelled out rather than derived: "category" + "s" is "categorys".
   * Every plural in this app is a written-down word, never a rule applied to a singular.
   */
  readonly pluralLower: string;
  /** Title-case, for headings: "Categories" */
  readonly plural: string;
  readonly createLabel: string;
  readonly deniedMessage: string;
}

export const TAXONOMY: Record<TaxonomyKind, TaxonomyMeta> = {
  category: {
    permission: "category:manage",
    route: "/categories",
    singular: "category",
    pluralLower: "categories",
    plural: "Categories",
    createLabel: "New category",
    deniedMessage: "You don't have permission to manage categories.",
  },
  brand: {
    permission: "brand:manage",
    route: "/brands",
    singular: "brand",
    pluralLower: "brands",
    plural: "Brands",
    createLabel: "New brand",
    deniedMessage: "You don't have permission to manage brands.",
  },
};

/** `kind` arrives from a client call, so it is narrowed before it indexes anything. */
export function isTaxonomyKind(value: unknown): value is TaxonomyKind {
  return TAXONOMY_KINDS.includes(value as TaxonomyKind);
}
