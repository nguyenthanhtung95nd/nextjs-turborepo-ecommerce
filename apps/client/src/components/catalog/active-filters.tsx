import Link from "next/link";
import { X } from "lucide-react";
import { formatMoney } from "@repo/ui/format";
import type { FacetOption } from "@/lib/catalog/queries";
import type { CatalogListParams } from "@repo/contracts";
import { type ListingRoute, activeFilterCount, clearedHref, listingHref } from "@/lib/catalog/url";

interface Props {
  route: ListingRoute;
  params: CatalogListParams;
  categories: readonly FacetOption[];
  brands: readonly FacetOption[];
}

const CENTS_PER_DOLLAR = 100;

/**
 * Echoes the active filters back as removable chips.
 *
 * On a phone the filters themselves live behind a drawer, so without this the only sign that a
 * list is narrowed would be a badge on a button — leaving a shopper to wonder where half the
 * catalogue went.
 *
 * A filter the route implies gets no chip. On `/categories/displays` a removable "Displays" chip
 * would promise something it cannot deliver: there is no version of that page without it.
 */
export function ActiveFilters({ route, params, categories, brands }: Props) {
  if (activeFilterCount(route, params) === 0) return null;

  // Chips name the category, not its slug: `?category=desk-accessories` is a URL, "Desk
  // Accessories" is what the shopper clicked. An unknown slug falls back to itself rather than
  // rendering a blank chip.
  const categoryName = categories.find((item) => item.slug === params.category)?.name;
  const brandName = brands.find((item) => item.slug === params.brand)?.name;

  const showCategory = params.category !== "" && route.implied.category === undefined;
  const showBrand = params.brand !== "" && route.implied.brand === undefined;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {showCategory && (
        <Chip
          label={categoryName ?? params.category}
          clearLabel={`Remove the ${categoryName ?? params.category} category filter`}
          href={listingHref(route, params, { category: "", page: 1 })}
        />
      )}
      {showBrand && (
        <Chip
          label={brandName ?? params.brand}
          clearLabel={`Remove the ${brandName ?? params.brand} brand filter`}
          href={listingHref(route, params, { brand: "", page: 1 })}
        />
      )}
      {params.priceMin > 0 && (
        <Chip
          label={`From ${formatMoney(params.priceMin * CENTS_PER_DOLLAR)}`}
          clearLabel="Remove the minimum price filter"
          href={listingHref(route, params, { priceMin: 0, page: 1 })}
        />
      )}
      {params.priceMax > 0 && (
        <Chip
          label={`Up to ${formatMoney(params.priceMax * CENTS_PER_DOLLAR)}`}
          clearLabel="Remove the maximum price filter"
          href={listingHref(route, params, { priceMax: 0, page: 1 })}
        />
      )}
      {params.inStock === "1" && (
        <Chip
          label="In stock"
          clearLabel="Remove the in-stock filter"
          href={listingHref(route, params, { inStock: "0", page: 1 })}
        />
      )}

      <Link
        href={clearedHref(route, params)}
        className="rounded px-1.5 py-0.5 text-sm font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </Link>
    </div>
  );
}

interface ChipProps {
  label: string;
  clearLabel: string;
  href: string;
}

function Chip({ label, clearLabel, href }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-sm">
      {label}
      <Link
        href={href}
        aria-label={clearLabel}
        className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden="true" />
      </Link>
    </span>
  );
}
