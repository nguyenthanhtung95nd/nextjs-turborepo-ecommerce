import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { AuthService } from "../src/auth/auth.service";

const PASSWORD = "Admin123!";
let passwordHash: string;

beforeEach(async () => {
  passwordHash ??= await bcrypt.hash(PASSWORD, 4);
});

function serviceWith(user: Record<string, unknown> | null) {
  const findUnique = vi.fn().mockResolvedValue(user);
  const create = vi.fn();
  const update = vi.fn();
  const prisma = { users: { findUnique, create, update } };
  const jwt = { signAsync: vi.fn().mockResolvedValue("signed.jwt.token") };

  return {
    service: new AuthService(prisma as never, jwt as never),
    findUnique,
    create,
    update,
    jwt,
  };
}

const ACTIVE_USER = () => ({
  id: 1n,
  email: "admin@local.dev",
  name: "Local Admin",
  is_active: true,
  password_hash: passwordHash,
  user_roles: [],
});

describe("AuthService.login", () => {
  /**
   * One message for three different causes. Telling them apart turns the endpoint into a tool
   * for discovering which addresses have accounts.
   */
  it.each([
    ["an unknown email", null],
    ["a deactivated account", () => ({ ...ACTIVE_USER(), is_active: false })],
  ])("refuses %s with the same message as a wrong password", async (_label, build) => {
    const { service } = serviceWith(typeof build === "function" ? build() : build);

    const error = await service
      .login({ email: "admin@local.dev", password: PASSWORD })
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as Error).message).toBe("Invalid email or password.");
  });

  it("refuses a wrong password with that same message", async () => {
    const { service } = serviceWith(ACTIVE_USER());

    const error = await service
      .login({ email: "admin@local.dev", password: "not-the-password" })
      .catch((e: Error) => e);

    expect((error as Error).message).toBe("Invalid email or password.");
  });

  it("returns the user, their permissions and a token on success", async () => {
    const { service, jwt } = serviceWith(ACTIVE_USER());

    const result = await service.login({ email: "admin@local.dev", password: PASSWORD });

    expect(result).toMatchObject({
      id: "1",
      email: "admin@local.dev",
      accessToken: "signed.jwt.token",
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: "1", email: "admin@local.dev" });
  });

  /** JSON has no bigint, so the id crosses the wire as a string everywhere. */
  it("serialises the id as a string", async () => {
    const { service } = serviceWith(ACTIVE_USER());
    const result = await service.login({ email: "admin@local.dev", password: PASSWORD });

    expect(typeof result.id).toBe("string");
  });
});

describe("AuthService.register", () => {
  it("stores a hash, never the password itself", async () => {
    const { service, create } = serviceWith(null);
    create.mockResolvedValue({ id: 2n, email: "new@example.test", name: null, user_roles: [] });

    await service.register({
      name: "",
      email: "new@example.test",
      password: PASSWORD,
      confirmPassword: PASSWORD,
    });

    const stored = create.mock.calls[0]![0].data.password_hash as string;
    expect(stored).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, stored)).toBe(true);
  });

  it("stores an empty name as null rather than an empty string", async () => {
    const { service, create } = serviceWith(null);
    create.mockResolvedValue({ id: 2n, email: "new@example.test", name: null, user_roles: [] });

    await service.register({
      name: "",
      email: "new@example.test",
      password: PASSWORD,
      confirmPassword: PASSWORD,
    });

    expect(create.mock.calls[0]![0].data.name).toBeNull();
  });

  it("reports a taken email as a conflict, not a server error", async () => {
    const { service, create } = serviceWith(null);
    create.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));

    await expect(
      service.register({
        name: "",
        email: "taken@example.test",
        password: PASSWORD,
        confirmPassword: PASSWORD,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe("AuthService.currentUser", () => {
  /** A token issued before deactivation still looks valid; only the database knows. */
  it("refuses a deactivated account even with a valid token", async () => {
    const { service } = serviceWith({ ...ACTIVE_USER(), is_active: false });

    await expect(service.currentUser(1n)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refuses an id that no longer exists", async () => {
    const { service } = serviceWith(null);

    await expect(service.currentUser(999n)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe("AuthService.changePassword", () => {
  it("refuses when the current password is wrong, and writes nothing", async () => {
    const { service, update } = serviceWith(ACTIVE_USER());

    await expect(
      service.changePassword(1n, {
        currentPassword: "not-my-password",
        newPassword: "a-new-password",
        confirmPassword: "a-new-password",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes a new hash when the current password checks out", async () => {
    const { service, update } = serviceWith(ACTIVE_USER());

    await service.changePassword(1n, {
      currentPassword: PASSWORD,
      newPassword: "a-new-password",
      confirmPassword: "a-new-password",
    });

    const stored = update.mock.calls[0]![0].data.password_hash as string;
    expect(await bcrypt.compare("a-new-password", stored)).toBe(true);
  });
});

describe("AuthService.loadPermissions", () => {
  it("dedupes the union across roles", async () => {
    const { service } = serviceWith({
      user_roles: [
        {
          roles: {
            role_permissions: [
              { permissions: { key: "product:read" } },
              { permissions: { key: "product:update" } },
            ],
          },
        },
        { roles: { role_permissions: [{ permissions: { key: "product:read" } }] } },
      ],
    });

    const permissions = await service.loadPermissions(1n);

    expect(permissions.sort()).toEqual(["product:read", "product:update"]);
  });

  it("returns an empty list for a user with no roles, never null", async () => {
    const { service } = serviceWith({ user_roles: [] });

    expect(await service.loadPermissions(1n)).toEqual([]);
  });
});
