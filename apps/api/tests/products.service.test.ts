import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { catalogListParamsSchema } from "@repo/contracts";
import { ProductsService } from "../src/products/products.service";

type FindManyArgs = { where: Record<string, unknown>; orderBy: unknown[]; skip: number };

function serviceWith(rows: unknown[] = [], total = 0) {
  const findMany = vi.fn().mockResolvedValue(rows);
  const count = vi.fn().mockResolvedValue(total);
  const findFirst = vi.fn().mockResolvedValue(null);
  const prisma = { products: { findMany, count, findFirst } };
  return {
    service: new ProductsService(prisma as never),
    findMany,
    findFirst,
    args: () => findMany.mock.calls[0]?.[0] as FindManyArgs,
  };
}

const params = (overrides: Record<string, unknown> = {}) =>
  catalogListParamsSchema.parse(overrides);

const ROW = {
  id: 7n,
  name: "Mechanical Keyboard K70",
  slug: "mechanical-keyboard-k70",
  price_cents: 15900,
  compare_at_price_cents: 18900,
  stock: 42,
  status: "PUBLISHED" as const,
  updated_at: new Date("2026-01-01T00:00:00Z"),
  categories: { name: "Peripherals" },
  brands: { name: "Corsair" },
  product_images: [{ url: "https://cdn.example.com/k70.jpg", alt: "A keyboard" }],
};

describe("ProductsService.listPublished", () => {
  /** The rule the whole extraction exists to protect: no caller can opt out of it. */
  it("always filters to PUBLISHED, whatever the caller asked for", async () => {
    const { service, args } = serviceWith([], 0);
    await service.listPublished(params({ status: "DRAFT", category: "audio" }));

    expect(args().where).toMatchObject({ status: "PUBLISHED" });
  });

  /**
   * Postgres may return tied rows in any order, so without a unique final key one product can
   * appear on two pages and another on none.
   */
  it.each([["newest"], ["price-asc"], ["price-desc"], ["name-asc"]])(
    "breaks ties on the id when sorting by %s",
    async (sort) => {
      const { service, args } = serviceWith([], 0);
      await service.listPublished(params({ sort }));

      const orderBy = args().orderBy as Record<string, string>[];
      expect(orderBy.at(-1)).toHaveProperty("id");
    },
  );

  it("clamps a page past the end rather than returning an empty grid", async () => {
    const { service } = serviceWith([], 18);
    const result = await service.listPublished(params({ page: "99" }));

    expect(result.pageCount).toBe(2);
    expect(result.page).toBe(2);
  });

  it("reports page 1 of 1 for an empty catalogue", async () => {
    const { service } = serviceWith([], 0);
    const result = await service.listPublished(params());

    expect(result).toMatchObject({ total: 0, page: 1, pageCount: 1 });
  });

  it("serialises the bigint id as a string, because JSON cannot carry one", async () => {
    const { service } = serviceWith([ROW], 1);
    const [card] = (await service.listPublished(params())).items;

    expect(card!.id).toBe("7");
  });

  it("derives inStock as well as carrying the exact count", async () => {
    const { service } = serviceWith([{ ...ROW, stock: 0 }], 1);
    const [card] = (await service.listPublished(params())).items;

    expect(card!.inStock).toBe(false);
    expect(card!.stock).toBe(0);
  });

  it("falls back to the product name when an image has no alt text", async () => {
    const row = { ...ROW, product_images: [{ url: "https://cdn.example.com/k70.jpg", alt: null }] };
    const { service } = serviceWith([row], 1);
    const [card] = (await service.listPublished(params())).items;

    expect(card!.imageAlt).toBe("Mechanical Keyboard K70");
  });

  it("converts price bounds from dollars to cents", async () => {
    const { service, args } = serviceWith([], 0);
    await service.listPublished(params({ priceMin: "50", priceMax: "900" }));

    expect(args().where.price_cents).toEqual({ gte: 5000, lte: 90000 });
  });

  it("omits the price filter entirely when no bound is set", async () => {
    const { service, args } = serviceWith([], 0);
    await service.listPublished(params());

    expect(args().where).not.toHaveProperty("price_cents");
  });

  it("matches the search term case-insensitively", async () => {
    const { service, args } = serviceWith([], 0);
    await service.listPublished(params({ q: "Monitor" }));

    expect(args().where.name).toEqual({ contains: "Monitor", mode: "insensitive" });
  });
});

describe("ProductsService.findPublishedBySlug", () => {
  /** A draft has to be indistinguishable from a product that never existed. */
  it("refuses a slug that is not published", async () => {
    const { service, findFirst } = serviceWith();
    findFirst.mockResolvedValue(null);

    await expect(service.findPublishedBySlug("prototype")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("looks the slug up together with the published filter, not after it", async () => {
    const { service, findFirst } = serviceWith();
    await service.findPublishedBySlug("anything").catch(() => undefined);

    expect(findFirst.mock.calls[0]![0].where).toMatchObject({
      status: "PUBLISHED",
      slug: "anything",
    });
  });
});
