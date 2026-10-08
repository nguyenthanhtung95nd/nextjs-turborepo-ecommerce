import { formatMoney } from "@repo/ui/format";
import { getDiscount } from "@/lib/catalog/pricing";

interface Props {
  priceCents: number;
  compareAtPriceCents: number | null;
}

/**
 * The price block on the detail page.
 *
 * Unlike the card, the price is shown even when the product is out of stock: on a page a shopper
 * reached deliberately, what it costs is part of deciding whether to wait for it. The card hides
 * it because there the price is bait for a click that would end in disappointment.
 */
export function ProductPrice({ priceCents, compareAtPriceCents }: Props) {
  const discount = getDiscount(priceCents, compareAtPriceCents);

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
      <p className="text-3xl font-extrabold tracking-tight">{formatMoney(priceCents)}</p>
      {discount && (
        <>
          <s className="text-lg text-muted-foreground">{formatMoney(compareAtPriceCents ?? 0)}</s>
          <p className="font-semibold text-primary">
            Save {formatMoney(discount.savingCents)} ({discount.percent}%)
          </p>
        </>
      )}
    </div>
  );
}
