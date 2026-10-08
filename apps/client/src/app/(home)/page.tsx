import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { CategoryTiles } from "@/components/home/category-tiles";
import { HomeHero } from "@/components/home/home-hero";
import { ProductGrid } from "@/components/product-grid";
import { StatePanel } from "@/components/state-panel";
import { listCategoryEntries, listLatestProducts } from "@/lib/catalog/queries";

/**
 * Regenerate at most once a minute.
 *
 * Without this the page has no dynamic input, so Next prerenders it at build time and the
 * catalogue freezes: a product published in the admin would never reach the storefront until
 * the next deploy. A minute keeps the home page a cached static document — which is what makes
 * it fast — while bounding how stale it can get.
 *
 * The better end state is on-demand revalidation triggered by the admin's write actions; until
 * those call `revalidatePath`, this window is the safety net.
 */
export const revalidate = 60;

/** Two full rows of four on desktop, four rows of two on a phone. */
const GRID_SIZE = 8;

export default async function HomePage() {
  // One extra: the newest product is lifted into the hero, so without it the grid would come up
  // a card short on the first row.
  const [products, categories] = await Promise.all([
    listLatestProducts(GRID_SIZE + 1),
    listCategoryEntries(),
  ]);

  // The newest product carries the hero. With nothing published the hero still renders, so the
  // page keeps its shape and its message instead of collapsing to a single empty panel.
  const featured = products[0] ?? null;

  // The hero already shows that product, at that size, with that photo. Repeating it as the
  // first card half a screen later reads as a rendering fault, not as emphasis.
  const grid = products.slice(1);

  return (
    <>
      <HomeHero featured={featured} />
      <CategoryTiles categories={categories} />

      {/*
        With a single published product the hero is already the whole catalogue, so a "Latest"
        heading over an empty grid — or over an empty state contradicting the hero above it —
        would be noise. The section only earns its place once there is a second product.
      */}
      {(grid.length > 0 || !featured) && (
        <section aria-label="Latest products" className="py-6 md:py-10">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Latest</h2>
            {grid.length > 0 && (
              <Link
                href="/products"
                className="ml-auto font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                All products →
              </Link>
            )}
          </div>

          {grid.length === 0 ? (
            <StatePanel
              icon={<PackageOpen className="size-8" />}
              title="Nothing here yet"
              description="There are no products on sale at the moment. Check back soon."
            />
          ) : (
            <ProductGrid products={grid} />
          )}
        </section>
      )}
    </>
  );
}
