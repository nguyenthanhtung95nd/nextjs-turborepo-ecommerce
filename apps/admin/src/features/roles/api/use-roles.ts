"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionAssignmentInput, RoleFormInput } from "@repo/contracts";
import {
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRole,
  fetchRoleCount,
  fetchRoles,
  updateRole,
  updateRolePermissions,
} from "../services";

export function useRoles() {
  return useQuery({ queryKey: ["roles", "list"], queryFn: fetchRoles });
}

export function useRole(id: string) {
  return useQuery({ queryKey: ["roles", "detail", id], queryFn: () => fetchRole(id) });
}

export function usePermissionCatalog() {
  return useQuery({ queryKey: ["permissions"], queryFn: fetchPermissions });
}

export function useRoleCount(enabled = true) {
  return useQuery({ queryKey: ["roles", "count"], queryFn: fetchRoleCount, enabled });
}

/**
 * A role write can change what every user may do, so the user lists are invalidated too —
 * their role columns are built from this data.
 */
function useInvalidateRoles() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["roles"] });
    void queryClient.invalidateQueries({ queryKey: ["users"] });
  };
}

export function useCreateRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (input: RoleFormInput) => createRole(input),
    onSuccess: invalidate,
  });
}

export function useUpdateRole(id: string) {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (input: RoleFormInput) => updateRole(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateRolePermissions(id: string) {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (input: PermissionAssignmentInput) => updateRolePermissions(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({ mutationFn: (id: string) => deleteRole(id), onSuccess: invalidate });
}
