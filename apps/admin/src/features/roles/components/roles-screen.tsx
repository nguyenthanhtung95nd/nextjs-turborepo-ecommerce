"use client";

import Link from "next/link";
import { AlertTriangle, KeyRound, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@repo/ui/button";
import { pluralize } from "@repo/ui/format";
import { StatePanel } from "@/components/state-panel";
import { TABLE_SURFACE } from "@/components/responsive-table";
import { usePermissionCatalog, useRoles } from "../api/use-roles";
import { CreateRoleDialog } from "./create-role-dialog";
import { RoleTable } from "./role-table";
import { RolesSkeleton } from "./roles-skeleton";

export function RolesScreen() {
  const roles = useRoles();
  const permissions = usePermissionCatalog();

  if (roles.isPending) return <RolesSkeleton />;

  if (roles.isError) {
    return (
      <div className={TABLE_SURFACE}>
        <StatePanel
          tone="destructive"
          icon={<AlertTriangle className="size-5" />}
          title="Couldn't load roles"
          description="Something went wrong on our side. The details have been logged — try again in a moment."
        >
          <Button variant="outline" onClick={() => void roles.refetch()}>
            Try again
          </Button>
        </StatePanel>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          {/* The catalog count only describes the list; a failure there must not blank it. */}
          {permissions.data && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pluralize(roles.data.length, "role", "roles")} ·{" "}
              {pluralize(permissions.data.length, "permission", "permissions")} in the catalog
            </p>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href="/roles/permissions" className={buttonVariants({ variant: "outline" })}>
            <KeyRound aria-hidden="true" />
            View permissions
          </Link>
          <CreateRoleDialog />
        </div>
      </div>

      <div className={TABLE_SURFACE}>
        {roles.data.length === 0 ? (
          <StatePanel
            icon={<ShieldCheck className="size-5" />}
            title="No roles yet"
            description="Create a role, then give it permissions. Users with no role are customers and cannot reach the admin area."
          >
            <CreateRoleDialog />
          </StatePanel>
        ) : (
          <div className="overflow-x-auto">
            <RoleTable rows={roles.data} />
          </div>
        )}
      </div>
    </>
  );
}
