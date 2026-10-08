import type { ProductStatus, ProductStatusFilter } from "@repo/contracts";

// One source for the words a status is shown as. Four screens render them (badge, filter
// select, filter chip, form) and they must agree — "Archived" in the table and "Hidden" in the
// filter would read as two different things.
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const PRODUCT_STATUS_FILTER_LABELS: Record<ProductStatusFilter, string> = {
  ALL: "All statuses",
  ...PRODUCT_STATUS_LABELS,
};
