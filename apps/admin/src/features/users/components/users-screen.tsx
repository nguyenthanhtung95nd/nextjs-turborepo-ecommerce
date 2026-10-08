"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { USERS_PAGE_SIZE, userListParamsSchema } from "@repo/contracts";
import { Button } from "@repo/ui/button";
import { pluralize } from "@repo/ui/format";
import { Pagination } from "@/components/pagination";
import { StatePanel } from "@/components/state-panel";
import { TABLE_SURFACE } from "@/components/responsive-table";
import { useRoleOptions, useUserCounts, useUsers } from "../api/use-users";
import { usersHref } from "../url";
import { UserFilterChips } from "./active-filter-chips";
import { CreateUserDialog } from "./create-user-dialog";
import { UserTable } from "./user-table";
import { UsersEmptyState } from "./users-empty-state";
import { UsersSkeleton } from "./users-skeleton";
import { UsersToolbar } from "./users-toolbar";

export function UsersScreen() {
  // The URL is the only place the filters live, so the screen derives them rather than holding
  // them: a shared link and the back button then work without any extra wiring.
  const searchParams = useSearchParams();
  const params = userListParamsSchema.parse(Object.fromEntries(searchParams));

  const users = useUsers(params);
  const counts = useUserCounts();
  const roles = useRoleOptions();

  if (users.isPending) return <UsersSkeleton />;

  const roleNames = (roles.data ?? []).map((role) => role.name);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          {/* A failed count must not blank the list it only describes. */}
          {counts.data && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pluralize(counts.data.total, "user", "users")} · {counts.data.staff} staff ·{" "}
              {counts.data.deactivated} deactivated
            </p>
          )}
        </div>
        <div className="ml-auto">
          <CreateUserDialog roles={roles.data ?? []} />
        </div>
      </div>

      <UsersToolbar params={params} roleNames={roleNames} />
      <UserFilterChips params={params} />

      <div className={TABLE_SURFACE}>
        {users.isError ? (
          <StatePanel
            tone="destructive"
            icon={<AlertTriangle className="size-5" />}
            title="Couldn't load users"
            description="Something went wrong on our side. The details have been logged — try again in a moment."
          >
            <Button variant="outline" onClick={() => void users.refetch()}>
              Try again
            </Button>
          </StatePanel>
        ) : users.data.rows.length === 0 ? (
          <UsersEmptyState params={params} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <UserTable rows={users.data.rows} total={users.data.total} />
            </div>
            <Pagination
              page={users.data.page}
              pageCount={users.data.pageCount}
              total={users.data.total}
              pageSize={USERS_PAGE_SIZE}
              label="User list pages"
              hrefFor={(page) => usersHref(params, { page })}
            />
          </>
        )}
      </div>
    </>
  );
}
