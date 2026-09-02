// Shared ESLint base for the whole repo — correctness rules only (Prettier owns formatting).
// Spread into each app's Next.js config, and used directly at the repo root by lint-staged.
export default [
  {
    rules: {
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];
