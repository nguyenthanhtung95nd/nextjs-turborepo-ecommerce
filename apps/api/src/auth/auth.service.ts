import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type {
  AccountOverviewDto,
  AuthenticatedUserDto,
  ChangePasswordInput,
  CurrentUserDto,
  LoginInput,
  RegisterInput,
} from "@repo/contracts";
import { permissionUnion } from "@repo/contracts";
import { UNIQUE_VIOLATION, prismaErrorCode } from "../prisma/prisma-error";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

// Matches the cost factor of the seeded hashes. bcrypt stores the cost inside each hash, so
// raising this does not invalidate anything — it only makes new hashes slower to verify.
const BCRYPT_COST = 10;

const INVALID_CREDENTIALS = "Invalid email or password.";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * @throws {UnauthorizedException} for an unknown email, a wrong password, or a deactivated
   * account — one message for all three, so the endpoint cannot be used to discover accounts.
   */
  async login(input: LoginInput): Promise<AuthenticatedUserDto> {
    const user = await this.prisma.users.findUnique({ where: { email: input.email } });
    if (!user?.is_active) throw new UnauthorizedException(INVALID_CREDENTIALS);
    if (!(await bcrypt.compare(input.password, user.password_hash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return this.issue(user.id, user.email, user.name);
  }

  /** @throws {ConflictException} when the email is already registered. */
  async register(input: RegisterInput): Promise<AuthenticatedUserDto> {
    try {
      const user = await this.prisma.users.create({
        data: {
          email: input.email,
          name: input.name === "" ? null : input.name,
          password_hash: await bcrypt.hash(input.password, BCRYPT_COST),
        },
      });
      return this.issue(user.id, user.email, user.name);
    } catch (error) {
      if (prismaErrorCode(error) === UNIQUE_VIOLATION) {
        throw new ConflictException("An account with that email already exists.");
      }
      throw error;
    }
  }

  /** @throws {UnauthorizedException} when the account has been deactivated since sign-in. */
  async currentUser(userId: bigint): Promise<CurrentUserDto> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user?.is_active) throw new UnauthorizedException("This account is not active.");

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      permissions: await this.loadPermissions(user.id),
    };
  }

  /**
   * Re-asking for the current password is what makes an unattended, still-signed-in browser a
   * smaller problem than it would otherwise be.
   */
  async changePassword(userId: bigint, input: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user?.is_active) throw new UnauthorizedException("This account is not active.");

    if (!(await bcrypt.compare(input.currentPassword, user.password_hash))) {
      throw new ConflictException("That isn't your current password.");
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: { password_hash: await bcrypt.hash(input.newPassword, BCRYPT_COST) },
    });
  }

  /**
   * The signed-in person's own record, read fresh from the database.
   *
   * The session's permission list was frozen at sign-in, so showing that instead would tell
   * someone their access is something it no longer is.
   */
  async overview(userId: bigint): Promise<AccountOverviewDto> {
    const record = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        is_active: true,
        created_at: true,
        user_roles: {
          select: {
            roles: {
              select: {
                name: true,
                role_permissions: { select: { permissions: { select: { key: true } } } },
              },
            },
          },
        },
      },
    });
    if (!record) throw new UnauthorizedException("This account is not active.");

    const permissionKeys = new Set<string>();
    for (const link of record.user_roles) {
      for (const grant of link.roles.role_permissions) permissionKeys.add(grant.permissions.key);
    }

    return {
      email: record.email,
      name: record.name,
      isActive: record.is_active,
      createdAt: record.created_at.toISOString(),
      roleNames: record.user_roles.map((link) => link.roles.name).sort(),
      permissionKeys: [...permissionKeys].sort(),
    };
  }

  /** A user's effective permissions: the deduped union across all of their roles. */
  async loadPermissions(userId: bigint): Promise<string[]> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        user_roles: {
          select: {
            roles: {
              select: { role_permissions: { select: { permissions: { select: { key: true } } } } },
            },
          },
        },
      },
    });
    if (!user) return [];

    return permissionUnion(
      user.user_roles.map((userRole) =>
        userRole.roles.role_permissions.map((rolePermission) => rolePermission.permissions.key),
      ),
    );
  }

  private async issue(
    id: bigint,
    email: string,
    name: string | null,
  ): Promise<AuthenticatedUserDto> {
    const permissions = await this.loadPermissions(id);
    // The id is a string in the token for the same reason it is one in every response body:
    // JSON has no bigint.
    const accessToken = await this.jwt.signAsync({ sub: id.toString(), email });

    return { id: id.toString(), email, name, permissions, accessToken };
  }
}
