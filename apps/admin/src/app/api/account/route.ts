import { proxy } from "@/services/api-proxy";

/** The signed-in person's own record. The API identifies them from the token. */
export async function GET() {
  return proxy("/auth/me/overview");
}
