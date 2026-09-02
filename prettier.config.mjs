/**
 * Root Prettier config. Prettier resolves the nearest config walking up from
 * each file, so this one set of options (from the shared preset) governs the
 * whole monorepo — including format-on-save in the apps.
 */
export { default } from "@repo/config/prettier";
