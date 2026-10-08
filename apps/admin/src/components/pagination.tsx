import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@repo/ui/button";
import { cn } from "@repo/ui/cn";

interface StepProps {
  href: string;
  available: boolean;
  label: string;
  children: React.ReactNode;
}

// An unavailable step renders as plain text, not a disabled link: there is no destination, so
// there should be nothing to focus or click.
function Step({ href, available, label, children }: StepProps) {
  const className = cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1");
  if (!available) {
    return (
      <span className={cn(className, "opacity-50")} aria-hidden="true">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

interface Props {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  /** Describes what is being paged, for the landmark's accessible name. */
  label: string;
  hrefFor: (page: number) => string;
}

export function Pagination({ page, pageCount, total, pageSize, label, hrefFor }: Props) {
  const firstOnPage = (page - 1) * pageSize + 1;
  const lastOnPage = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground"
    >
      <p>
        Showing{" "}
        <strong className="font-medium text-foreground">
          {firstOnPage}–{lastOnPage}
        </strong>{" "}
        of {total}
      </p>
      <div className="ml-auto flex items-center gap-2">
        <Step href={hrefFor(page - 1)} available={page > 1} label="Previous page">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Step>
        <span aria-current="page">
          Page {page} of {pageCount}
        </span>
        <Step href={hrefFor(page + 1)} available={page < pageCount} label="Next page">
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Step>
      </div>
    </nav>
  );
}
