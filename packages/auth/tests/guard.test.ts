import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the NextAuth instance so importing the guard doesn't boot NextAuth(); we drive auth()
// directly to exercise the gate in isolation.
const { authMock, apiFetchMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  apiFetchMock: vi.fn(),
}));
vi.mock("../src/server", () => ({ auth: authMock }));
// Mocked at the transport, not at the guard: the guard asks the API whether the account is
// still live, and that call is exactly what these tests are about. `ApiError` is the real class
// so the guard's `instanceof` check means what it means in production.
vi.mock("@repo/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/api-client")>()),
  apiFetch: apiFetchMock,
}));

import { ApiError } from "@repo/api-client";
import {
  ForbiddenError,
  InactiveAccountError,
  checkSession,
  isSessionActive,
  requirePermission,
} from "../src/guard";

const TOKEN = "header.payload.signature";
const ACTIVE_ADMIN = {
  user: { id: "1", permissions: ["product:delete"], accessToken: TOKEN },
};

beforeEach(() => {
  authMock.mockReset();
  apiFetchMock.mockReset();
  apiFetchMock.mockResolvedValue({ id: "1", email: "admin@local.dev", permissions: [] });
});

describe("requirePermission", () => {
  it("returns the session when the account is active and holds the permission", async () => {
    authMock.mockResolvedValue(ACTIVE_ADMIN);
    await expect(requirePermission("product:delete")).resolves.toBe(ACTIVE_ADMIN);
  });

  it("throws ForbiddenError (403) when the permission is missing", async () => {
    authMock.mockResolvedValue({ user: { ...ACTIVE_ADMIN.user, permissions: ["product:read"] } });
    const error = await requirePermission("product:delete").catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.status).toBe(403);
  });

  // Nobody has been switched off — there is simply nobody here.
  it("throws ForbiddenError (403) for an anonymous session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requirePermission("product:read")).rejects.toBeInstanceOf(ForbiddenError);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  /**
   * The point of the liveness check: permissions are frozen into the JWT at sign-in, so a token
   * issued before deactivation still carries every one of them.
   */
  it("throws InactiveAccountError even when the token still carries the permission", async () => {
    authMock.mockResolvedValue(ACTIVE_ADMIN);
    apiFetchMock.mockRejectedValue(new ApiError(401, "This account is not active."));

    const error = await requirePermission("product:delete").catch((e) => e);
    expect(error).toBeInstanceOf(InactiveAccountError);
    expect(error.status).toBe(403);
  });

  it("checks liveness before the permission, so a deactivated account is never told to ask for one", async () => {
    authMock.mockResolvedValue({ user: { ...ACTIVE_ADMIN.user, permissions: [] } });
    apiFetchMock.mockRejectedValue(new ApiError(401, "This account is not active."));
    await expect(requirePermission("product:read")).rejects.toBeInstanceOf(InactiveAccountError);
  });

  it("asks the API on every call rather than trusting the session", async () => {
    authMock.mockResolvedValue(ACTIVE_ADMIN);
    await requirePermission("product:delete");
    expect(apiFetchMock).toHaveBeenCalledWith("/auth/me", { token: TOKEN });
  });
});

describe("isSessionActive", () => {
  it.each([[null], [undefined], [{}], [{ user: {} }]])("is false for %o", async (session) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising bad input
    await expect(isSessionActive(session as any)).resolves.toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it("defers to the API when the session carries a token", async () => {
    apiFetchMock.mockRejectedValue(new ApiError(401, "This account is not active."));
    await expect(isSessionActive(ACTIVE_ADMIN as never)).resolves.toBe(false);
    expect(apiFetchMock).toHaveBeenCalledWith("/auth/me", { token: TOKEN });
  });
});

describe("checkSession", () => {
  it("separates an unreachable API from a refused token", async () => {
    // The regression this guards: both used to come back as `false`, so an outage was reported
    // to the user as a deactivated account.
    apiFetchMock.mockRejectedValue(new ApiError(401, "This account is not active."));
    await expect(checkSession(ACTIVE_ADMIN as never)).resolves.toBe("inactive");

    apiFetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    await expect(checkSession(ACTIVE_ADMIN as never)).resolves.toBe("unreachable");

    apiFetchMock.mockRejectedValue(new ApiError(503, "Service unavailable."));
    await expect(checkSession(ACTIVE_ADMIN as never)).resolves.toBe("unreachable");
  });

  it("reports an active account, and a missing token without asking the API", async () => {
    apiFetchMock.mockResolvedValue({ id: "1", email: "admin@local.dev", permissions: [] });
    await expect(checkSession(ACTIVE_ADMIN as never)).resolves.toBe("active");

    apiFetchMock.mockClear();
    await expect(checkSession({ user: {} } as never)).resolves.toBe("inactive");
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
