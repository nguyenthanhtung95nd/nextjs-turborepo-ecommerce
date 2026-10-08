import type {
  PermissionAssignmentInput,
  PermissionOptionDto,
  RoleDetailDto,
  RoleFormInput,
  RoleRowDto,
} from "@repo/contracts";
import { apiClient } from "@/services/api-client";

export type RoleRow = RoleRowDto;
export type RoleDetail = RoleDetailDto;

/** Every role, alphabetically. Unpaginated: roles exist to be compared with each other. */
export async function fetchRoles(): Promise<RoleRow[]> {
  const { data } = await apiClient.get<RoleRowDto[]>("/roles");
  return data;
}

export async function fetchRole(id: string): Promise<RoleDetail> {
  const { data } = await apiClient.get<RoleDetailDto>(`/roles/${encodeURIComponent(id)}`);
  return data;
}

export async function fetchPermissions(): Promise<PermissionOptionDto[]> {
  const { data } = await apiClient.get<PermissionOptionDto[]>("/permissions");
  return data;
}

export async function fetchRoleCount(): Promise<number> {
  const { data } = await apiClient.get<{ total: number }>("/roles/count");
  return data.total;
}

export async function createRole(input: RoleFormInput): Promise<void> {
  await apiClient.post("/roles", input);
}

export async function updateRole(id: string, input: RoleFormInput): Promise<void> {
  await apiClient.patch(`/roles/${encodeURIComponent(id)}`, input);
}

export async function updateRolePermissions(
  id: string,
  input: PermissionAssignmentInput,
): Promise<void> {
  await apiClient.patch(`/roles/${encodeURIComponent(id)}/permissions`, input);
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/roles/${encodeURIComponent(id)}`);
}
