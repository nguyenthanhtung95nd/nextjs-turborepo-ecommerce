import { TABLE_SURFACE } from "@/components/responsive-table";

const SKELETON_ROWS = 4;

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

/** Holds the page's shape while the role list loads. */
export function RolesSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading roles…</span>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="grid gap-2">
          <Bar className="h-7 w-24" />
          <Bar className="h-4 w-56" />
        </div>
        <Bar className="ml-auto h-9 w-44" />
      </div>
      <div className={TABLE_SURFACE}>
        <div className="grid gap-3 p-3">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Bar className="h-4 w-40" />
              <Bar className="hidden h-4 flex-1 md:block" />
              <Bar className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
