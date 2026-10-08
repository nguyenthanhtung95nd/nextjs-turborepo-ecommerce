import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Component tests for the storefront.
 *
 * `esbuild.jsx` is set because the app's tsconfig leaves JSX for Next to compile
 * (`jsx: preserve`), so the test runner has to be told how to handle it itself.
 */
export default defineConfig({
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    // jsdom plus accessible-name computation is slow under parallel load; the default 5s
    // produces timeouts that look like bugs but are only the environment.
    testTimeout: 20_000,
  },
});
