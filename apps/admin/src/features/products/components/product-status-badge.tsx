import { Badge } from "@repo/ui/badge";
import { PRODUCT_STATUS_LABELS } from "@/features/products/labels";
import type { ProductStatus } from "@repo/contracts";

// Maps the domain status onto a design-system tone. Keeping the mapping here means @repo/ui
// never learns what a product is.
const STATUS_TONES: Record<ProductStatus, "success" | "warning" | "muted"> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "muted",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{PRODUCT_STATUS_LABELS[status]}</Badge>;
}
