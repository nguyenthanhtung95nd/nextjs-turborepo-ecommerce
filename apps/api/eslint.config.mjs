import { defineConfig, globalIgnores } from "eslint/config";
import base from "@repo/config/eslint";

export default defineConfig([globalIgnores(["dist/**", "node_modules/**"]), ...base]);
