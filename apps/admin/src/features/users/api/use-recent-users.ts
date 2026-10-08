"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRecentUsers } from "../services";

export function useRecentUsers(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: ["users", "recent", limit],
    queryFn: () => fetchRecentUsers(limit),
    enabled,
  });
}
