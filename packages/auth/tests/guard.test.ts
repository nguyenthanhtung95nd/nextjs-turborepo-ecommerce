import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the NextAuth instance so importing the guard doesn't boot NextAuth(); we drive auth()
// directly to exercise the permission gate in isolation.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("../src/server", () => ({ auth: authMock }));

import { ForbiddenError, requirePermission } from "../src/guard";

beforeEach(() => authMock.mockReset());

describe("requirePermission", () => {
  it("returns the session when the permission is present", async () => {
    const session = { user: { id: "1", permissions: ["product:delete"] } };
    authMock.mockResolvedValue(session);
    await expect(requirePermission("product:delete")).resolves.toBe(session);
  });

  it("throws ForbiddenError (403) when the permission is missing", async () => {
    authMock.mockResolvedValue({ user: { id: "1", permissions: ["product:read"] } });
    const error = await requirePermission("product:delete").catch((e) => e);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.status).toBe(403);
  });

  it("throws ForbiddenError (403) for an anonymous session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requirePermission("product:read")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
