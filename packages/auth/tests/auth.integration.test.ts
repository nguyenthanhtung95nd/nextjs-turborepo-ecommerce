import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "../src/permissions";
import { loadUserPermissions, verifyCredentials } from "../src/user";

// DB-backed verification: proves the seeded SUPER_ADMIN authenticates via Credentials and
// that the resolved permission union is the full catalog. Requires the Docker DB
// (DATABASE_URL provided by vitest.config.ts); self-skips when the DB is unavailable.
const hasDb = Boolean(process.env.DATABASE_URL);
const ADMIN_EMAIL = "admin@local.dev";
const ADMIN_PASSWORD = "Admin123!";

describe.skipIf(!hasDb)("seeded admin authentication (integration)", () => {
  it("verifies the bcrypt credentials of the seeded admin", async () => {
    const user = await verifyCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(user).not.toBeNull();
    expect(user?.email).toBe(ADMIN_EMAIL);
  });

  it("rejects a wrong password", async () => {
    expect(await verifyCredentials(ADMIN_EMAIL, "wrong-password")).toBeNull();
  });

  it("resolves the full SUPER_ADMIN permission union from the JWT source", async () => {
    const user = await verifyCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
    const permissions = await loadUserPermissions(BigInt(user!.id));
    expect(permissions.slice().sort()).toEqual([...PERMISSIONS].sort());
  });
});
