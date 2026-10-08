"use client";

import { useRouter } from "next/navigation";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { UrlSearchField } from "@/components/url-search-field";
import { USER_STATUS_FILTERS, type UserListParams, type UserStatusFilter } from "@repo/contracts";
import { usersHref } from "@/features/users/url";

const STATUS_LABELS: Record<UserStatusFilter, string> = {
  ALL: "Any status",
  ACTIVE: "Active",
  INACTIVE: "Deactivated",
};

interface Props {
  params: UserListParams;
  /** Role names come from the database, so the options are passed in rather than hardcoded. */
  roleNames: readonly string[];
}

export function UsersToolbar({ params, roleNames }: Props) {
  const router = useRouter();

  // Any filter change invalidates the current page number, so every navigation resets to page 1.
  function navigate(overrides: Partial<UserListParams>) {
    router.push(usersHref(params, { ...overrides, page: 1 }), { scroll: false });
  }

  return (
    <search className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_11rem]">
      <UrlSearchField
        id="user-search"
        label="Search by name or email"
        placeholder="e.g. minh@local.dev"
        urlValue={params.q}
        hrefFor={(q) => usersHref(params, { q, page: 1 })}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-role" className="text-xs text-muted-foreground">
          Role
        </Label>
        <Select
          id="user-role"
          value={params.role}
          onChange={(event) => navigate({ role: event.target.value })}
        >
          <option value="">Any role</option>
          {roleNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-status" className="text-xs text-muted-foreground">
          Status
        </Label>
        <Select
          id="user-status"
          value={params.status}
          onChange={(event) => navigate({ status: event.target.value as UserStatusFilter })}
        >
          {USER_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>
    </search>
  );
}
