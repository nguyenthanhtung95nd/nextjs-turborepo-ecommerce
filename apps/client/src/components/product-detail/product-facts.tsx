import Link from "next/link";
import type { ProductDetail } from "@/lib/catalog/queries";

interface Fact {
  term: string;
  value: React.ReactNode;
}

/**
 * The product's facts, as a description list.
 *
 * `<dl>` rather than a table or stacked divs: each row really is a term and its value, and the
 * pairing is then available to a screen reader instead of being implied by the layout.
 *
 * The schema has no attributes table, so these are the facts the catalogue actually stores. When
 * one is missing the row is left out rather than shown as "—": an empty row tells a shopper
 * nothing except that the page expected something.
 */
export function ProductFacts({ product }: { product: ProductDetail }) {
  const facts: Fact[] = [];

  if (product.brand) {
    facts.push({ term: "Brand", value: <FacetLink base="/brands" {...product.brand} /> });
  }
  if (product.category) {
    facts.push({ term: "Category", value: <FacetLink base="/categories" {...product.category} /> });
  }
  facts.push({ term: "Product code", value: <span className="font-mono">{product.slug}</span> });

  return (
    <dl className="grid gap-x-6 gap-y-2.5 text-[15px] sm:grid-cols-[8rem_minmax(0,1fr)]">
      {facts.map((fact) => (
        <div key={fact.term} className="contents">
          <dt className="text-muted-foreground">{fact.term}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A link to the rest of the brand or category.
 *
 * Points at the landing page rather than at `/products?brand=…`: both show the same products, but
 * one of them is a page with a name, a heading and a canonical URL worth sharing.
 */
function FacetLink({
  base,
  name,
  slug,
}: {
  base: "/brands" | "/categories";
  name: string;
  slug: string;
}) {
  return (
    <Link
      href={`${base}/${slug}`}
      className="rounded font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {name}
    </Link>
  );
}
