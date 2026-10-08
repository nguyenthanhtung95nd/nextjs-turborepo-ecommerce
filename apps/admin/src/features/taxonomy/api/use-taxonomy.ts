"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaxonomyFormInput } from "@repo/contracts";
import type { TaxonomyKind } from "../kinds";
import { createTaxonomy, deleteTaxonomy, fetchTaxonomy, updateTaxonomy } from "../services";

const taxonomyKey = (kind: TaxonomyKind) => ["taxonomy", kind] as const;

export function useTaxonomy(kind: TaxonomyKind) {
  return useQuery({ queryKey: taxonomyKey(kind), queryFn: () => fetchTaxonomy(kind) });
}

/** A write to one kind can change the other's product counts, so both lists are invalidated. */
function useInvalidateTaxonomy() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["taxonomy"] });
}

export function useCreateTaxonomy(kind: TaxonomyKind) {
  const invalidate = useInvalidateTaxonomy();
  return useMutation({
    mutationFn: (input: TaxonomyFormInput) => createTaxonomy(kind, input),
    onSuccess: invalidate,
  });
}

export function useUpdateTaxonomy(kind: TaxonomyKind) {
  const invalidate = useInvalidateTaxonomy();
  return useMutation({
    mutationFn: (variables: { id: string; input: TaxonomyFormInput }) =>
      updateTaxonomy(kind, variables.id, variables.input),
    onSuccess: invalidate,
  });
}

export function useDeleteTaxonomy(kind: TaxonomyKind) {
  const invalidate = useInvalidateTaxonomy();
  return useMutation({
    mutationFn: (id: string) => deleteTaxonomy(kind, id),
    onSuccess: invalidate,
  });
}
