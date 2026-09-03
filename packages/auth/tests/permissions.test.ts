import { describe, expect, it } from "vitest";
import { PERMISSIONS, hasPermission, permissionUnion } from "../src/permissions";

describe("permissionUnion", () => {
  it("dedupes permissions across multiple roles", () => {
    const union = permissionUnion([
      ["product:read", "product:create"],
      ["product:read", "category:manage"],
    ]);
    expect(union.sort()).toEqual(["category:manage", "product:create", "product:read"]);
  });

  it("returns an empty array when the user has no roles", () => {
    expect(permissionUnion([])).toEqual([]);
  });

  it("returns an empty array for a role with no permissions", () => {
    expect(permissionUnion([[]])).toEqual([]);
  });
});

describe("hasPermission", () => {
  const session = { user: { id: "1", permissions: ["product:read", "user:manage"] } } as never;

  it("is true when the session carries the permission", () => {
    expect(hasPermission(session, "user:manage")).toBe(true);
  });

  it("is false when the permission is absent", () => {
    expect(hasPermission(session, "role:manage")).toBe(false);
  });

  it("is false for a null session", () => {
    expect(hasPermission(null, "product:read")).toBe(false);
  });

  it("is false when the session carries no permissions array", () => {
    expect(hasPermission({ user: { id: "1" } } as never, "product:read")).toBe(false);
  });

  it("is false when the session has no user", () => {
    expect(hasPermission({} as never, "product:read")).toBe(false);
  });
});

describe("PERMISSIONS catalog", () => {
  it("holds exactly the 8 seeded keys", () => {
    expect([...PERMISSIONS].sort()).toEqual(
      [
        "brand:manage",
        "category:manage",
        "product:create",
        "product:delete",
        "product:read",
        "product:update",
        "role:manage",
        "user:manage",
      ].sort(),
    );
  });
});
