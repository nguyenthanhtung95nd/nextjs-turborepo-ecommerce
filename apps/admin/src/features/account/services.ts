import type { AccountOverviewDto, ChangePasswordInput } from "@repo/contracts";
import { apiClient } from "@/services/api-client";

export interface AccountOverview {
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
  roleNames: string[];
  /** The union of every permission the roles grant. */
  permissionKeys: string[];
}

/**
 * The signed-in person's own record, read fresh rather than taken from the session.
 *
 * The session's permission list was frozen at sign-in, so showing it would tell someone their
 * access is something it no longer is.
 */
export async function fetchAccountOverview(): Promise<AccountOverview> {
  const { data } = await apiClient.get<AccountOverviewDto>("/account");
  return { ...data, createdAt: new Date(data.createdAt) };
}

export async function changeOwnPassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.post("/account/password", input);
}
