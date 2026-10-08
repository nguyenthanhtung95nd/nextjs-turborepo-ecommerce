"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Panel } from "@/components/panel";
import { pluralize } from "@repo/ui/format";
import { useDeleteRole } from "../api/use-roles";
import { toRoleFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";

interface Props {
  roleId: string;
  roleName: string;
  userCount: number;
}

/**
 * Deleting a role is the one action here that cannot be undone, and `user_roles` cascades, so
 * a role still held by someone offers no delete at all — the count is the explanation.
 */
export function RoleDangerZone({ roleId, roleName, userCount }: Props) {
  const remove = useDeleteRole();

  async function confirmDelete() {
    return runWrite(() => remove.mutateAsync(roleId), toRoleFailure);
  }
  return (
    <Panel title="Danger zone">
      {userCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {pluralize(userCount, "person holds", "people hold")} this role. Remove it from them
          before it can be deleted.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Nobody holds this role, so deleting it affects no one. It cannot be undone.
          </p>
          <ConfirmDeleteDialog
            title={`Delete ${roleName}?`}
            description="This removes the role and its permission assignments permanently. It cannot be undone."
            confirmLabel="Delete role"
            action={confirmDelete}
            redirectTo="/roles"
            trigger={
              <Button variant="destructive" size="sm" className="justify-self-start">
                <Trash2 aria-hidden="true" />
                Delete role
              </Button>
            }
          />
        </>
      )}
    </Panel>
  );
}
