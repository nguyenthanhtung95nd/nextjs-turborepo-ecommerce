import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductStatusBadge } from "@/features/products/components/product-status-badge";
import { PRODUCT_STATUSES, type ProductStatus } from "@repo/contracts";
import { productsHref } from "@/features/products/url";

const UNFILTERED = { q: "", status: "ALL", sort: "newest", page: 1 } as const;

/**
 * The catalogue as a whole plus its breakdown.
 *
 * The three statuses are parts of one total, so they are shown inside it rather than as peers:
 * three equal cards reading 94 / 26 / 8 never add up to anything on screen. Each status links
 * into the product list already filtered to it.
 */
export function ProductStatsCard({ counts }: { counts: Record<ProductStatus, number> }) {
  const total = PRODUCT_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  return (
    <section
      aria-label="Products"
      className="flex flex-col rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Products</h2>
        <p className="text-3xl font-semibold tabular-nums">{total}</p>
      </div>

      <ul className="mt-3 grid gap-1.5">
        {PRODUCT_STATUSES.map((status) => (
          <li key={status}>
            <Link
              href={productsHref(UNFILTERED, { status })}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ProductStatusBadge status={status} />
              <span className="text-sm font-medium tabular-nums">{counts[status]}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={productsHref(UNFILTERED)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        All products
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
