import { TABLE_SURFACE } from "@/components/responsive-table";

const SKELETON_ROWS = 5;

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

/**
 * Keeps the page's shape while the query runs.
 *
 * The rows match the real table's height, so the layout does not jump when data arrives — a
 * skeleton of the wrong size causes the very shift it exists to prevent.
 */
export function TaxonomyLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="grid gap-2">
          <Bar className="h-7 w-40" />
          <Bar className="h-4 w-52" />
        </div>
        <Bar className="ml-auto h-9 w-36" />
      </div>

      <div className={TABLE_SURFACE}>
        <div className="grid gap-3 p-3">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Bar className="h-4 flex-1" />
              <Bar className="hidden h-4 w-32 md:block" />
              <Bar className="hidden h-4 w-10 md:block" />
              <Bar className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
