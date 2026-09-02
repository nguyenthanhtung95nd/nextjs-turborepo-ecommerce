/**
 * Root ESLint flat config. Used by the lint-staged pre-commit hook, which runs
 * `eslint` from the repo root against staged files. Each app additionally has
 * its own richer Next.js config that `turbo run lint` invokes per package.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import base from "@repo/config/eslint";

export default defineConfig([
  globalIgnores(["**/.next/**", "**/out/**", "**/build/**", "**/dist/**", "**/node_modules/**"]),
  ...base,
]);
