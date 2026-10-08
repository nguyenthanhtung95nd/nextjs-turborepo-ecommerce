import Link from "next/link";
import { SearchX } from "lucide-react";
import { pluralize } from "@repo/ui/format";
import { ProductGrid } from "@/components/product-grid";
import { StatePanel } from "@/components/state-panel";
import { listFilterOptions, listProducts } from "@/lib/catalog/queries";
import type { CatalogListParams } from "@repo/contracts";
import { type ListingRoute, activeFilterCount, clearedHref, listingHref } from "@/lib/catalog/url";
import { ActiveFilters } from "./active-filters";
import { CatalogPagination } from "./catalog-pagination";
import { FilterDrawer } from "./filter-drawer";
import { FilterPanel } from "./filter-panel";
import { SortSelect } from "./sort-select";

interface Props {
  route: ListingRoute;
  params: CatalogListParams;
  heading: string;
  /** Optional line under the heading — a category's purpose, or what was searched for. */
  intro?: string;
  /** Replaces the generic "no products" copy where the route can say something more useful. */
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * The listing, everywhere it appears.
 *
 * `/products`, `/search`, `/categories/{slug}` and `/brands/{slug}` are the same page with a
 * different heading and a different route to build links against. Keeping one component is not
 * only less code: four copies would drift, and the drift would be silent — a filter that resets
 * the page number on one route and not another looks like a caching bug, not a missing line.
 *
 * Every page that renders this is a Server Component and reads its whole state from the URL, so a
 * pasted address reproduces exactly what the sender saw.
 */
export async function ProductListing({
  route,
  params,
  heading,
  intro,
  emptyTitle,
  emptyDescription,
}: Props) {
  const [result, options] = await Promise.all([listProducts(params), listFilterOptions()]);

  // `result.page` rather than `params.page`: the query clamps an out-of-range page, and the
  // pagination links have to count from the page actually being shown.
  const shownParams = { ...params, page: result.page };
  const filters = (
    <FilterPanel
      route={route}
      params={params}
      categories={options.categories}
      brands={options.brands}
    />
  );

  return (
    <div className="py-6 md:py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{heading}</h1>
      {intro && <p className="mt-2 max-w-[60ch] text-muted-foreground">{intro}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground">{pluralize(result.total, "product", "products")}</p>
        <div className="ml-auto flex items-center gap-2">
          <FilterDrawer activeCount={activeFilterCount(route, params)}>{filters}</FilterDrawer>
          <SortSelect route={route} params={shownParams} />
        </div>
      </div>

      <div className="mt-6 gap-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* The desktop copy of the panel. Hidden below `lg`, where the drawer owns it. */}
        <aside aria-label="Filters" className="hidden lg:block">
          {filters}
        </aside>

        <div>
          <ActiveFilters
            route={route}
            params={shownParams}
            categories={options.categories}
            brands={options.brands}
          />

          {result.products.length === 0 ? (
            <EmptyResults
              route={route}
              params={params}
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            <>
              <ProductGrid products={result.products} />
              <CatalogPagination
                page={result.page}
                pageCount={result.pageCount}
                hrefFor={(page) => listingHref(route, shownParams, { page })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmptyProps {
  route: ListingRoute;
  params: CatalogListParams;
  title?: string;
  description?: string;
}

/**
 * Nothing matched.
 *
 * Two situations wear the same layout: filters that exclude everything — which the shopper can
 * undo, so offer the undo — and a view with nothing in it at all, where a "clear filters" button
 * would be a dead end. The caller can replace the wording, because "no results for 'keybord'" is
 * a more useful sentence than "no products" and only the search page knows to say it.
 */
function EmptyResults({ route, params, title, description }: EmptyProps) {
  const isFiltered = activeFilterCount(route, params) > 0;

  return (
    <StatePanel
      icon={<SearchX className="size-8" />}
      title={title ?? (isFiltered ? "No products match those filters" : "Nothing here yet")}
      description={
        description ??
        (isFiltered
          ? "Try widening the price range or removing a filter."
          : "There are no products on sale at the moment. Check back soon.")
      }
    >
      {isFiltered && (
        <Link
          href={clearedHref(route, params)}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Clear all filters
        </Link>
      )}
    </StatePanel>
  );
}
