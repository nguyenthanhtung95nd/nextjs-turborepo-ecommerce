import { buildListHref } from "@repo/ui/list-href";
import type { UserListParams } from "@repo/contracts";

export const USERS_ROUTE = "/users";

const DEFAULTS: UserListParams = { q: "", role: "", status: "ALL", page: 1 };

export function usersHref(params: UserListParams, overrides: Partial<UserListParams> = {}): string {
  return buildListHref(USERS_ROUTE, DEFAULTS, params, overrides);
}

/** True when any filter is narrowing the list — drives the "clear filters" affordances. */
export function hasActiveFilters(params: UserListParams): boolean {
  return params.q !== "" || params.role !== "" || params.status !== "ALL";
}
