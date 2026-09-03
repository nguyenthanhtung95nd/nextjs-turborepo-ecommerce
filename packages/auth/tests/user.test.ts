import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma client so these are fast, deterministic unit tests (no DB, no mutations).
// bcrypt stays REAL — verified against the same hash the dev seed uses for "Admin123!".
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@repo/db", () => ({ prisma: { users: { findUnique } } }));

import { loadUserPermissions, verifyCredentials } from "../src/user";

const HASH = "$2b$10$lQs04oBAnBld1UYBAABhr.D/inYYznZ4.Dg6Unb0AS.Q7P.tCQBHu"; // bcrypt("Admin123!")

beforeEach(() => findUnique.mockReset());

describe("verifyCredentials", () => {
  it("returns null for an unknown email", async () => {
    findUnique.mockResolvedValue(null);
    expect(await verifyCredentials("nobody@local.dev", "Admin123!")).toBeNull();
  });

  it("returns null for an inactive account", async () => {
    findUnique.mockResolvedValue({
      id: 1n,
      email: "staff@local.dev",
      name: null,
      is_active: false,
      password_hash: HASH,
    });
    expect(await verifyCredentials("staff@local.dev", "Admin123!")).toBeNull();
  });

  it("returns null for a wrong password", async () => {
    findUnique.mockResolvedValue({
      id: 1n,
      email: "staff@local.dev",
      name: null,
      is_active: true,
      password_hash: HASH,
    });
    expect(await verifyCredentials("staff@local.dev", "not-the-password")).toBeNull();
  });

  it("returns the user with a string id for valid credentials", async () => {
    findUnique.mockResolvedValue({
      id: 42n,
      email: "staff@local.dev",
      name: "Staff",
      is_active: true,
      password_hash: HASH,
    });
    expect(await verifyCredentials("staff@local.dev", "Admin123!")).toEqual({
      id: "42",
      email: "staff@local.dev",
      name: "Staff",
    });
  });
});

describe("loadUserPermissions", () => {
  const shape = (roles: string[][]) => ({
    user_roles: roles.map((perms) => ({
      roles: { role_permissions: perms.map((key) => ({ permissions: { key } })) },
    })),
  });

  it("returns [] for a non-existent user", async () => {
    findUnique.mockResolvedValue(null);
    expect(await loadUserPermissions(1n)).toEqual([]);
  });

  it("returns [] for a user with no roles (a customer)", async () => {
    findUnique.mockResolvedValue(shape([]));
    expect(await loadUserPermissions(1n)).toEqual([]);
  });

  it("returns the deduped union across multiple roles", async () => {
    findUnique.mockResolvedValue(
      shape([
        ["product:read", "product:create"],
        ["product:read", "user:manage"],
      ]),
    );
    expect((await loadUserPermissions(1n)).sort()).toEqual([
      "product:create",
      "product:read",
      "user:manage",
    ]);
  });
});
