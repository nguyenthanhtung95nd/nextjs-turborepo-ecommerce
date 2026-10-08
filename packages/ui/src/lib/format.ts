const CENTS_PER_UNIT = 100;
const CURRENCY = "USD";

// Pinned, not taken from the runtime: the server and the browser would otherwise format the
// same number differently and React would report a hydration mismatch.
const MONEY_LOCALE = "en-US";
const DATE_LOCALE = "en-GB";

const moneyFormatter = new Intl.NumberFormat(MONEY_LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

const dateFormatter = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Formats integer cents as currency.
 *
 * Lives in the shared package because both apps show prices from the same column, and two
 * copies would eventually disagree about the symbol, the separator or the locale — on the same
 * number, in the same database.
 */
export function formatMoney(cents: number): string {
  return moneyFormatter.format(cents / CENTS_PER_UNIT);
}

/** Formats a timestamp as a short, unambiguous date (`6 Oct 2026`). */
export function formatDate(value: Date): string {
  return dateFormatter.format(value);
}

/**
 * Formats a count with the right noun: `pluralize(1, "user", "users")` -> `"1 user"`.
 *
 * Both forms are given by the caller rather than derived, because appending "s" is wrong often
 * enough to matter -- "category" becomes "categorys" -- and the wrong one is only ever noticed
 * once it is on screen.
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
