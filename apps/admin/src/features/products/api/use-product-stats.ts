"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductStats } from "../services";

export const productStatsKey = ["products", "stats"] as const;

export function useProductStats(enabled = true) {
  return useQuery({ queryKey: productStatsKey, queryFn: fetchProductStats, enabled });
}
