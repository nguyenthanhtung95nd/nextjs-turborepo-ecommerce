import type { CatalogSort } from "@repo/contracts";

/** UI copy for the sort control. Wording belongs to the storefront, not to the shared contract. */
export const CATALOG_SORT_LABELS: Record<CatalogSort, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "name-asc": "Name: A–Z",
};
