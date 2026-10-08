import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}

/**
 * Previous / next paging for the product grid.
 *
 * Deliberately not shared with the admin's `Pagination`: that one is a table footer with a
 * row-range readout, this one is centred under a grid. Hoisting them into one component would
 * mean a styling prop surface and a `next/link` dependency in `@repo/ui`, which is more coupling
 * than two short presentational components are worth.
 *
 * Renders nothing when everything fits on one page — a lone, dead "Page 1 of 1" is noise.
 */
export function CatalogPagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Product pages" className="mt-8 flex items-center justify-center gap-3">
      <Step href={hrefFor(page - 1)} available={page > 1} label="Previous page">
        <ChevronLeft className="size-4" aria-hidden="true" />
        Previous
      </Step>
      <p aria-current="page" className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <Step href={hrefFor(page + 1)} available={page < pageCount} label="Next page">
        Next
        <ChevronRight className="size-4" aria-hidden="true" />
      </Step>
    </nav>
  );
}

interface StepProps {
  href: string;
  available: boolean;
  label: string;
  children: React.ReactNode;
}

const STEP_CLASS =
  "inline-flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold";

// An unavailable step renders as plain text, not a disabled link: there is no destination, so
// there should be nothing to focus or to click.
function Step({ href, available, label, children }: StepProps) {
  if (!available) {
    return (
      <span aria-hidden="true" className={`${STEP_CLASS} opacity-40`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${STEP_CLASS} hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
    >
      {children}
    </Link>
  );
}
