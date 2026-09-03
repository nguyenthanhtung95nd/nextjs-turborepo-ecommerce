import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The DB-backed verification test needs DATABASE_URL. Reuse packages/db/.env when
// present so `pnpm --filter @repo/auth test` "just works" while the DB is up; when
// absent (e.g. CI without a DB) that test self-skips and only unit tests run.
function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = fileURLToPath(new URL("../db/.env", import.meta.url));
    const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(.*)$/m);
    return match?.[1]?.trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const databaseUrl = resolveDatabaseUrl();

export default defineConfig({
  test: {
    environment: "node",
    env: databaseUrl ? { DATABASE_URL: databaseUrl } : {},
  },
});
