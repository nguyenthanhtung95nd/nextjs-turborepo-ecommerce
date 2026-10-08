import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

export async function GET() {
  return proxy("/roles");
}

export async function POST(request: NextRequest) {
  return proxy("/roles", "POST", await request.json());
}
