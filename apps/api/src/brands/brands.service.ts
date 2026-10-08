import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { TaxonomyDto, TaxonomyFormInput } from "@repo/contracts";
import { toWriteFailure } from "../categories/categories.service";
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
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param withPublishedOnly keeps out brands whose every product is a draft — a storefront
   * link to one would greet a shopper with an empty grid.
   */
  async list(withPublishedOnly: boolean): Promise<TaxonomyDto[]> {
    const records = await this.prisma.brands.findMany({
      where: withPublishedOnly ? { products: { some: PUBLISHED_ONLY } } : {},
      orderBy: { name: "asc" },
      select: SELECT,
    });
    return this.decorate(records);
  }

  async create(input: TaxonomyFormInput): Promise<{ id: string }> {
    try {
      const created = await this.prisma.brands.create({ data: input });
      return { id: created.id.toString() };
    } catch (error) {
      throw toWriteFailure(error, "brand");
    }
  }

  async update(id: string, input: TaxonomyFormInput): Promise<void> {
    try {
      await this.prisma.brands.update({ where: { id: toId(id) }, data: input });
    } catch (error) {
      throw toWriteFailure(error, "brand");
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.brands.delete({ where: { id: toId(id) } });
    } catch (error) {
      throw toWriteFailure(error, "brand");
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
      by: ["brand_id"],
      where: PUBLISHED_ONLY,
      _count: { _all: true },
    });
    const byBrand = new Map(published.map((row) => [row.brand_id?.toString(), row._count._all]));

    return records.map((record) => ({
      id: record.id.toString(),
      name: record.name,
      slug: record.slug,
      productCount: byBrand.get(record.id.toString()) ?? 0,
      totalProductCount: record._count.products,
      updatedAt: record.updated_at.toISOString(),
    }));
  }
}

function toId(id: string): bigint {
  if (!NUMERIC_ID.test(id)) throw new NotFoundException("Brand not found.");
  return BigInt(id);
}
