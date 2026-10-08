import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createUserSchema,
  roleAssignmentSchema,
  userListParamsSchema,
  userProfileSchema,
  userStatusSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";
import { type AuthedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Permissions, PermissionsGuard } from "../auth/permissions.guard";
import { UsersService } from "./users.service";

class UserListQueryDto extends createZodDto(userListParamsSchema) {}
class CreateUserDto extends createZodDto(createUserSchema) {}
class UserProfileDto extends createZodDto(userProfileSchema) {}
class RoleAssignmentDto extends createZodDto(roleAssignmentSchema) {}
class UserStatusDto extends createZodDto(userStatusSchema) {}

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("user:manage")
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: "List users, newest first" })
  list(@Query() query: UserListQueryDto) {
    return this.users.list(query);
  }

  @Get("counts")
  @ApiOperation({ summary: "Headline counts: total, staff, deactivated" })
  counts() {
    return this.users.counts();
  }

  @Get(":id")
  @ApiOperation({ summary: "One user with the ids of the roles they hold" })
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a user and assign their roles" })
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Update a user's display name" })
  async updateProfile(@Param("id") id: string, @Body() body: UserProfileDto) {
    await this.users.updateProfile(id, body);
  }

  @Patch(":id/roles")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Replace a user's roles",
    description: "Refused with 409 when callers would strip their own user:manage.",
  })
  async setRoles(
    @Param("id") id: string,
    @Body() body: RoleAssignmentDto,
    @Req() request: AuthedRequest,
  ) {
    await this.users.setRoles(id, body, request.user!.id);
  }

  @Patch(":id/status")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Activate or deactivate a user",
    description: "Refused with 409 when callers would deactivate themselves.",
  })
  async setActive(
    @Param("id") id: string,
    @Body() body: UserStatusDto,
    @Req() request: AuthedRequest,
  ) {
    await this.users.setActive(id, body.isActive, request.user!.id);
  }
}
