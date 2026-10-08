import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxy(`/products/${encodeURIComponent(id)}`);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxy(`/products/${encodeURIComponent(id)}`, "PATCH", await request.json());
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxy(`/products/${encodeURIComponent(id)}`, "DELETE");
}
