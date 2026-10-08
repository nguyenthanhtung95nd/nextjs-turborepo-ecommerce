import { Badge } from "@repo/ui/badge";
import { type PermissionOption, groupPermissions } from "@/features/roles/permission-groups";

/**
 * The permission catalog, rendered with no controls at all.
 *
 * Deliberately read-only: these rows are seeded from `PERMISSIONS` in `packages/auth`, which is
 * the same list `hasPermission()` checks against. A permission that existed only in the database
 * would be assignable but unenforceable, so the UI offers no way to create one.
 */
export function PermissionCatalog({ permissions }: { permissions: readonly PermissionOption[] }) {
  return (
    <div className="grid gap-6">
      {groupPermissions(permissions).map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </h2>
          <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border">
            {group.permissions.map((permission) => (
              <div
                key={permission.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-card px-4 py-3"
              >
                <dt className="font-mono text-sm font-medium">{permission.key}</dt>
                <dd className="text-sm text-muted-foreground">
                  {permission.description ?? "No description."}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge tone="muted">Read-only</Badge>
        Defined in the application&rsquo;s code and seeded into the database, so the two cannot
        disagree about what a permission means.
      </p>
    </div>
  );
}
