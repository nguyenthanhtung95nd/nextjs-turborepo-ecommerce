import type { CatalogProduct } from "@/lib/catalog/queries";
import { ProductCard } from "./product-card";

/** How many cards sit above the fold on a desktop first paint — one row of four. */
const PRIORITY_COUNT = 4;

export function ProductGrid({ products }: { products: readonly CatalogProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < PRIORITY_COUNT} />
        </li>
      ))}
    </ul>
  );
}
