// Public API of @repo/auth. `./types` is imported first so the Session augmentation loads.
import "./types";

export { handlers, auth, signIn, signOut } from "./server";
export { authConfig } from "./config";
export { PERMISSIONS, permissionUnion, hasPermission, type Permission } from "./permissions";
export { requirePermission, ForbiddenError } from "./guard";
export { verifyCredentials, loadUserPermissions, type AuthUser } from "./user";
