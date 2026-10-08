import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

export async function GET(request: NextRequest) {
  return proxy(`/users?${request.nextUrl.searchParams.toString()}`);
}

export async function POST(request: NextRequest) {
  return proxy("/users", "POST", await request.json());
}
