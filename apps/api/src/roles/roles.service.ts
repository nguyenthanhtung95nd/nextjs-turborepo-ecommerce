import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  PermissionAssignmentInput,
  PermissionOptionDto,
  RoleDetailDto,
  RoleFormInput,
  RoleOptionDto,
  RoleRowDto,
} from "@repo/contracts";
import { UNIQUE_VIOLATION, prismaErrorCode } from "../prisma/prisma-error";
import { PrismaService } from "../prisma/prisma.service";
import { wouldOrphanRoleManage } from "./lockout";

/** The permission that guards the role screen itself — losing every holder is unrecoverable. */
const ROLE_MANAGE = "role:manage";
const NUMERIC_ID = /^\d+$/;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every role, alphabetically. Unpaginated: roles exist to be compared with each other. */
  async list(): Promise<RoleRowDto[]> {
    const records = await this.prisma.roles.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { role_permissions: true, user_roles: true } },
      },
    });

    return records.map((record) => ({
      id: record.id.toString(),
      name: record.name,
      description: record.description,
      permissionCount: record._count.role_permissions,
      userCount: record._count.user_roles,
    }));
  }

  async options(): Promise<RoleOptionDto[]> {
    const records = await this.prisma.roles.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
    return records.map((record) => ({ ...record, id: record.id.toString() }));
  }

  async count(): Promise<{ total: number }> {
    return { total: await this.prisma.roles.count() };
  }

  async findOne(id: string): Promise<RoleDetailDto> {
    const record = await this.prisma.roles.findUnique({
      where: { id: toId(id) },
      select: {
        id: true,
        name: true,
        description: true,
        role_permissions: { select: { permission_id: true } },
        _count: { select: { user_roles: true } },
      },
    });
    if (!record) throw new NotFoundException("Role not found.");

    return {
      id: record.id.toString(),
      name: record.name,
      description: record.description,
      userCount: record._count.user_roles,
      assignedPermissionIds: record.role_permissions.map((link) => link.permission_id.toString()),
    };
  }

  /**
   * The permission catalog, read-only.
   *
   * Rows are seeded from the same list the guards check, so editing them here would let the
   * database and the code that enforces them drift apart.
   */
  async listPermissions(): Promise<PermissionOptionDto[]> {
    const records = await this.prisma.permissions.findMany({
      select: { id: true, key: true, description: true },
      orderBy: { key: "asc" },
    });
    return records.map((record) => ({ ...record, id: record.id.toString() }));
  }

  async create(input: RoleFormInput): Promise<{ id: string }> {
    try {
      const created = await this.prisma.roles.create({
        data: {
          name: input.name,
          description: input.description === "" ? null : input.description,
        },
      });
      return { id: created.id.toString() };
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  async update(id: string, input: RoleFormInput): Promise<void> {
    try {
      await this.prisma.roles.update({
        where: { id: toId(id) },
        data: {
          name: input.name,
          description: input.description === "" ? null : input.description,
        },
      });
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  /**
   * Replaces a role's permissions with exactly the set given.
   *
   * @throws {ConflictException} when the change would leave nobody able to manage roles.
   */
  async setPermissions(id: string, input: PermissionAssignmentInput): Promise<void> {
    const roleId = toId(id);
    const permissionIds = input.permissionIds.map(BigInt);

    const keepsManage =
      (await this.prisma.permissions.count({
        where: { id: { in: permissionIds }, key: ROLE_MANAGE },
      })) > 0;

    if (
      wouldOrphanRoleManage({
        roleGrantsManage: await this.grantsManage(roleId),
        changeKeepsManage: keepsManage,
        anotherRoleGrantsManage: await this.anotherGrantsManage(roleId),
      })
    ) {
      throw new ConflictException(
        `This is the only role granting ${ROLE_MANAGE}. Give it to another role first, or nobody will be able to manage roles.`,
      );
    }

    try {
      await this.prisma.$transaction([
        this.prisma.role_permissions.deleteMany({ where: { role_id: roleId } }),
        this.prisma.role_permissions.createMany({
          data: permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })),
        }),
      ]);
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  /** @throws {ConflictException} when people still hold the role, or it is the last grant. */
  async remove(id: string): Promise<void> {
    const roleId = toId(id);

    // user_roles.role_id cascades, so the database would strip this role from everyone without
    // a word. Losing access has to be deliberate, so the check lives here.
    const holders = await this.prisma.user_roles.count({ where: { role_id: roleId } });
    if (holders > 0) {
      const people = holders === 1 ? "1 person holds" : `${holders} people hold`;
      throw new ConflictException(`${people} this role. Remove it from them before deleting it.`);
    }

    if (
      wouldOrphanRoleManage({
        roleGrantsManage: await this.grantsManage(roleId),
        changeKeepsManage: false,
        anotherRoleGrantsManage: await this.anotherGrantsManage(roleId),
      })
    ) {
      throw new ConflictException(
        `This is the only role granting ${ROLE_MANAGE}. Give it to another role first.`,
      );
    }

    try {
      await this.prisma.roles.delete({ where: { id: roleId } });
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  private async grantsManage(roleId: bigint): Promise<boolean> {
    const count = await this.prisma.role_permissions.count({
      where: { role_id: roleId, permissions: { key: ROLE_MANAGE } },
    });
    return count > 0;
  }

  /** Checked across every other role: two admins can otherwise strip each other one step at a time. */
  private async anotherGrantsManage(excludeRoleId: bigint): Promise<boolean> {
    const count = await this.prisma.role_permissions.count({
      where: { role_id: { not: excludeRoleId }, permissions: { key: ROLE_MANAGE } },
    });
    return count > 0;
  }
}

function toId(id: string): bigint {
  if (!NUMERIC_ID.test(id)) throw new NotFoundException("Role not found.");
  return BigInt(id);
}

function toWriteFailure(error: unknown): Error {
  if (prismaErrorCode(error) === UNIQUE_VIOLATION) {
    return new ConflictException("Another role already uses this name.");
  }
  if (prismaErrorCode(error) === "P2025") return new NotFoundException("Role not found.");
  return error instanceof Error ? error : new Error(String(error));
}
