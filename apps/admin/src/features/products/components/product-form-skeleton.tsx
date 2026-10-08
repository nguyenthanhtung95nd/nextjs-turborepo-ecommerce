import { TABLE_SURFACE } from "@/components/responsive-table";

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

/** Holds the form's shape while its data loads, so the layout does not jump when it arrives. */
export function ProductFormSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the form…</span>
      <div className="mb-5 grid gap-2">
        <Bar className="h-7 w-48" />
        <Bar className="h-4 w-64" />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className={`${TABLE_SURFACE} grid gap-4 p-4`}>
          <Bar className="h-9" />
          <Bar className="h-9" />
          <Bar className="h-24" />
          <Bar className="h-9" />
        </div>
        <div className={`${TABLE_SURFACE} grid gap-4 p-4`}>
          <Bar className="h-9" />
          <Bar className="h-9" />
        </div>
      </div>
    </div>
  );
}
