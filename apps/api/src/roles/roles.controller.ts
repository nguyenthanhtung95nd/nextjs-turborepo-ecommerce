import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { permissionAssignmentSchema, roleFormSchema } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Permissions, PermissionsGuard } from "../auth/permissions.guard";
import { RolesService } from "./roles.service";

class RoleFormDto extends createZodDto(roleFormSchema) {}
class PermissionAssignmentDto extends createZodDto(permissionAssignmentSchema) {}

@ApiTags("roles")
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("role:manage")
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get("roles")
  @ApiOperation({ summary: "List roles with their permission and user counts" })
  list() {
    return this.roles.list();
  }

  @Get("roles/options")
  // Read by the user screens, not the role screens: assigning a role is user management.
  @Permissions("user:manage")
  @ApiOperation({ summary: "Roles as id and name, for assignment controls" })
  options() {
    return this.roles.options();
  }

  @Get("roles/count")
  @ApiOperation({ summary: "How many roles exist" })
  count() {
    return this.roles.count();
  }

  @Get("permissions")
  @ApiOperation({
    summary: "The permission catalog",
    description: "Read-only: the rows are seeded from the same list the guards check.",
  })
  listPermissions() {
    return this.roles.listPermissions();
  }

  @Get("roles/:id")
  @ApiOperation({ summary: "One role with the ids of the permissions it grants" })
  findOne(@Param("id") id: string) {
    return this.roles.findOne(id);
  }

  @Post("roles")
  @ApiOperation({ summary: "Create a role" })
  create(@Body() body: RoleFormDto) {
    return this.roles.create(body);
  }

  @Patch("roles/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Rename a role or change its description" })
  async update(@Param("id") id: string, @Body() body: RoleFormDto) {
    await this.roles.update(id, body);
  }

  @Patch("roles/:id/permissions")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Replace a role's permissions",
    description: "Refused with 409 when it would leave nobody able to manage roles.",
  })
  async setPermissions(@Param("id") id: string, @Body() body: PermissionAssignmentDto) {
    await this.roles.setPermissions(id, body);
  }

  @Delete("roles/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a role",
    description:
      "Refused with 409 while anyone holds it, or when it is the last grant of role:manage.",
  })
  async remove(@Param("id") id: string) {
    await this.roles.remove(id);
  }
}
