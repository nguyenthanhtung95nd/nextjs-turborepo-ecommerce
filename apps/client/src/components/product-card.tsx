import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatMoney } from "@repo/ui/format";
import type { CatalogProduct } from "@/lib/catalog/queries";

interface Props {
  product: CatalogProduct;
  /**
   * True for the images above the fold on first paint.
   *
   * `priority` tells Next to preload the image instead of lazy-loading it. Used on the first
   * row only — marking everything priority preloads the whole grid and makes LCP worse, not
   * better.
   */
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: Props) {
  const onSale =
    product.compareAtPriceCents !== null && product.compareAtPriceCents > product.priceCents;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted transition-colors group-hover:border-primary/40">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            priority={priority}
            // Tells the optimizer which width to generate per breakpoint; without it every
            // card downloads an image sized for the widest possible slot.
            sizes="(min-width: 1000px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="size-7" aria-hidden="true" />
          </span>
        )}

        {onSale && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            Sale
          </span>
        )}
      </div>

      <h3 className="mt-2.5 text-[15px] font-semibold leading-snug group-hover:underline">
        {product.name}
      </h3>

      {(product.brandName ?? product.categoryName) && (
        <p className="text-[13px] text-muted-foreground">
          {[product.brandName, product.categoryName].filter(Boolean).join(" · ")}
        </p>
      )}

      {product.inStock ? (
        <p className="mt-1.5 flex items-baseline gap-2 tabular-nums">
          <span className="font-semibold">{formatMoney(product.priceCents)}</span>
          {onSale && (
            <s className="text-[13px] text-muted-foreground">
              {formatMoney(product.compareAtPriceCents ?? 0)}
            </s>
          )}
        </p>
      ) : (
        // Shown instead of the price, not beside it: the price of something unbuyable invites
        // a click that ends in disappointment.
        <p className="mt-1.5 text-[13px] text-muted-foreground">Out of stock</p>
      )}
    </Link>
  );
}
