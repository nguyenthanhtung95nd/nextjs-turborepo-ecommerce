import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CATALOG_PAGE_SIZE,
  type CatalogListParams,
  type CatalogSort,
  type PageDto,
  type ProductCardDto,
  type ProductDetailDto,
  type ProductEditDto,
  type ProductFormValues,
  type ProductStatsDto,
  PRODUCT_STATUSES,
  type ProductStatus,
} from "@repo/contracts";
import type { Prisma } from "@prisma/client";
import { FOREIGN_KEY_VIOLATION, UNIQUE_VIOLATION, prismaErrorCode } from "../prisma/prisma-error";
import { PrismaService } from "../prisma/prisma.service";

const CENTS_PER_DOLLAR = 100;

const PUBLISHED_ONLY = { status: "PUBLISHED" } satisfies Prisma.productsWhereInput;

/**
 * Every ordering ends in the id. `skip`/`take` paginate a set whose tied rows Postgres may order
 * however it likes, so without a unique final key one product can appear on two pages.
 */
const ORDER_BY: Record<CatalogSort, Prisma.productsOrderByWithRelationInput[]> = {
  newest: [{ created_at: "desc" }, { id: "desc" }],
  "price-asc": [{ price_cents: "asc" }, { id: "asc" }],
  "price-desc": [{ price_cents: "desc" }, { id: "asc" }],
  "name-asc": [{ name: "asc" }, { id: "asc" }],
};

const CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  price_cents: true,
  compare_at_price_cents: true,
  stock: true,
  status: true,
  updated_at: true,
  categories: { select: { name: true } },
  brands: { select: { name: true } },
  product_images: { select: { url: true, alt: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.productsSelect;

const DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price_cents: true,
  compare_at_price_cents: true,
  stock: true,
  updated_at: true,
  categories: { select: { id: true, name: true, slug: true } },
  brands: { select: { id: true, name: true, slug: true } },
  product_images: { select: { url: true, alt: true }, orderBy: { position: "asc" } },
} satisfies Prisma.productsSelect;

type CardRecord = Prisma.productsGetPayload<{ select: typeof CARD_SELECT }>;
type DetailRecord = Prisma.productsGetPayload<{ select: typeof DETAIL_SELECT }>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One page of products, published only unless the caller holds `product:read`.
   *
   * The filter is applied here, not by the caller, so no consumer can forget it.
   */
  async listPublished(
    params: CatalogListParams,
    canSeeAllStatuses = false,
  ): Promise<PageDto<ProductCardDto>> {
    const where = this.buildWhere(params, canSeeAllStatuses);
    const pageSize = params.pageSize ?? CATALOG_PAGE_SIZE;
    const total = await this.prisma.products.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(params.page, pageCount);

    const records = await this.prisma.products.findMany({
      where,
      orderBy: ORDER_BY[params.sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: CARD_SELECT,
    });

    return { items: records.map(toCard), total, page, pageCount };
  }

  /** @throws {NotFoundException} when no published product has that slug. */
  async findPublishedBySlug(slug: string): Promise<ProductDetailDto> {
    const record = await this.prisma.products.findFirst({
      where: { ...PUBLISHED_ONLY, slug },
      select: DETAIL_SELECT,
    });
    if (!record) throw new NotFoundException("Product not found.");
    return toDetail(record);
  }

  /** Published slugs with the date a crawler should compare against. */
  async listPublishedSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    const records = await this.prisma.products.findMany({
      where: PUBLISHED_ONLY,
      select: { slug: true, updated_at: true },
      orderBy: { id: "asc" },
    });
    return records.map((record) => ({
      slug: record.slug,
      updatedAt: record.updated_at.toISOString(),
    }));
  }

  private buildWhere(
    params: CatalogListParams,
    canSeeAllStatuses: boolean,
  ): Prisma.productsWhereInput {
    const price = {
      ...(params.priceMin > 0 ? { gte: params.priceMin * CENTS_PER_DOLLAR } : {}),
      ...(params.priceMax > 0 ? { lte: params.priceMax * CENTS_PER_DOLLAR } : {}),
    };

    // A caller without `product:read` cannot widen this, whatever they put in the query string.
    const status = resolveStatusFilter(params.status, canSeeAllStatuses);

    return {
      ...status,
      // Prisma escapes the value, so a term full of % or quotes is matched literally.
      ...(params.q ? { name: { contains: params.q, mode: "insensitive" as const } } : {}),
      ...(params.category ? { categories: { slug: params.category } } : {}),
      ...(params.brand ? { brands: { slug: params.brand } } : {}),
      ...(params.inStock === "1" ? { stock: { gt: 0 } } : {}),
      ...(Object.keys(price).length > 0 ? { price_cents: price } : {}),
    };
  }

  /** @throws {NotFoundException} when no product has that id. */
  async findForEdit(id: string): Promise<ProductEditDto> {
    const record = await this.prisma.products.findUnique({
      where: { id: toProductId(id) },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price_cents: true,
        compare_at_price_cents: true,
        stock: true,
        status: true,
        category_id: true,
        brand_id: true,
        product_images: { select: { url: true, alt: true }, orderBy: { position: "asc" } },
      },
    });
    if (!record) throw new NotFoundException("Product not found.");

    return {
      id: record.id.toString(),
      name: record.name,
      slug: record.slug,
      description: record.description,
      priceCents: record.price_cents,
      compareAtPriceCents: record.compare_at_price_cents,
      stock: record.stock,
      status: record.status,
      categoryId: record.category_id?.toString() ?? null,
      brandId: record.brand_id?.toString() ?? null,
      images: record.product_images,
    };
  }

  async countByStatus(): Promise<ProductStatsDto> {
    const groups = await this.prisma.products.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const counts = Object.fromEntries(PRODUCT_STATUSES.map((s) => [s, 0])) as ProductStatsDto;
    for (const group of groups) counts[group.status] = group._count._all;
    return counts;
  }

  async create(values: ProductFormValues): Promise<{ id: string }> {
    try {
      const created = await this.prisma.products.create({
        data: { ...toColumns(values), product_images: { create: toImageRows(values.images) } },
      });
      return { id: created.id.toString() };
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  /**
   * Replaces the product and its images in one transaction.
   *
   * Images are a plain ordered list, so replacing them wholesale is simpler and more correct than
   * diffing — and inside a transaction there is no window where a product has no images.
   */
  async update(id: string, values: ProductFormValues): Promise<void> {
    const productId = toProductId(id);

    try {
      await this.prisma.$transaction([
        this.prisma.products.update({ where: { id: productId }, data: toColumns(values) }),
        this.prisma.product_images.deleteMany({ where: { product_id: productId } }),
        this.prisma.product_images.createMany({
          data: toImageRows(values.images).map((row) => ({ ...row, product_id: productId })),
        }),
      ]);
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  async setStatus(id: string, status: ProductStatus): Promise<void> {
    try {
      await this.prisma.products.update({
        where: { id: toProductId(id) },
        data: { status },
      });
    } catch (error) {
      throw toWriteFailure(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // product_images rows go with it — ON DELETE CASCADE in 009_create_product_images.sql.
      await this.prisma.products.delete({ where: { id: toProductId(id) } });
    } catch (error) {
      throw toWriteFailure(error);
    }
  }
}

function toCard(record: CardRecord): ProductCardDto {
  const image = record.product_images[0];
  return {
    id: record.id.toString(),
    name: record.name,
    slug: record.slug,
    priceCents: record.price_cents,
    compareAtPriceCents: record.compare_at_price_cents,
    inStock: record.stock > 0,
    stock: record.stock,
    status: record.status,
    updatedAt: record.updated_at.toISOString(),
    categoryName: record.categories?.name ?? null,
    brandName: record.brands?.name ?? null,
    imageUrl: image?.url ?? null,
    // Falls back to the name: the image is how a shopper tells one card from another.
    imageAlt: image?.alt ?? record.name,
  };
}

function toDetail(record: DetailRecord): ProductDetailDto {
  return {
    id: record.id.toString(),
    name: record.name,
    slug: record.slug,
    description: record.description,
    priceCents: record.price_cents,
    compareAtPriceCents: record.compare_at_price_cents,
    stock: record.stock,
    category: record.categories && { ...record.categories, id: record.categories.id.toString() },
    brand: record.brands && { ...record.brands, id: record.brands.id.toString() },
    images: record.product_images.map((image) => ({
      url: image.url,
      alt: image.alt ?? record.name,
    })),
    updatedAt: record.updated_at.toISOString(),
  };
}

/**
 * Which statuses a caller may see.
 *
 * Absence always means published, whatever permissions the caller holds, so a request that
 * happens to carry a token can never widen the result by accident.
 */
function resolveStatusFilter(
  requested: "ALL" | ProductStatus | undefined,
  canSeeAllStatuses: boolean,
): Prisma.productsWhereInput {
  if (!canSeeAllStatuses || requested === undefined) return PUBLISHED_ONLY;
  return requested === "ALL" ? {} : { status: requested };
}

const NUMERIC_ID = /^\d+$/;

/** @throws {NotFoundException} rather than letting a malformed id reach Prisma as a crash. */
function toProductId(id: string): bigint {
  if (!NUMERIC_ID.test(id)) throw new NotFoundException("Product not found.");
  return BigInt(id);
}

function toColumns(values: ProductFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description === "" ? null : values.description,
    price_cents: values.price,
    compare_at_price_cents: values.compareAtPrice,
    stock: values.stock,
    status: values.status,
    category_id: values.categoryId === null ? null : BigInt(values.categoryId),
    brand_id: values.brandId === null ? null : BigInt(values.brandId),
  };
}

// Array order is the display order, so the index is the stored position.
function toImageRows(images: ProductFormValues["images"]) {
  return images.map((image, index) => ({
    url: image.url,
    alt: image.alt === "" ? null : image.alt,
    position: index,
  }));
}

/** Expected outcomes of valid-looking input become a status a caller can act on. */
function toWriteFailure(error: unknown): Error {
  const code = prismaErrorCode(error);
  if (code === UNIQUE_VIOLATION)
    return new ConflictException("Another product already uses this slug.");
  if (code === FOREIGN_KEY_VIOLATION) {
    return new ConflictException("The selected category or brand no longer exists.");
  }
  if (code === "P2025") return new NotFoundException("Product not found.");
  return error instanceof Error ? error : new Error(String(error));
}
