import { describe, expect, it } from "vitest";
import { MONEY_PATTERN, centsToMoneyInput, moneyToCents } from "@repo/contracts";
import { formatMoney } from "@repo/ui/format";

describe("moneyToCents", () => {
  it.each([
    ["0", 0],
    ["12", 1200],
    ["12.5", 1250],
    ["12.05", 1205],
    ["159.00", 15900],
  ])("converts %s to %i cents", (input, expected) => {
    expect(moneyToCents(input)).toBe(expected);
  });

  it("keeps values exact where floating-point multiplication would not", () => {
    // Number("19.99") * 100 === 1998.9999999999998 — the reason this helper parses digits.
    expect(moneyToCents("19.99")).toBe(1999);
    expect(moneyToCents("0.07")).toBe(7);
  });
});

describe("centsToMoneyInput", () => {
  it("round-trips through moneyToCents", () => {
    expect(moneyToCents(centsToMoneyInput(15900))).toBe(15900);
    expect(centsToMoneyInput(7)).toBe("0.07");
  });
});

describe("formatMoney", () => {
  it("formats cents as currency, not as a raw number", () => {
    expect(formatMoney(15900)).toBe("$159.00");
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("groups thousands so large prices stay readable", () => {
    expect(formatMoney(123456789)).toBe("$1,234,567.89");
  });
});

describe("MONEY_PATTERN", () => {
  it.each(["0", "12", "12.5", "12.34"])("accepts %s", (value) => {
    expect(MONEY_PATTERN.test(value)).toBe(true);
  });

  it.each(["", "-1", "12.345", "1,200", "abc", "1e3"])("rejects %s", (value) => {
    expect(MONEY_PATTERN.test(value)).toBe(false);
  });
});
