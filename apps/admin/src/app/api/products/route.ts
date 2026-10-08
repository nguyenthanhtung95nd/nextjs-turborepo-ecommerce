import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

/**
 * One page of products for the admin list.
 *
 * The query string is passed through untouched: the API owns which parameters exist and what an
 * invalid one falls back to, so parsing it twice would give two answers to the same question.
 */
export async function GET(request: NextRequest) {
  return proxy(`/products?${request.nextUrl.searchParams.toString()}`);
}

export async function POST(request: NextRequest) {
  return proxy("/products", "POST", await request.json());
}
