import Link from "next/link";
import { pluralize } from "@repo/ui/format";
import type { CategoryEntry } from "@/lib/catalog/queries";

/**
 * The "category entry points" the plan asks for.
 *
 * Renders nothing at all when there are no categories with published products — an empty row
 * of headings is worse than the section simply not being there.
 */
export function CategoryTiles({ categories }: { categories: readonly CategoryEntry[] }) {
  if (categories.length === 0) return null;

  return (
    <section aria-label="Categories" className="py-6 md:py-10">
      <h2 className="mb-5 text-2xl font-bold tracking-tight">Shop by category</h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/categories/${category.slug}`}
              className="flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-4 font-semibold transition-colors hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:gap-2.5"
            >
              {category.name}
              {/* nowrap: side by side there is no room for both, and "3" alone on one line with
                  "products" on the next reads as two separate facts. */}
              <span className="whitespace-nowrap text-[13px] font-normal text-muted-foreground">
                {pluralize(category.productCount, "product", "products")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
