const CENTS_PER_UNIT = 100;

/** Accepts `12`, `12.5`, `12.50` — up to 9 whole digits and at most 2 decimals. */
export const MONEY_PATTERN = /^\d{1,9}(\.\d{1,2})?$/;

/**
 * Parses a decimal money string into integer cents.
 *
 * Done on the digits rather than `Number(value) * 100`: binary floating point turns `19.99` into
 * 1998.9999999999998 and the rounding error reaches the database.
 */
export function moneyToCents(value: string): number {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * CENTS_PER_UNIT + Number(fraction.padEnd(2, "0"));
}

/** Integer cents back into the decimal string a money input expects (`15900` → `"159.00"`). */
export function centsToMoneyInput(cents: number): string {
  return (cents / CENTS_PER_UNIT).toFixed(2);
}
