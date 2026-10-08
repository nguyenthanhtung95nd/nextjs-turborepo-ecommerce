import Link from "next/link";
import { X } from "lucide-react";
import { PRODUCT_STATUS_FILTER_LABELS } from "@/features/products/labels";
import type { ProductListParams } from "@repo/contracts";
import { hasActiveFilters, productsHref } from "@/features/products/url";

interface ChipProps {
  label: string;
  clearLabel: string;
  href: string;
}

function Chip({ label, clearLabel, href }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-3 pr-1 text-xs">
      {label}
      <Link
        href={href}
        aria-label={clearLabel}
        className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden="true" />
      </Link>
    </span>
  );
}

/**
 * Echoes the active filters back as removable chips.
 *
 * Plain links rather than buttons: each one is a real navigation, so it works without
 * JavaScript and can be opened in a new tab.
 */
export function ActiveFilterChips({ params }: { params: ProductListParams }) {
  if (!hasActiveFilters(params)) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Active filters:</span>
      {params.q !== "" && (
        <Chip
          label={`name: “${params.q}”`}
          clearLabel="Clear the name filter"
          href={productsHref(params, { q: "", page: 1 })}
        />
      )}
      {params.status !== "ALL" && (
        <Chip
          label={`status: ${PRODUCT_STATUS_FILTER_LABELS[params.status]}`}
          clearLabel="Clear the status filter"
          href={productsHref(params, { status: "ALL", page: 1 })}
        />
      )}
      <Link
        href={productsHref(params, { q: "", status: "ALL", page: 1 })}
        className="rounded px-1.5 py-0.5 font-medium underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </Link>
    </div>
  );
}
