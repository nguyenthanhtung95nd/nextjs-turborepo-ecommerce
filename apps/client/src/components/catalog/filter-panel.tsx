import Link from "next/link";
import { Check } from "lucide-react";
import type { FacetOption } from "@/lib/catalog/queries";
import type { CatalogListParams } from "@repo/contracts";
import { type ListingRoute, activeFilterCount, clearedHref, listingHref } from "@/lib/catalog/url";
import { PriceFilterForm } from "./price-filter-form";

interface Props {
  route: ListingRoute;
  params: CatalogListParams;
  categories: readonly FacetOption[];
  brands: readonly FacetOption[];
}

/**
 * The filter controls, as links.
 *
 * A Server Component with no client JavaScript at all: choosing a category *is* a navigation, so
 * it is written as one. That means filters work before hydration and with scripting off, each
 * option can be opened in a new tab, and the back button walks back through the filters a
 * shopper tried — none of which a click handler calling `router.replace` gives for free.
 *
 * Rendered twice per page: inline on desktop, inside the mobile drawer. Both get the same
 * markup, so there is one place to change a filter rule.
 *
 * A group the route already implies is left out entirely. On `/categories/displays` the category
 * is the page, so offering it as a filter would invite a shopper to uncheck the thing they are
 * looking at; the header nav is how you move between categories.
 */
export function FilterPanel({ route, params, categories, brands }: Props) {
  const showCategories = route.implied.category === undefined;
  const showBrands = route.implied.brand === undefined;

  return (
    <div className="flex flex-col gap-6">
      {activeFilterCount(route, params) > 0 && (
        <Link
          href={clearedHref(route, params)}
          className="self-start rounded px-1 text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Clear all filters
        </Link>
      )}

      {showCategories && (
        <FilterGroup heading="Category">
          {categories.map((category) => (
            <OptionLink
              key={category.slug}
              label={category.name}
              selected={params.category === category.slug}
              // Selecting the current option clears it, so the same control turns the filter on
              // and off and there is no separate "any category" row to reach for.
              href={listingHref(route, params, {
                category: params.category === category.slug ? "" : category.slug,
                page: 1,
              })}
            />
          ))}
        </FilterGroup>
      )}

      {showBrands && (
        <FilterGroup heading="Brand">
          {brands.map((brand) => (
            <OptionLink
              key={brand.slug}
              label={brand.name}
              selected={params.brand === brand.slug}
              href={listingHref(route, params, {
                brand: params.brand === brand.slug ? "" : brand.slug,
                page: 1,
              })}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup heading="Price">
        <PriceFilterForm route={route} params={params} />
      </FilterGroup>

      <FilterGroup heading="Availability">
        <OptionLink
          label="In stock only"
          selected={params.inStock === "1"}
          href={listingHref(route, params, {
            inStock: params.inStock === "1" ? "0" : "1",
            page: 1,
          })}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section aria-label={heading}>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">
        {heading}
      </h3>
      {children}
    </section>
  );
}

interface OptionLinkProps {
  label: string;
  selected: boolean;
  href: string;
}

/**
 * One filter choice.
 *
 * `aria-pressed` rather than a tick alone: the checkmark tells a sighted shopper the filter is
 * on, and this tells everyone else. The icon is hidden from the accessibility tree so the state
 * is announced once, not twice.
 */
function OptionLink({ label, selected, href }: OptionLinkProps) {
  return (
    <Link
      href={href}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[15px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? "font-semibold text-primary" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid size-4 shrink-0 place-items-center rounded border ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      {label}
    </Link>
  );
}
