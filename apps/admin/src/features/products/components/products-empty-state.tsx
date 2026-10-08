import Link from "next/link";
import { Package, SearchX } from "lucide-react";
import { buttonVariants } from "@repo/ui/button";
import { StatePanel } from "@/components/state-panel";
import type { ProductListParams } from "@repo/contracts";
import { hasActiveFilters, productsHref } from "@/features/products/url";

/**
 * "Nothing here" has two very different meanings, and offering the wrong recovery action is
 * what makes an empty screen feel broken: an unfiltered empty catalogue needs a way to create
 * a product, a filtered one needs a way to widen the search.
 */
export function ProductsEmptyState({
  params,
  canCreate,
}: {
  params: ProductListParams;
  canCreate: boolean;
}) {
  if (hasActiveFilters(params)) {
    return (
      <StatePanel
        icon={<SearchX className="size-5" />}
        title="No products match these filters"
        description="Nothing matches the current search and status. Try a different name or widen the status filter."
      >
        <Link
          href={productsHref(params, { q: "", status: "ALL", page: 1 })}
          className={buttonVariants({ variant: "outline" })}
        >
          Clear all filters
        </Link>
      </StatePanel>
    );
  }

  return (
    <StatePanel
      icon={<Package className="size-5" />}
      title="No products yet"
      description="Create your first product to see it here. New products start as drafts, so nothing reaches the storefront until you publish it."
    >
      {canCreate && (
        <Link href="/products/new" className={buttonVariants()}>
          New product
        </Link>
      )}
    </StatePanel>
  );
}
