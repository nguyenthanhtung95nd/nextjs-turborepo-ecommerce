"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateUserInput,
  RoleAssignmentInput,
  UserListParams,
  UserProfileInput,
} from "@repo/contracts";
import {
  createUser,
  fetchRoleOptions,
  fetchUser,
  fetchUserCounts,
  fetchUsers,
  setUserActive,
  updateUserProfile,
  updateUserRoles,
} from "../services";

export function useUsers(params: UserListParams) {
  return useQuery({ queryKey: ["users", "list", params], queryFn: () => fetchUsers(params) });
}

export function useUserCounts(enabled = true) {
  return useQuery({ queryKey: ["users", "counts"], queryFn: fetchUserCounts, enabled });
}

export function useUser(id: string) {
  return useQuery({ queryKey: ["users", "detail", id], queryFn: () => fetchUser(id) });
}

/** Role names and ids for the filter and the assignment checklists. */
export function useRoleOptions() {
  return useQuery({ queryKey: ["roles", "options"], queryFn: fetchRoleOptions });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["users"] });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: invalidate,
  });
}

export function useUpdateUserRoles(id: string) {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: RoleAssignmentInput) => updateUserRoles(id, input),
    onSuccess: invalidate,
  });
}

export function useSetUserActive(id: string) {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (isActive: boolean) => setUserActive(id, isActive),
    onSuccess: invalidate,
  });
}

export function useUpdateUserProfile(id: string) {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: UserProfileInput) => updateUserProfile(id, input),
    onSuccess: invalidate,
  });
}
