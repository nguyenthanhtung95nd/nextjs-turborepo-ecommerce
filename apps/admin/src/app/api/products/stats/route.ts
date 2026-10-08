import { proxy } from "@/services/api-proxy";

/** How many products sit in each status, for the heading and the dashboard card. */
export async function GET() {
  return proxy("/products/stats");
}
