import type { Metadata } from "next";
import { ProductListing } from "@/components/catalog/product-listing";
import { catalogListParamsSchema } from "@repo/contracts";
import { searchRoute } from "@/lib/catalog/url";

/**
 * Search result pages are kept out of the index.
 *
 * Left indexable they multiply without limit — one URL per term anyone ever typed — and compete
 * with the category pages, which are the pages actually worth ranking.
 */
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Search results.
 *
 * The same listing as `/products`, with the term in the URL. Filters, sorting and paging all
 * narrow the search rather than replacing it, because they build their links on this route.
 *
 * The term is matched server-side; nothing about the query reaches the browser as JavaScript.
 */
export default async function SearchPage({ searchParams }: Props) {
  const params = catalogListParamsSchema.parse(await searchParams);

  // An empty `q` is not an error — it is what the header's form submits when someone presses
  // Enter on an empty box. Showing everything is a better answer than an error panel.
  const heading = params.q ? `Results for “${params.q}”` : "Search";

  return (
    <ProductListing
      route={searchRoute}
      params={params}
      heading={heading}
      intro={params.q ? undefined : "Type in the search box above to look for a product."}
      emptyTitle={params.q ? `Nothing matched “${params.q}”` : undefined}
      emptyDescription={
        params.q ? "Check the spelling, or try a shorter or more general word." : undefined
      }
    />
  );
}
