/**
 * Class names for an admin data table that becomes one card per record below `md`.
 *
 * Shared so every list in the admin collapses the same way. The mobile labels come from each
 * cell's own `data-label`, which keeps one `<table>` — and therefore one set of semantics and
 * one copy of the data — instead of a second mobile-only markup tree.
 *
 * Usage: put `TABLE_CELL` on every `<td>` and give each a `data-label`, except the cell that
 * already carries its own heading (usually the first).
 *
 * **Every element also needs its ARIA role written out** — `role="table"`, `rowgroup`, `row`,
 * `columnheader`, `cell`. Overriding `display` on a table element makes the browser drop its
 * implicit role: at mobile width `getByRole("row")` returned zero, so assistive technology saw
 * no table at all, only text. The roles are redundant at desktop and are what keeps the
 * structure intact once the layout collapses.
 */
export const TABLE = "w-full text-sm max-md:block";

export const TABLE_HEAD = "max-md:hidden";

export const TABLE_HEAD_ROW = "border-b border-border text-xs text-muted-foreground";

export const TABLE_HEAD_CELL = "whitespace-nowrap px-3 py-2.5 text-left font-semibold";

export const TABLE_BODY = "max-md:block";

export const TABLE_ROW =
  "border-b border-border last:border-b-0 max-md:mb-2.5 max-md:block max-md:rounded-lg max-md:border max-md:p-3";

export const TABLE_CELL =
  "px-3 py-2.5 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1 max-md:before:text-xs max-md:before:font-medium max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)]";

/**
 * For the one cell that already carries its own heading — usually the first, holding the record's
 * name. It gets no `data-label` and no label/value split.
 *
 * A separate constant rather than `TABLE_CELL` plus an override: both set `display`, so which one
 * wins depends on their order in the generated stylesheet, and the losing round leaves the cell
 * as a flex row whose empty `::before` pushes the name to the far edge.
 */
export const TABLE_CELL_LEAD = "px-3 py-2.5 align-middle max-md:block max-md:px-0 max-md:pb-2";

export const TABLE_CAPTION =
  "px-3 py-2.5 text-left text-xs text-muted-foreground max-md:block max-md:px-0";

/** Wrapper for the table: a card on desktop, bare stacked cards on mobile. */
export const TABLE_SURFACE = "md:rounded-lg md:border md:border-border md:bg-card";
