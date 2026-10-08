/** Below this many units the page says how few are left, to be honest rather than to pressure. */
export const LOW_STOCK_THRESHOLD = 5;

const PERCENT = 100;

export interface Discount {
  savingCents: number;
  /** Rounded to a whole percent — "Save 16%" rather than "Save 15.873%". */
  percent: number;
}

/**
 * The saving on a marked-down product.
 *
 * @returns `null` when there is no genuine markdown. The database CHECK already requires
 * `compare_at > price`, but a detail page must not advertise a discount of $0 or a negative one
 * if that constraint is ever relaxed or the data arrives from somewhere else.
 */
export function getDiscount(
  priceCents: number,
  compareAtPriceCents: number | null,
): Discount | null {
  if (compareAtPriceCents === null || compareAtPriceCents <= priceCents) return null;

  const savingCents = compareAtPriceCents - priceCents;
  return {
    savingCents,
    percent: Math.round((savingCents / compareAtPriceCents) * PERCENT),
  };
}

export type StockState = { kind: "out" } | { kind: "low"; remaining: number } | { kind: "in" };

/**
 * How availability should be described.
 *
 * A discriminated union rather than booleans: "in stock" and "only 2 left" are the same fact at
 * different thresholds, and `isOutOfStock`/`isLowStock` flags make the impossible combination of
 * both representable.
 */
export function getStockState(stock: number): StockState {
  if (stock <= 0) return { kind: "out" };
  if (stock <= LOW_STOCK_THRESHOLD) return { kind: "low", remaining: stock };
  return { kind: "in" };
}
