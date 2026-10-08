"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductFormInput, ProductStatus } from "@repo/contracts";
import { createProduct, deleteProduct, setProductStatus, updateProduct } from "../services";

/**
 * Everything a write touches.
 *
 * Invalidating the whole `products` prefix rather than one entry is deliberate: a write changes
 * the list, the status counts and possibly which page a row falls on, and naming each of those
 * would be one more thing to keep in step with every new screen.
 */
function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["products"] });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductFormInput) => createProduct(input),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct(id: string) {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (input: ProductFormInput) => updateProduct(id, input),
    onSuccess: invalidate,
  });
}

export function useSetProductStatus() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (variables: { id: string; status: ProductStatus }) =>
      setProductStatus(variables.id, variables.status),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: (id: string) => deleteProduct(id), onSuccess: invalidate });
}
