"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRecentProducts } from "../services";

export function useRecentProducts(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: ["products", "recent", limit],
    queryFn: () => fetchRecentProducts(limit),
    enabled,
  });
}
