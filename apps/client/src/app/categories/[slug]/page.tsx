import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/catalog/product-listing";
import { getCategoryBySlug } from "@/lib/catalog/queries";
import { catalogListParamsSchema } from "@repo/contracts";
import { categoryRoute } from "@/lib/catalog/url";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/*
 * No `loading.tsx` for this route, for the same reason as the product detail page: a Suspense
 * boundary starts the response streaming, and a streamed response has already sent its status
 * code, so `notFound()` below could only produce a 200 carrying not-found UI.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };

  return {
    title: category.name,
    description: `Browse every ${category.name.toLowerCase()} product we stock.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

/**
 * A category landing page.
 *
 * The shared listing with the category already applied — and applied by the *path*, not the query
 * string, so the URL stays `/categories/displays` as a shopper filters and pages within it. The
 * filter panel drops its Category group here: the category is the page, and unchecking it would
 * be an odd thing to offer. Switching category is what the header nav is for.
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [category, query] = await Promise.all([getCategoryBySlug(slug), searchParams]);

  // `getCategoryBySlug` also refuses a category whose every product is a draft, so an empty
  // landing page is never reachable through a stale link.
  if (!category) notFound();

  // The slug comes from the route, never from the query string: `/categories/displays?category=audio`
  // has to show displays, or the heading and the grid would disagree.
  const parsed = catalogListParamsSchema.parse(query);
  const listParams = { ...parsed, category: category.slug };

  return (
    <ProductListing
      route={categoryRoute(category.slug)}
      params={listParams}
      heading={category.name}
      intro={`Everything we stock in ${category.name.toLowerCase()}.`}
    />
  );
}
