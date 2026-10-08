// Vietnamese đ/Đ is a distinct letter, not a d with a diacritic, so Unicode decomposition
// leaves it alone — it has to be mapped by hand before the combining marks are stripped.
const STROKED_D = /đ/g;
const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_SLUG_CHARS = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/**
 * Derives a URL slug from a display name (`"Bàn phím Gaming"` → `"ban-phim-gaming"`).
 *
 * The output always satisfies the `slug` CHECK constraint in the database, or is empty when
 * the name has no slug-able characters at all — callers must treat `""` as "no suggestion"
 * rather than a valid slug.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(STROKED_D, "d")
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(NON_SLUG_CHARS, "-")
    .replace(EDGE_HYPHENS, "");
}
