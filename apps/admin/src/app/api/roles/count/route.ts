import { proxy } from "@/services/api-proxy";

export async function GET() {
  return proxy("/roles/count");
}
