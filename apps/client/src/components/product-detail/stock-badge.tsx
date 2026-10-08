import { Check, Clock, X } from "lucide-react";
import { getStockState } from "@/lib/catalog/pricing";

const BADGE_CLASS = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold";

/**
 * How many are left, in words.
 *
 * The icon is decorative — the text already says the same thing, and a screen reader announcing
 * "check mark, in stock" is one word too many.
 */
export function StockBadge({ stock }: { stock: number }) {
  const state = getStockState(stock);

  if (state.kind === "out") {
    return (
      <p className={`${BADGE_CLASS} bg-muted text-muted-foreground`}>
        <X className="size-4" aria-hidden="true" />
        Out of stock
      </p>
    );
  }

  if (state.kind === "low") {
    return (
      <p className={`${BADGE_CLASS} bg-accent text-primary`}>
        <Clock className="size-4" aria-hidden="true" />
        Only {state.remaining} left
      </p>
    );
  }

  return (
    <p className={`${BADGE_CLASS} bg-accent text-primary`}>
      <Check className="size-4" aria-hidden="true" />
      In stock
    </p>
  );
}
