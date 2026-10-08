import type { NextConfig } from "next";

/**
 * Response headers for every admin route.
 *
 * The admin app renders no third-party content and is never meant to be embedded, so the
 * framing and referrer rules can be the strict ones rather than a compromise.
 *
 * A Content-Security-Policy is deliberately absent: Next injects inline scripts for hydration,
 * so a useful policy needs per-request nonces threaded through middleware. Half a policy —
 * `unsafe-inline` — would pass a scanner while blocking nothing, so it is left for a change
 * that can do it properly.
 */
const SECURITY_HEADERS = [
  // No framing at all: there is no legitimate reason to embed an admin console, and refusing
  // removes clickjacking as a category.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },

  // Stop browsers guessing a content type and running a response as script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Admin URLs carry record ids; send only the origin to other sites, nothing cross-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here needs a camera, a microphone or a location.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

  // Isolates this origin from cross-origin windows and resources it never asks for.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/auth", "@repo/ui"],

  // Off by default; `X-Powered-By: Next.js` tells an attacker which advisories to read.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
