import { ProductListing } from "@/components/catalog/product-listing";
import { catalogListParamsSchema } from "@repo/contracts";
import { productsRoute } from "@/lib/catalog/url";

export const metadata = { title: "All products" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The whole catalogue. The shared listing with nothing pre-applied. */
export default async function ProductsPage({ searchParams }: Props) {
  const params = catalogListParamsSchema.parse(await searchParams);

  return <ProductListing route={productsRoute} params={params} heading="All products" />;
}
