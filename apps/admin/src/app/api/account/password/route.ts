import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

/** Changes the caller's own password. The API reads who that is from the token, never the body. */
export async function POST(request: NextRequest) {
  return proxy("/auth/change-password", "POST", await request.json());
}
