"use client";

import { useRouter } from "next/navigation";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { UrlSearchField } from "@/components/url-search-field";
import { PRODUCT_STATUS_FILTER_LABELS } from "@/features/products/labels";
import {
  PRODUCT_STATUS_FILTERS,
  type ProductListParams,
  type CatalogSort,
  type ProductStatusFilter,
} from "@repo/contracts";
import { productsHref } from "@/features/products/url";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "price-asc", label: "Price low → high" },
  { value: "price-desc", label: "Price high → low" },
];

/**
 * Filter controls for the product list.
 *
 * The controls only navigate; the Server Component re-queries from the URL.
 */
export function ProductsToolbar({ params }: { params: ProductListParams }) {
  const router = useRouter();

  // Any filter change invalidates the current page number, so every navigation resets to page 1.
  function navigate(overrides: Partial<ProductListParams>) {
    router.push(productsHref(params, { ...overrides, page: 1 }), { scroll: false });
  }

  return (
    <search className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_13rem]">
      <UrlSearchField
        id="product-search"
        label="Search by name"
        placeholder="e.g. Keyboard"
        urlValue={params.q}
        hrefFor={(q) => productsHref(params, { q, page: 1 })}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-status" className="text-xs text-muted-foreground">
          Status
        </Label>
        <Select
          id="product-status"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value as ProductStatusFilter })}
        >
          {PRODUCT_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {PRODUCT_STATUS_FILTER_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-sort" className="text-xs text-muted-foreground">
          Sort
        </Label>
        <Select
          id="product-sort"
          value={params.sort}
          onChange={(event) => navigate({ sort: event.target.value as CatalogSort })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </search>
  );
}
