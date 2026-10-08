import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { TaxonomyDto, TaxonomyFormInput } from "@repo/contracts";
import {
  FOREIGN_KEY_VIOLATION,
  UNIQUE_VIOLATION,
  prismaErrorCode,
  prismaErrorTarget,
} from "../prisma/prisma-error";
import { PrismaService } from "../prisma/prisma.service";

const PUBLISHED_ONLY = { status: "PUBLISHED" } as const;
const NUMERIC_ID = /^\d+$/;

const SELECT = {
  id: true,
  name: true,
  slug: true,
  updated_at: true,
  _count: { select: { products: true } },
} as const;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param withPublishedOnly keeps out categories whose every product is a draft — a storefront
   * link to one would greet a shopper with an empty grid.
   */
  async list(withPublishedOnly: boolean): Promise<TaxonomyDto[]> {
    const records = await this.prisma.categories.findMany({
      where: withPublishedOnly ? { products: { some: PUBLISHED_ONLY } } : {},
      orderBy: { name: "asc" },
      select: SELECT,
    });
    return this.decorate(records);
  }

  async create(input: TaxonomyFormInput): Promise<{ id: string }> {
    try {
      const created = await this.prisma.categories.create({ data: input });
      return { id: created.id.toString() };
    } catch (error) {
      throw toWriteFailure(error, "category");
    }
  }

  async update(id: string, input: TaxonomyFormInput): Promise<void> {
    try {
      await this.prisma.categories.update({ where: { id: toId(id) }, data: input });
    } catch (error) {
      throw toWriteFailure(error, "category");
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.categories.delete({ where: { id: toId(id) } });
    } catch (error) {
      throw toWriteFailure(error, "category");
    }
  }

  /** The published count needs its own pass; Prisma cannot filter two counts in one select. */
  private async decorate(
    records: {
      id: bigint;
      name: string;
      slug: string;
      updated_at: Date;
      _count: { products: number };
    }[],
  ): Promise<TaxonomyDto[]> {
    const published = await this.prisma.products.groupBy({
      by: ["category_id"],
      where: PUBLISHED_ONLY,
      _count: { _all: true },
    });
    const byCategory = new Map(
      published.map((row) => [row.category_id?.toString(), row._count._all]),
    );

    return records.map((record) => ({
      id: record.id.toString(),
      name: record.name,
      slug: record.slug,
      productCount: byCategory.get(record.id.toString()) ?? 0,
      totalProductCount: record._count.products,
      updatedAt: record.updated_at.toISOString(),
    }));
  }
}

function toId(id: string): bigint {
  if (!NUMERIC_ID.test(id)) throw new NotFoundException("Category not found.");
  return BigInt(id);
}

/** Expected outcomes of valid-looking input become a status the caller can act on. */
export function toWriteFailure(error: unknown, singular: string): Error {
  const code = prismaErrorCode(error);
  if (code === UNIQUE_VIOLATION) {
    const field = prismaErrorTarget(error).includes("name") ? "name" : "slug";
    return new ConflictException(`Another ${singular} already uses this ${field}.`);
  }
  // ON DELETE RESTRICT: products still point at this row.
  if (code === FOREIGN_KEY_VIOLATION) {
    return new ConflictException(
      `This ${singular} is still used by products, so it can't be deleted.`,
    );
  }
  if (code === "P2025") return new NotFoundException(`${singular} not found.`);
  return error instanceof Error ? error : new Error(String(error));
}
