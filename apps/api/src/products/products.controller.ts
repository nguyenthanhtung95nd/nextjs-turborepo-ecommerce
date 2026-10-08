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
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { catalogListParamsSchema, productFormSchema, productStatusSchema } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";
import { type AuthedRequest, JwtAuthGuard, OptionalJwtGuard } from "../auth/jwt-auth.guard";
import { Permissions, PermissionsGuard } from "../auth/permissions.guard";
import { ProductsService } from "./products.service";

class CatalogListQueryDto extends createZodDto(catalogListParamsSchema) {}
class ProductFormDto extends createZodDto(productFormSchema) {}
class ProductStatusDto extends createZodDto(productStatusSchema) {}

function canSeeAllStatuses(request: AuthedRequest): boolean {
  return request.user?.permissions.includes("product:read") ?? false;
}

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({
    summary: "List products",
    description:
      "Published only. A caller holding product:read may pass status=ALL or a single status; for everyone else that parameter is ignored. Malformed query values fall back to their defaults.",
  })
  @ApiOkResponse({ description: "One page of products, newest first unless sorted otherwise." })
  list(@Query() query: CatalogListQueryDto, @Req() request: AuthedRequest) {
    return this.products.listPublished(query, canSeeAllStatuses(request));
  }

  @Get("slugs")
  @ApiOperation({ summary: "Published slugs with their last-modified date, for sitemaps" })
  listSlugs() {
    return this.products.listPublishedSlugs();
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("product:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "How many products sit in each status" })
  stats() {
    return this.products.countByStatus();
  }

  @Get("by-slug/:slug")
  @ApiOperation({ summary: "One published product by slug" })
  @ApiOkResponse({ description: "The product, or 404 when no published product has that slug." })
  findBySlug(@Param("slug") slug: string) {
    return this.products.findPublishedBySlug(slug);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("product:read")
  @ApiBearerAuth()
  @ApiOperation({ summary: "One product by id, in the shape the edit form needs" })
  findForEdit(@Param("id") id: string) {
    return this.products.findForEdit(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("product:create")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a product with its images" })
  create(@Body() body: ProductFormDto) {
    return this.products.create(body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("product:update")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Replace a product and its images",
    description: "The product and its image list are written in one transaction.",
  })
  async update(@Param("id") id: string, @Body() body: ProductFormDto) {
    await this.products.update(id, body);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("product:update")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Move a product between DRAFT, PUBLISHED and ARCHIVED" })
  async setStatus(@Param("id") id: string, @Body() body: ProductStatusDto) {
    await this.products.setStatus(id, body.status);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("product:delete")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a product and its images" })
  async remove(@Param("id") id: string) {
    await this.products.remove(id);
  }
}
