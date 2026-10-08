import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href: string;
}

/**
 * The trail back out of a product page.
 *
 * An ordered list inside a `<nav>`, which is what assistive technology expects of a breadcrumb;
 * the separators are `aria-hidden` so the trail is not read as "Shop chevron Audio chevron".
 *
 * The last crumb is the current page and so is plain text, not a link to where you already are.
 */
export function Breadcrumb({ trail, current }: { trail: readonly Crumb[]; current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="py-5">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <Link
              href={crumb.href}
              className="rounded px-1 underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {crumb.label}
            </Link>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
          </li>
        ))}
        <li aria-current="page" className="truncate px-1 font-medium text-foreground">
          {current}
        </li>
      </ol>
    </nav>
  );
}
