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
import { BrandsService } from "./brands.service";

class TaxonomyFormDto extends createZodDto(taxonomyFormSchema) {}

@ApiTags("brands")
@Controller("brands")
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  @ApiOperation({ summary: "List brands with their product counts" })
  @ApiQuery({
    name: "hasPublished",
    required: false,
    description: "Set to 1 to exclude brands with no published products.",
  })
  list(@Query("hasPublished") hasPublished?: string) {
    return this.brands.list(hasPublished === "1");
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("brand:manage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a brand" })
  create(@Body() body: TaxonomyFormDto) {
    return this.brands.create(body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("brand:manage")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Rename a brand or change its slug" })
  async update(@Param("id") id: string, @Body() body: TaxonomyFormDto) {
    await this.brands.update(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("brand:manage")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a brand",
    description: "Refused with 409 while any product still references it.",
  })
  async remove(@Param("id") id: string) {
    await this.brands.remove(id);
  }
}
