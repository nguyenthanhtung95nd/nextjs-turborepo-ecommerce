import { TABLE_SURFACE } from "@/components/responsive-table";

const SKELETON_ROWS = 6;

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

/**
 * Keeps the page's shape while the product query runs.
 *
 * The rows match the real table's height so the layout does not jump when data arrives — a
 * skeleton that is the wrong size causes the very layout shift it exists to prevent.
 *
 * Shared by the route's `loading.tsx` and by the screen's own pending state, so a navigation and
 * a filter change look identical.
 */
export function ProductsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading products…</span>

      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="grid gap-2">
          <Bar className="h-7 w-36" />
          <Bar className="h-4 w-48" />
        </div>
        <Bar className="ml-auto h-9 w-32" />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_13rem]">
        <Bar className="h-9" />
        <Bar className="h-9" />
        <Bar className="h-9" />
      </div>

      <div className={TABLE_SURFACE}>
        <div className="grid gap-3 p-3">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Bar className="size-9 flex-none" />
              <Bar className="h-4 flex-1" />
              <Bar className="hidden h-4 w-20 md:block" />
              <Bar className="hidden h-4 w-16 md:block" />
              <Bar className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
