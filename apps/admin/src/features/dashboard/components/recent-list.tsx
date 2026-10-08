import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate } from "@repo/ui/format";

export interface RecentEntry {
  id: string;
  label: string;
  /** Optional second line — an email, a slug. */
  detail?: string;
  /** Rendered to the right of the label, e.g. a status badge. */
  badge?: React.ReactNode;
  createdAt: Date;
  href: string;
}

interface Props {
  title: string;
  entries: readonly RecentEntry[];
  emptyMessage: string;
  allHref: string;
  allLabel: string;
}

/**
 * The newest records of one kind.
 *
 * Titled "Recently added" rather than "Recent activity" because `created_at` is the only
 * timestamp this schema can be trusted on: there is no audit table, and `updated_at` has no
 * trigger behind it, so anything stronger would be a claim the data cannot support.
 */
export function RecentList({ title, entries, emptyMessage, allHref, allLabel }: Props) {
  return (
    <section aria-label={title} className="flex flex-col rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-semibold">{title}</h2>

      {entries.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entry.href}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{entry.label}</span>
                  {entry.detail && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {entry.detail}
                    </span>
                  )}
                </span>
                {entry.badge}
                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="whitespace-nowrap text-xs text-muted-foreground"
                >
                  {formatDate(entry.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={allHref}
        className="inline-flex items-center gap-1 border-t border-border px-4 py-3 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {allLabel}
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
