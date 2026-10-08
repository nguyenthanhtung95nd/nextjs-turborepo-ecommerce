"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ApiError } from "@repo/api-client";
import { buttonVariants } from "@repo/ui/button";
import { formatDate } from "@repo/ui/format";
import { NotFoundPanel } from "@/components/not-found-panel";
import { useRoleOptions, useUser } from "../api/use-users";
import { USERS_ROUTE } from "../url";
import { UserProfileForm } from "./user-profile-form";
import { UserRolesForm } from "./user-roles-form";
import { UserStatusPanel } from "./user-status-panel";
import { UsersSkeleton } from "./users-skeleton";

/**
 * @param signedInUserId - who is looking, so the screen can say "this is you" and the status
 * panel can refuse to deactivate the account doing the deactivating.
 */
export function UserDetailScreen({ id, signedInUserId }: { id: string; signedInUserId: string }) {
  const user = useUser(id);
  const roles = useRoleOptions();

  if (user.isPending || roles.isPending) return <UsersSkeleton />;

  if (user.isError) {
    const missing = user.error instanceof ApiError && user.error.status === 404;
    return (
      <NotFoundPanel
        title={missing ? "User not found" : "Couldn't load this user"}
        description={
          missing
            ? "The account may have been removed while this page was open."
            : "Something went wrong on our side. The details have been logged."
        }
        backHref={USERS_ROUTE}
        backLabel="All users"
      />
    );
  }

  const isSelf = user.data.id === signedInUserId;

  return (
    <>
      <div className="mb-5">
        <Link
          href={USERS_ROUTE}
          className={`${buttonVariants({ variant: "ghost", size: "sm" })} -ml-3 mb-2`}
        >
          <ChevronLeft aria-hidden="true" />
          All users
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.data.name ?? user.data.email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.data.email}
          {isSelf && " · this is you"}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-5">
          <UserRolesForm
            userId={user.data.id}
            roles={roles.data ?? []}
            assignedRoleIds={user.data.assignedRoleIds}
          />
        </div>

        <aside className="grid min-w-0 gap-5">
          <UserProfileForm
            userId={user.data.id}
            email={user.data.email}
            name={user.data.name}
            joined={formatDate(user.data.createdAt)}
          />
          <UserStatusPanel userId={user.data.id} isActive={user.data.isActive} isSelf={isSelf} />
        </aside>
      </div>
    </>
  );
}
