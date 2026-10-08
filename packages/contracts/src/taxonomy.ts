import { z } from "zod";

export const TAXONOMY_KINDS = ["category", "brand"] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

// Mirrors the CHECK constraint on categories.slug / brands.slug, so a bad value becomes a field
// message instead of a 500.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 80;
const MAX_SLUG_LENGTH = 80;

export const taxonomyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(MAX_NAME_LENGTH, `Keep the name under ${MAX_NAME_LENGTH} characters.`),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(MAX_SLUG_LENGTH, `Keep the slug under ${MAX_SLUG_LENGTH} characters.`)
    .regex(SLUG_PATTERN, "Lowercase letters, numbers and single hyphens only."),
});

export type TaxonomyFormInput = z.infer<typeof taxonomyFormSchema>;
