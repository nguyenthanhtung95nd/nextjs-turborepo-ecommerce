const SKELETON_CARDS = 3;

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

/**
 * Covers the pages in this group that have no skeleton of their own — the dashboard and the
 * account page. Both are a heading over a row of panels, so one neutral shape fits both.
 */
export default function AppSectionLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="mb-5 grid gap-2">
        <Bar className="h-7 w-44" />
        <Bar className="h-4 w-64" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <Bar key={index} className="h-40" />
        ))}
      </div>
    </div>
  );
}
