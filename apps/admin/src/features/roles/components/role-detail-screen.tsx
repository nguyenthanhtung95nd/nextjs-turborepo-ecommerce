"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ApiError } from "@repo/api-client";
import { buttonVariants } from "@repo/ui/button";
import { pluralize } from "@repo/ui/format";
import { NotFoundPanel } from "@/components/not-found-panel";
import { usePermissionCatalog, useRole } from "../api/use-roles";
import { RoleDangerZone } from "./role-danger-zone";
import { RoleDetailsForm } from "./role-details-form";
import { RolePermissionsForm } from "./role-permissions-form";
import { RolesSkeleton } from "./roles-skeleton";

export function RoleDetailScreen({ id }: { id: string }) {
  const role = useRole(id);
  const permissions = usePermissionCatalog();

  if (role.isPending || permissions.isPending) return <RolesSkeleton />;

  if (role.isError) {
    const missing = role.error instanceof ApiError && role.error.status === 404;
    return (
      <NotFoundPanel
        title={missing ? "Role not found" : "Couldn't load this role"}
        description={
          missing
            ? "It may have been deleted while this page was open."
            : "Something went wrong on our side. The details have been logged."
        }
        backHref="/roles"
        backLabel="All roles"
      />
    );
  }

  return (
    <>
      <div className="mb-5">
        <Link
          href="/roles"
          className={`${buttonVariants({ variant: "ghost", size: "sm" })} -ml-3 mb-2`}
        >
          <ChevronLeft aria-hidden="true" />
          All roles
        </Link>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{role.data.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role.data.description ?? "No description."} ·{" "}
          {pluralize(role.data.userCount, "holder", "holders")}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-5">
          <RolePermissionsForm
            roleId={role.data.id}
            permissions={permissions.data ?? []}
            assignedPermissionIds={role.data.assignedPermissionIds}
          />
        </div>

        <aside className="grid min-w-0 gap-5">
          <RoleDetailsForm
            roleId={role.data.id}
            name={role.data.name}
            description={role.data.description}
          />
          <RoleDangerZone
            roleId={role.data.id}
            roleName={role.data.name}
            userCount={role.data.userCount}
          />
        </aside>
      </div>
    </>
  );
}
