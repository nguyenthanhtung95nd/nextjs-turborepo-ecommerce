"use client";

import { useState, useTransition } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Panel } from "@/components/panel";
import { useUpdateUserRoles } from "../api/use-users";
import type { RoleAssignmentInput } from "@repo/contracts";
import { toUserFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";
import type { RoleOption } from "@/features/users/services";
import { RoleChecklist } from "./role-checklist";

interface Props {
  userId: string;
  roles: readonly RoleOption[];
  assignedRoleIds: readonly string[];
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export function UserRolesForm({ userId, roles, assignedRoleIds }: Props) {
  const saveRoles = useUpdateUserRoles(userId);
  const [selected, setSelected] = useState<string[]>([...assignedRoleIds]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty = !sameSet(selected, assignedRoleIds);

  function toggle(roleId: string, checked: boolean) {
    setError(null);
    setSaved(false);
    setSelected((current) =>
      checked ? [...current, roleId] : current.filter((id) => id !== roleId),
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await runWrite(
        () => saveRoles.mutateAsync({ roleIds: selected }),
        toUserFailure<RoleAssignmentInput>,
      );
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <Panel title="Roles">
      <RoleChecklist
        legend="Assigned roles"
        roles={roles}
        selectedIds={selected}
        onToggle={toggle}
        disabled={isPending}
      />

      {/* The permission union is stamped into the JWT at sign-in, so a change here cannot
          reach a session that already exists. Saying so is cheaper than the support ticket. */}
      <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Role changes take effect the next time this person signs in.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={isPending || !isDirty}>
          {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isPending ? "Saving…" : "Save roles"}
        </Button>
        {saved && !isDirty && (
          <p role="status" className="text-sm text-muted-foreground">
            Roles saved.
          </p>
        )}
      </div>
    </Panel>
  );
}
