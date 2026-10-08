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
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { taxonomyFormSchema } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Permissions, PermissionsGuard } from "../auth/permissions.guard";
import { CategoriesService } from "./categories.service";

class TaxonomyFormDto extends createZodDto(taxonomyFormSchema) {}

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "List categories with their product counts" })
  @ApiQuery({
    name: "hasPublished",
    required: false,
    description: "Set to 1 to exclude categories with no published products.",
  })
  list(@Query("hasPublished") hasPublished?: string) {
    return this.categories.list(hasPublished === "1");
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("category:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a category" })
  create(@Body() body: TaxonomyFormDto) {
    return this.categories.create(body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("category:manage")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Rename a category or change its slug" })
  async update(@Param("id") id: string, @Body() body: TaxonomyFormDto) {
    await this.categories.update(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("category:manage")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a category",
    description: "Refused with 409 while any product still references it.",
  })
  async remove(@Param("id") id: string) {
    await this.categories.remove(id);
  }
}
