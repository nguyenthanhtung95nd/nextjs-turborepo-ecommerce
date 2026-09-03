import type { Session } from "next-auth";

// The permission catalog and the code-side source of truth. These keys MUST match
// database/seed/reference/01_permissions.sql — the RBAC checks only work if both agree.
export const PERMISSIONS = [
  "product:create",
  "product:read",
  "product:update",
  "product:delete",
  "category:manage",
  "brand:manage",
  "user:manage",
  "role:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Flatten every role's permission keys into one deduped list. Pure (no DB) so it can be
// unit-tested directly; the jwt callback feeds it a user's real roles at sign-in.
export function permissionUnion(rolePermissionKeys: readonly (readonly string[])[]): string[] {
  return [...new Set(rolePermissionKeys.flat())];
}

export function hasPermission(session: Session | null | undefined, key: Permission): boolean {
  const perms = session?.user?.permissions;
  return Array.isArray(perms) && perms.includes(key);
}
