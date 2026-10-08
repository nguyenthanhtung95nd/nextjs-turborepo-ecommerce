import { describe, expect, it } from "vitest";
import { LOW_STOCK_THRESHOLD, getDiscount, getStockState } from "@/lib/catalog/pricing";

describe("getDiscount", () => {
  it("reports the saving and the whole-percent cut", () => {
    expect(getDiscount(15900, 18900)).toEqual({ savingCents: 3000, percent: 16 });
  });

  it("rounds the percentage rather than showing a fraction of one", () => {
    // 3000 / 18900 is 15.873…%, which no shop would print.
    expect(getDiscount(15900, 18900)?.percent).toBe(16);
  });

  it("is null when there is no compare-at price", () => {
    expect(getDiscount(15900, null)).toBeNull();
  });

  /**
   * The database CHECK requires `compare_at > price`, but the page must not advertise a saving of
   * zero or a negative one if that constraint is ever relaxed or the row arrives from an import.
   */
  it.each([
    ["equal to the price", 15900],
    ["below the price", 9900],
  ])("is null when the compare-at price is %s", (_label, compareAt) => {
    expect(getDiscount(15900, compareAt)).toBeNull();
  });

  it("handles a free product without dividing by zero", () => {
    expect(getDiscount(0, 1000)).toEqual({ savingCents: 1000, percent: 100 });
  });
});

describe("getStockState", () => {
  it("is out of stock at zero", () => {
    expect(getStockState(0)).toEqual({ kind: "out" });
  });

  // Stock is never negative in the database, but a negative must not read as "in stock".
  it("is out of stock below zero", () => {
    expect(getStockState(-3)).toEqual({ kind: "out" });
  });

  it("is low at the threshold, not past it", () => {
    expect(getStockState(LOW_STOCK_THRESHOLD)).toEqual({
      kind: "low",
      remaining: LOW_STOCK_THRESHOLD,
    });
    expect(getStockState(LOW_STOCK_THRESHOLD + 1)).toEqual({ kind: "in" });
  });

  it("carries the remaining count so the page can say how few are left", () => {
    expect(getStockState(2)).toEqual({ kind: "low", remaining: 2 });
  });
});
