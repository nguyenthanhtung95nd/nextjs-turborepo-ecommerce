import type { TaxonomyDto, TaxonomyFormInput } from "@repo/contracts";
import { apiClient } from "@/services/api-client";
import type { TaxonomyKind } from "./kinds";

export interface TaxonomyRow {
  id: string;
  name: string;
  slug: string;
  /** Every status — the reason a delete may be refused. */
  productCount: number;
  updatedAt: Date;
}

/**
 * Every category or brand, alphabetically, each with its product count.
 *
 * Unpaginated on purpose: a catalogue has tens of these, and seeing the whole list is the point.
 */
export async function fetchTaxonomy(kind: TaxonomyKind): Promise<TaxonomyRow[]> {
  const { data } = await apiClient.get<TaxonomyDto[]>(`/taxonomy/${kind}`);

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    productCount: row.totalProductCount,
    updatedAt: new Date(row.updatedAt),
  }));
}

export async function createTaxonomy(kind: TaxonomyKind, input: TaxonomyFormInput): Promise<void> {
  await apiClient.post(`/taxonomy/${kind}`, input);
}

export async function updateTaxonomy(
  kind: TaxonomyKind,
  id: string,
  input: TaxonomyFormInput,
): Promise<void> {
  await apiClient.patch(`/taxonomy/${kind}/${encodeURIComponent(id)}`, input);
}

export async function deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void> {
  await apiClient.delete(`/taxonomy/${kind}/${encodeURIComponent(id)}`);
}
