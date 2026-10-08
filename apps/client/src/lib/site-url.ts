const DEV_URL = "http://localhost:3000";

/**
 * The storefront's public origin.
 *
 * Needed as an absolute URL in three places that cannot work with a path: `metadataBase` (which
 * turns every relative `canonical` into an absolute one), OpenGraph image URLs, and the sitemap.
 *
 * `NEXT_PUBLIC_SITE_URL` is the deployment's own domain. Vercel's `VERCEL_PROJECT_PRODUCTION_URL`
 * is the fallback so a deploy that forgets the first one still emits its own hostname rather than
 * localhost — a sitemap full of `http://localhost:3000` is worse than no sitemap, because search
 * engines will happily index it.
 *
 * Exported as a string rather than a `URL` because `metadataBase` wants one and `sitemap` wants
 * the other; the single trailing-slash rule is applied here so callers never have to think about it.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : DEV_URL)
).replace(/\/+$/, "");

/** An absolute URL for `path`, which must start with a slash. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
