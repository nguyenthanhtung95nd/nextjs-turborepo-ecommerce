import { proxy } from "@/services/api-proxy";

/** Roles as id and name, for the assignment controls on the user screens. */
export async function GET() {
  return proxy("/roles/options");
}
