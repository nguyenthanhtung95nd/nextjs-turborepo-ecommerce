type ListParams = Record<string, string | number>;

/**
 * Builds a list-page URL from the current parameters plus the ones being changed.
 *
 * Anything still at its default is left out, so an unfiltered list is a bare path and a shared
 * link carries only what the recipient actually needs. Key order follows `params`, which comes
 * from the Zod schema, so the same filters always produce the same URL.
 */
export function buildListHref<T extends ListParams>(
  route: string,
  defaults: T,
  params: T,
  overrides: Partial<T> = {},
): string {
  const next = { ...params, ...overrides };
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(next)) {
    if (value === defaults[key]) continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${route}?${query}` : route;
}
