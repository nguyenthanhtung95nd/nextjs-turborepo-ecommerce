// Shared PrismaClient singleton. Server-side only (Server Components, route handlers,
// server actions) — Prisma cannot run in the browser.
// Cached on globalThis in dev so hot-reload reuses one client instead of opening a new
// DB connection on every reload; in production the module loads once, so no cache is needed.
import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
