import {
  PRODUCTS_PAGE_SIZE,
  centsToMoneyInput,
  type PageDto,
  type ProductCardDto,
  type ProductEditDto,
  type ProductFormInput,
  type ProductListParams,
  type ProductStatsDto,
  type ProductStatus,
} from "@repo/contracts";
import { apiClient } from "@/services/api-client";

/** A product as the admin table shows it — not the API's shape. */
export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  stock: number;
  status: ProductStatus;
  categoryName: string | null;
  brandName: string | null;
  thumbnailUrl: string | null;
  updatedAt: Date;
}

export interface ProductListResult {
  rows: ProductRow[];
  total: number;
  page: number;
  pageCount: number;
}

function toQuery(params: ProductListParams): string {
  const search = new URLSearchParams({
    status: params.status,
    sort: params.sort,
    page: String(params.page),
    pageSize: String(PRODUCTS_PAGE_SIZE),
  });
  if (params.q) search.set("q", params.q);
  return search.toString();
}

/**
 * One page of products matching the URL filters, in every status.
 *
 * Dates arrive as strings over the wire, so they are revived here — the table formats them and
 * would otherwise be handed a string that only looks like a date.
 */
export async function fetchProducts(params: ProductListParams): Promise<ProductListResult> {
  const { data } = await apiClient.get<PageDto<ProductCardDto>>(`/products?${toQuery(params)}`);

  return {
    rows: data.items.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      priceCents: item.priceCents,
      stock: item.stock,
      status: item.status,
      categoryName: item.categoryName,
      brandName: item.brandName,
      thumbnailUrl: item.imageUrl,
      updatedAt: new Date(item.updatedAt),
    })),
    total: data.total,
    page: data.page,
    pageCount: data.pageCount,
  };
}

export async function fetchProductStats(): Promise<ProductStatsDto> {
  const { data } = await apiClient.get<ProductStatsDto>("/products/stats");
  return data;
}

export interface SelectOption {
  id: string;
  name: string;
}

export interface ProductOptions {
  categories: SelectOption[];
  brands: SelectOption[];
}

export interface ProductEditData {
  id: string;
  name: string;
  defaults: ProductFormInput;
}

/**
 * A product shaped as form input — every field a string, money as a decimal.
 *
 * The string shaping is a form concern, so it happens here rather than in the API.
 */
export async function fetchProductForEdit(id: string): Promise<ProductEditData> {
  const { data } = await apiClient.get<ProductEditDto>(`/products/${encodeURIComponent(id)}`);

  return {
    id: data.id,
    name: data.name,
    defaults: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? "",
      price: centsToMoneyInput(data.priceCents),
      compareAtPrice:
        data.compareAtPriceCents === null ? "" : centsToMoneyInput(data.compareAtPriceCents),
      stock: String(data.stock),
      status: data.status,
      categoryId: data.categoryId ?? "",
      brandId: data.brandId ?? "",
      images: data.images.map((image) => ({ url: image.url, alt: image.alt ?? "" })),
    },
  };
}

/** Categories and brands together — the form needs both before it can render its selects. */
export async function fetchProductOptions(): Promise<ProductOptions> {
  const { data } = await apiClient.get<ProductOptions>("/products/options");
  return data;
}

export async function createProduct(input: ProductFormInput): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>("/products", input);
  return data;
}

export async function updateProduct(id: string, input: ProductFormInput): Promise<void> {
  await apiClient.patch(`/products/${encodeURIComponent(id)}`, input);
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<void> {
  await apiClient.patch(`/products/${encodeURIComponent(id)}/status`, { status });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${encodeURIComponent(id)}`);
}

export interface RecentProduct {
  id: string;
  name: string;
  status: ProductStatus;
  createdAt: Date;
}

/** The newest products, for the dashboard. */
export async function fetchRecentProducts(limit: number): Promise<RecentProduct[]> {
  const { data } = await apiClient.get<PageDto<ProductCardDto>>(
    `/products?status=ALL&sort=newest&page=1&pageSize=${limit}`,
  );

  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    status: item.status,
    // The list carries updatedAt, not createdAt; for a "recently added" panel sorted by
    // creation date they are the same ordering.
    createdAt: new Date(item.updatedAt),
  }));
}
