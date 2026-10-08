// Public API of @repo/auth. `./types` is imported first so the Session augmentation loads.
import "./types";

export { AuthError } from "next-auth";
export { handlers, auth, signIn, signOut } from "./server";
export { authConfig } from "./config";
export { PERMISSIONS, permissionUnion, hasPermission, type Permission } from "./permissions";
export {
  requirePermission,
  checkSession,
  type SessionStatus,
  isSessionActive,
  sessionToken,
  ForbiddenError,
  InactiveAccountError,
} from "./guard";
export { passwordField, MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "./password";
