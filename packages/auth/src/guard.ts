import type { Session } from "next-auth";
import { ApiError, apiFetch } from "@repo/api-client";
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

/**
 * The account behind this session has been deactivated, or no longer exists.
 *
 * Distinct from {@link ForbiddenError} because the remedy differs: a missing permission is
 * something an administrator can grant, a deactivated account cannot do anything at all.
 */
export class InactiveAccountError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden: the account is deactivated");
    this.name = "InactiveAccountError";
  }
}

/**
 * Is the account behind this session still live?
 *
 * Asked of the API on each call, because deactivation happens after sign-in and cannot reach a
 * token that has already been issued.
 */
/**
 * Whether the account behind a session may still act.
 *
 * Three outcomes, not two. The earlier version caught everything and returned `false`, so an API
 * that was merely unreachable was reported as a deactivated account — and the admin told people
 * their account had been disabled whenever the service was down. "unreachable" exists so the
 * caller can say what is actually true.
 */
export type SessionStatus = "active" | "inactive" | "unreachable";

export async function checkSession(session: Session | null | undefined): Promise<SessionStatus> {
  const token = session?.user?.accessToken;
  if (!token) return "inactive";

  try {
    await apiFetch("/auth/me", { token });
    return "active";
  } catch (error) {
    // A 401 is an answer: this token is no longer good. Anything else means we never got one.
    if (error instanceof ApiError && error.status === 401) return "inactive";
    if (error instanceof ApiError && error.status < 500) return "inactive";
    console.error("[auth] could not verify the session", error);
    return "unreachable";
  }
}

/**
 * @deprecated Prefer {@link checkSession}: this collapses "unreachable" into "not active", which
 * is what made a service outage look like a deactivated account.
 */
export async function isSessionActive(session: Session | null | undefined): Promise<boolean> {
  return (await checkSession(session)) === "active";
}

/**
 * The server-side gate for Server Components and server actions — hiding UI is cosmetic.
 *
 * @throws {InactiveAccountError} When the account has been deactivated.
 * @throws {ForbiddenError} When the session lacks `key`.
 */
export async function requirePermission(key: Permission) {
  const session = await auth();

  // No session at all is refused as a missing permission, not as a deactivated account: nobody
  // has been switched off, there is simply nobody here.
  if (!session?.user?.id) throw new ForbiddenError(key);

  if (!(await isSessionActive(session))) throw new InactiveAccountError();
  if (!hasPermission(session, key)) throw new ForbiddenError(key);
  return session;
}

/** The API credential for the signed-in caller, or `undefined` when anonymous. */
export async function sessionToken(): Promise<string | undefined> {
  const session = await auth();
  return session?.user?.accessToken || undefined;
}
