"use client";

import { useState, useTransition } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Panel } from "@/components/panel";
import { useUpdateRolePermissions } from "../api/use-roles";
import type { PermissionAssignmentInput } from "@repo/contracts";
import { toRoleFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";
import type { PermissionOption } from "@/features/roles/permission-groups";
import { PermissionChecklist } from "./permission-checklist";

interface Props {
  roleId: string;
  permissions: readonly PermissionOption[];
  assignedPermissionIds: readonly string[];
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export function RolePermissionsForm({ roleId, permissions, assignedPermissionIds }: Props) {
  const savePermissions = useUpdateRolePermissions(roleId);
  const [selected, setSelected] = useState<string[]>([...assignedPermissionIds]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty = !sameSet(selected, assignedPermissionIds);

  function toggle(permissionId: string, checked: boolean) {
    setError(null);
    setSaved(false);
    setSelected((current) =>
      checked ? [...current, permissionId] : current.filter((id) => id !== permissionId),
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await runWrite(
        () => savePermissions.mutateAsync({ permissionIds: selected }),
        toRoleFailure<PermissionAssignmentInput>,
      );
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <Panel title="Permissions">
      <PermissionChecklist
        permissions={permissions}
        selectedIds={selected}
        onToggle={toggle}
        disabled={isPending}
      />

      {/* The permission union is stamped into the JWT at sign-in, so a change here cannot reach
          a session that already exists. Saying so is cheaper than the support ticket. */}
      <p className="flex max-w-2xl items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Changes take effect the next time each holder of this role signs in.
      </p>

      {error && (
        <p
          role="alert"
          className="max-w-2xl rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={isPending || !isDirty}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isPending ? "Saving…" : "Save permissions"}
        </Button>
        {saved && !isDirty && (
          <p role="status" className="text-sm text-muted-foreground">
            Permissions saved.
          </p>
        )}
      </div>
    </Panel>
  );
}
