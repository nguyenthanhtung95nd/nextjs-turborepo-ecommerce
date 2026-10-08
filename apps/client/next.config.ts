import type { NextConfig } from "next";

/**
 * Response headers for every storefront route.
 *
 * Looser than the admin's on framing — a shop may legitimately be embedded in a preview or a
 * partner page — but the same everywhere else.
 *
 * No Content-Security-Policy yet, for the same reason as the admin: Next injects inline scripts
 * for hydration, so a useful policy needs per-request nonces through middleware. `unsafe-inline`
 * would pass a scanner and block nothing.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/auth", "@repo/ui"],

  // `X-Powered-By: Next.js` tells an attacker which advisories to read.
  poweredByHeader: false,

  images: {
    /**
     * Product image URLs are typed by staff and can point anywhere, so the optimizer is opened
     * to any https host rather than an allow-list that would need editing on every new CDN.
     *
     * The trade-off, written down rather than discovered later: this makes the server fetch
     * arbitrary URLs on request, which is a request-forgery and bandwidth vector. It is bounded
     * here because only authenticated staff holding `product:*` can set those URLs. **Narrow
     * this to real CDN hostnames before any public deployment.**
     *
     * Chosen over the admin's `unoptimized` because LCP is an acceptance criterion for the
     * storefront, and the optimizer (resizing, AVIF/WebP) is the largest single lever on it.
     */
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
