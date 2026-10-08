"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductListParams } from "@repo/contracts";
import { fetchProducts } from "../services";

/**
 * The cache key for one page of the list.
 *
 * Every filter is part of it, so two different filters are two cache entries and going back to a
 * filter already seen is served without a request. Exported because the write hooks added later
 * invalidate against this same prefix.
 */
export const productListKey = (params: ProductListParams) => ["products", "list", params] as const;

export function useProducts(params: ProductListParams) {
  return useQuery({ queryKey: productListKey(params), queryFn: () => fetchProducts(params) });
}
