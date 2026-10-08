function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

/** Holds the page's shape while the account loads. */
export function AccountSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your account…</span>
      <div className="mb-5 grid gap-2">
        <Bar className="h-7 w-44" />
        <Bar className="h-4 w-56" />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <Bar className="h-5 w-40" />
          <Bar className="h-9" />
          <Bar className="h-9" />
          <Bar className="h-9" />
        </div>
        <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <Bar className="h-5 w-24" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
