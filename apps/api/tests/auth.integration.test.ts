import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { PERMISSIONS } from "@repo/contracts";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuthService } from "../src/auth/auth.service";

// Proves the seeded admin authenticates against the real database and resolves the full
// permission catalog. Self-skips when no database is configured.
const hasDb = Boolean(process.env.DATABASE_URL);

const ADMIN_EMAIL = "admin@local.dev";
const ADMIN_PASSWORD = "Admin123!";

const service = new AuthService(new PrismaService(), {
  signAsync: async () => "test.token",
} as never);

describe.skipIf(!hasDb)("seeded admin authentication (integration)", () => {
  it("verifies the bcrypt credentials of the seeded admin", async () => {
    const user = await service.login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(user.email).toBe(ADMIN_EMAIL);
    expect(user.accessToken).toBeTruthy();
  });

  it("rejects a wrong password", async () => {
    await expect(
      service.login({ email: ADMIN_EMAIL, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  /** The admin must keep every permission, or the back office locks itself out. */
  it("resolves the full permission catalog for the seeded admin", async () => {
    const user = await service.login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(user.permissions.sort()).toEqual([...PERMISSIONS].sort());
  });

  it("reports the same user through currentUser as through login", async () => {
    const signedIn = await service.login({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    const current = await service.currentUser(BigInt(signedIn.id));

    expect(current.email).toBe(signedIn.email);
    expect(current.permissions.sort()).toEqual(signedIn.permissions.sort());
  });
});
