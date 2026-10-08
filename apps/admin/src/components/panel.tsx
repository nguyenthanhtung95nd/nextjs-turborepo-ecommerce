/**
 * A titled card. The unit the admin forms are built from — one heading, one bordered body.
 *
 * `aria-label` is what makes the `<section>` a landmark: without a name it is announced as
 * nothing and cannot be navigated to, so the element would be semantic in markup only.
 */
export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-semibold">{title}</h2>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  );
}
