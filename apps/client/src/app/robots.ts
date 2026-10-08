import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

/**
 * What crawlers may index.
 *
 * The disallow list is not about secrecy — `/account` is already behind a session and a crawler
 * would only ever see the sign-in redirect. It is about not spending a site's crawl budget on
 * pages that can never rank, and not letting `/search` fill the index with one URL per term
 * anyone has ever typed.
 *
 * `/api/` is listed because the auth routes answer there and have no business in a search result.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/login", "/register", "/search", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
