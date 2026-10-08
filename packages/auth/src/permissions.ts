import type { Session } from "next-auth";
import type { Permission } from "@repo/contracts";

export { PERMISSIONS, permissionUnion, type Permission } from "@repo/contracts";

/** Whether a session carries a permission. UX only — the API re-checks on every request. */
export function hasPermission(session: Session | null | undefined, key: Permission): boolean {
  const granted = session?.user?.permissions;
  return Array.isArray(granted) && granted.includes(key);
}
