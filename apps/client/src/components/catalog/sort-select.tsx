"use client";

import { useRouter } from "next/navigation";
import { CATALOG_SORTS, type CatalogListParams, type CatalogSort } from "@repo/contracts";
import { CATALOG_SORT_LABELS } from "@/lib/catalog/labels";
import { type ListingRoute, listingHref } from "@/lib/catalog/url";

/**
 * The sort control — one of only two client islands on this page.
 *
 * Unlike the filters, sorting is not naturally a link: a shopper expects the list to reorder the
 * moment the select changes, and a list of four sort links would read as four more filters. So
 * this one navigates on change.
 *
 * It still only navigates. The URL stays the source of truth, and the Server Component re-queries
 * from it — this component holds no results and no state of its own.
 */
export function SortSelect({ route, params }: { route: ListingRoute; params: CatalogListParams }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="catalog-sort" className="whitespace-nowrap text-sm text-muted-foreground">
        Sort
      </label>
      <select
        id="catalog-sort"
        value={params.sort}
        // Reordering moves products between pages, so page 3 of the old order means nothing in
        // the new one. Every sort change returns to page 1.
        onChange={(event) =>
          router.replace(
            listingHref(route, params, { sort: event.target.value as CatalogSort, page: 1 }),
            {
              scroll: false,
            },
          )
        }
        className="h-10 rounded-lg border border-border bg-card px-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {CATALOG_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {CATALOG_SORT_LABELS[sort]}
          </option>
        ))}
      </select>
    </div>
  );
}
