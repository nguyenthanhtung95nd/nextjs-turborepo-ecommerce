import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/auth", "@repo/db"],
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
