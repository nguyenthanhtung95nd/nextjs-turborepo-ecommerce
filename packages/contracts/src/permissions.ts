/**
 * The permission catalog, and the code-side source of truth.
 *
 * These keys MUST match database/seed/reference/01_permissions.sql.
 */
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

/** Flattens every role's permission keys into one deduped list. */
export function permissionUnion(rolePermissionKeys: readonly (readonly string[])[]): string[] {
  return [...new Set(rolePermissionKeys.flat())];
}
