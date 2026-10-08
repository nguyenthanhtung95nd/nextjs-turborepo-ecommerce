import type {
  CreateUserInput,
  PageDto,
  RoleAssignmentInput,
  RoleOptionDto,
  UserCountsDto,
  UserDetailDto,
  UserListParams,
  UserProfileInput,
  UserRowDto,
} from "@repo/contracts";
import { apiClient } from "@/services/api-client";

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  roleNames: string[];
  createdAt: Date;
}

export interface UserListResult {
  rows: UserRow[];
  total: number;
  page: number;
  pageCount: number;
}

export interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
  assignedRoleIds: string[];
}

export type RoleOption = RoleOptionDto;
export type UserCounts = UserCountsDto;

function toQuery(params: UserListParams): string {
  const search = new URLSearchParams({ status: params.status, page: String(params.page) });
  if (params.q) search.set("q", params.q);
  if (params.role) search.set("role", params.role);
  return search.toString();
}

/** One page of users matching the URL filters, newest first. */
export async function fetchUsers(params: UserListParams): Promise<UserListResult> {
  const { data } = await apiClient.get<PageDto<UserRowDto>>(`/users?${toQuery(params)}`);

  return {
    rows: data.items.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })),
    total: data.total,
    page: data.page,
    pageCount: data.pageCount,
  };
}

export async function fetchUserCounts(): Promise<UserCounts> {
  const { data } = await apiClient.get<UserCountsDto>("/users/counts");
  return data;
}

export async function fetchUser(id: string): Promise<UserDetail> {
  const { data } = await apiClient.get<UserDetailDto>(`/users/${encodeURIComponent(id)}`);
  return { ...data, createdAt: new Date(data.createdAt) };
}

export async function fetchRoleOptions(): Promise<RoleOption[]> {
  const { data } = await apiClient.get<RoleOptionDto[]>("/roles/options");
  return data;
}

export async function createUser(input: CreateUserInput): Promise<void> {
  await apiClient.post("/users", input);
}

export async function updateUserRoles(id: string, input: RoleAssignmentInput): Promise<void> {
  await apiClient.patch(`/users/${encodeURIComponent(id)}/roles`, input);
}

export async function setUserActive(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/users/${encodeURIComponent(id)}/status`, { isActive });
}

export async function updateUserProfile(id: string, input: UserProfileInput): Promise<void> {
  await apiClient.patch(`/users/${encodeURIComponent(id)}`, input);
}

export interface RecentUser {
  id: string;
  label: string;
  email: string;
  createdAt: Date;
}

/** The newest accounts, for the dashboard. */
export async function fetchRecentUsers(limit: number): Promise<RecentUser[]> {
  const { data } = await apiClient.get<PageDto<UserRowDto>>("/users?status=ALL&page=1");

  return data.items.slice(0, limit).map((item) => ({
    id: item.id,
    label: item.name ?? item.email,
    email: item.email,
    createdAt: new Date(item.createdAt),
  }));
}
