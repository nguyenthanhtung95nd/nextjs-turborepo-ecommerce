import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateUserInput,
  PageDto,
  RoleAssignmentInput,
  UserCountsDto,
  UserDetailDto,
  UserListParams,
  UserProfileInput,
  UserRowDto,
} from "@repo/contracts";
import { USERS_PAGE_SIZE } from "@repo/contracts";
import type { Prisma } from "@prisma/client";
import { FOREIGN_KEY_VIOLATION, UNIQUE_VIOLATION, prismaErrorCode } from "../prisma/prisma-error";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

const BCRYPT_COST = 10;
const NUMERIC_ID = /^\d+$/;

const ROW_SELECT = {
  id: true,
  email: true,
  name: true,
  is_active: true,
  created_at: true,
  user_roles: { select: { roles: { select: { name: true } } } },
} satisfies Prisma.usersSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Rows and total come from one transaction, so the count always describes the rows shown. */
  async list(params: UserListParams): Promise<PageDto<UserRowDto>> {
    const where = buildWhere(params);
    const [records, total] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (params.page - 1) * USERS_PAGE_SIZE,
        take: USERS_PAGE_SIZE,
        select: ROW_SELECT,
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id.toString(),
        email: record.email,
        name: record.name,
        isActive: record.is_active,
        roleNames: record.user_roles.map((link) => link.roles.name).sort(),
        createdAt: record.created_at.toISOString(),
      })),
      total,
      page: params.page,
      pageCount: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
    };
  }

  async counts(): Promise<UserCountsDto> {
    const [total, staff, deactivated] = await this.prisma.$transaction([
      this.prisma.users.count(),
      this.prisma.users.count({ where: { user_roles: { some: {} } } }),
      this.prisma.users.count({ where: { is_active: false } }),
    ]);
    return { total, staff, deactivated };
  }

  async findOne(id: string): Promise<UserDetailDto> {
    const record = await this.prisma.users.findUnique({
      where: { id: toId(id) },
      select: {
        id: true,
        email: true,
        name: true,
        is_active: true,
        created_at: true,
        user_roles: { select: { role_id: true } },
      },
    });
    if (!record) throw new NotFoundException("User not found.");

    return {
      id: record.id.toString(),
      email: record.email,
      name: record.name,
      isActive: record.is_active,
      createdAt: record.created_at.toISOString(),
      assignedRoleIds: record.user_roles.map((link) => link.role_id.toString()),
    };
  }

  async create(input: CreateUserInput): Promise<{ id: string }> {
    const roleIds = input.roleIds.map(BigInt);

    try {
      const created = await this.prisma.users.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name === "" ? null : input.name,
          password_hash: await bcrypt.hash(input.password, BCRYPT_COST),
          is_active: true,
          user_roles: { create: roleIds.map((role_id) => ({ role_id })) },
        },
      });
      return { id: created.id.toString() };
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  async updateProfile(id: string, input: UserProfileInput): Promise<void> {
    try {
      await this.prisma.users.update({
        where: { id: toId(id) },
        data: { name: input.name === "" ? null : input.name },
      });
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  /**
   * Replaces a user's roles with exactly the set given, in one transaction.
   *
   * @throws {ConflictException} when callers would strip their own `user:manage`. Recovering from
   * that needs database access, so it is refused here rather than hidden in the UI.
   */
  async setRoles(id: string, input: RoleAssignmentInput, callerId: bigint): Promise<void> {
    const userId = toId(id);
    const roleIds = input.roleIds.map(BigInt);

    if (userId === callerId && !(await this.grantsUserManage(roleIds))) {
      throw new ConflictException(
        "You can't remove your own permission to manage users. Ask another admin to do it.",
      );
    }

    try {
      await this.prisma.$transaction([
        this.prisma.user_roles.deleteMany({ where: { user_id: userId } }),
        this.prisma.user_roles.createMany({
          data: roleIds.map((role_id) => ({ user_id: userId, role_id })),
        }),
      ]);
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  /** @throws {ConflictException} when callers would deactivate themselves. */
  async setActive(id: string, isActive: boolean, callerId: bigint): Promise<void> {
    const userId = toId(id);
    if (!isActive && userId === callerId) {
      throw new ConflictException("You can't deactivate your own account.");
    }

    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: { is_active: isActive },
      });
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  private async grantsUserManage(roleIds: bigint[]): Promise<boolean> {
    if (roleIds.length === 0) return false;
    const matching = await this.prisma.role_permissions.count({
      where: { role_id: { in: roleIds }, permissions: { key: "user:manage" } },
    });
    return matching > 0;
  }
}

function buildWhere(params: UserListParams): Prisma.usersWhereInput {
  return {
    ...(params.q
      ? {
          OR: [
            { email: { contains: params.q, mode: "insensitive" as const } },
            { name: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(params.status === "ALL" ? {} : { is_active: params.status === "ACTIVE" }),
    ...(params.role ? { user_roles: { some: { roles: { name: params.role } } } } : {}),
  };
}

function toId(id: string): bigint {
  if (!NUMERIC_ID.test(id)) throw new NotFoundException("User not found.");
  return BigInt(id);
}

function toWriteFailure(error: unknown): Error {
  const code = prismaErrorCode(error);
  if (code === UNIQUE_VIOLATION) {
    return new ConflictException("An account with this email already exists.");
  }
  if (code === FOREIGN_KEY_VIOLATION) {
    return new ConflictException("One of the selected roles no longer exists. Reload and retry.");
  }
  if (code === "P2025") return new NotFoundException("User not found.");
  return error instanceof Error ? error : new Error(String(error));
}
