import { hasPermission, type Permission } from "./permissions";
import { auth } from "./server";

// Missing-permission error; callers translate `status` into an HTTP 403 response.
export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(permission: Permission) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "ForbiddenError";
  }
}

// The REAL server-side gate for Server Components and server actions (hiding UI is only
// cosmetic). Throws ForbiddenError when the session lacks `key`; returns it when authorized.
export async function requirePermission(key: Permission) {
  const session = await auth();
  if (!hasPermission(session, key)) throw new ForbiddenError(key);
  return session;
}
