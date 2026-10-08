"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductForEdit, fetchProductOptions } from "../services";

export function useProductOptions() {
  return useQuery({ queryKey: ["products", "options"], queryFn: fetchProductOptions });
}

export function useProductForEdit(id: string) {
  return useQuery({ queryKey: ["products", "edit", id], queryFn: () => fetchProductForEdit(id) });
}
