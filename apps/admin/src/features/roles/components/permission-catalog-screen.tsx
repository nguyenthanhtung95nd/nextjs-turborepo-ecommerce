"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@repo/ui/button";
import { pluralize } from "@repo/ui/format";
import { usePermissionCatalog } from "../api/use-roles";
import { PermissionCatalog } from "./permission-catalog";
import { RolesSkeleton } from "./roles-skeleton";

export function PermissionCatalogScreen() {
  const permissions = usePermissionCatalog();

  if (permissions.isPending) return <RolesSkeleton />;

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
        <h1 className="text-2xl font-semibold tracking-tight">Permission catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pluralize(permissions.data?.length ?? 0, "permission", "permissions")} a role can grant.
        </p>
      </div>

      <PermissionCatalog permissions={permissions.data ?? []} />
    </>
  );
}
