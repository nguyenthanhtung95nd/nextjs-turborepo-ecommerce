import { Info } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Panel } from "@/components/panel";
import type { AccountOverview } from "../services";
import { groupPermissions } from "@/features/roles/permission-groups";

/**
 * What this account can currently do, read from the database.
 *
 * The permissions here are the union of the roles' grants — the same calculation that is
 * stamped into a token at sign-in. It can differ from what the current session is actually
 * carrying, which is exactly why the note below is there.
 */
export function AccessPanel({ account }: { account: AccountOverview }) {
  // The ids are unused here; grouping only needs the keys, so they are filled in from them.
  const grouped = groupPermissions(
    account.permissionKeys.map((key) => ({ id: key, key, description: null })),
  );

  return (
    <Panel title="Your access">
      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Roles</h3>
        {account.roleNames.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No roles. You wouldn&rsquo;t be able to reach the admin area without one.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {account.roleNames.map((name) => (
              <Badge key={name} tone="muted">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <h3 className="text-sm font-medium">Permissions</h3>
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">None.</p>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="grid gap-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {group.permissions.map((permission) => (
                  <code
                    key={permission.key}
                    className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs"
                  >
                    {permission.key}
                  </code>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        This is what your roles grant right now. Your current session still carries the permissions
        it was given when you signed in — sign out and back in to pick up any change.
      </p>
    </Panel>
  );
}
