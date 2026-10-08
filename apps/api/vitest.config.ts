import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The DB-backed test reads DATABASE_URL from .env when it is not already in the environment,
// so `pnpm --filter api test` works while the database is up and self-skips when it is not.
function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = fileURLToPath(new URL("./.env", import.meta.url));
    const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.*)$/m);
    return match?.[1]?.trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const databaseUrl = resolveDatabaseUrl();

export default defineConfig({
  esbuild: { target: "es2022" },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: databaseUrl ? { DATABASE_URL: databaseUrl } : {},
  },
});
