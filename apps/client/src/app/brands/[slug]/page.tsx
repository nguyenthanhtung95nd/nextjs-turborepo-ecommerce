import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/catalog/product-listing";
import { getBrandBySlug } from "@/lib/catalog/queries";
import { catalogListParamsSchema } from "@repo/contracts";
import { brandRoute } from "@/lib/catalog/url";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/* No `loading.tsx` here either — see the note in `categories/[slug]/page.tsx`. */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: "Brand not found" };

  return {
    title: brand.name,
    description: `Every ${brand.name} product we stock.`,
    alternates: { canonical: `/brands/${brand.slug}` },
  };
}

/** A brand landing page. The category page's twin — see it for why the path carries the filter. */
export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [brand, query] = await Promise.all([getBrandBySlug(slug), searchParams]);

  if (!brand) notFound();

  const parsed = catalogListParamsSchema.parse(query);
  const listParams = { ...parsed, brand: brand.slug };

  return (
    <ProductListing
      route={brandRoute(brand.slug)}
      params={listParams}
      heading={brand.name}
      intro={`Everything we stock from ${brand.name}.`}
    />
  );
}
