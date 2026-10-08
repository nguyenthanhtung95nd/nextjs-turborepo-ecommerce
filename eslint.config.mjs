/**
 * Root ESLint flat config.
 *
 * Covers the files no app config reaches — the `packages/*` workspaces and anything at the repo
 * root — so an editor still lints them. Each app has its own richer Next.js config, and
 * `turbo run lint` invokes those per package.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import base from "@repo/config/eslint";

export default defineConfig([
  globalIgnores(["**/.next/**", "**/out/**", "**/build/**", "**/dist/**", "**/node_modules/**"]),
  ...base,
]);
