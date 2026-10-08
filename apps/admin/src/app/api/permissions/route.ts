import { proxy } from "@/services/api-proxy";

/** The permission catalog. Read-only — the rows are seeded from the same list the guards check. */
export async function GET() {
  return proxy("/permissions");
}
