import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Two projects in one run.
 *
 * `unit` covers pure validation and formatting and stays on Node — no DOM to set up, so it
 * starts instantly. `component` renders real components in jsdom. Keeping them apart means the
 * fast tests are not paying for the slow environment.
 */
export default defineConfig({
  // The app's tsconfig sets `jsx: preserve` for Next to handle, so esbuild has to be told how to
  // compile JSX here. `@vitejs/plugin-react` would do it too, but it only adds Fast Refresh on
  // top — which tests have no use for — and its current major pulls in a different Vite than
  // Vitest runs on.
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: ["tests/**/*.test.tsx"],
          setupFiles: ["./tests/setup-component.ts"],
          // jsdom plus accessible-name computation is slow, and several files render in
          // parallel. The default 5s is enough in isolation and not under load, which produces
          // timeouts that look like bugs; this is the cost of the environment, not a wait on
          // anything broken.
          testTimeout: 20_000,
        },
      },
    ],
  },
});
