import type { NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(`/roles/${encodeURIComponent(id)}/permissions`, "PATCH", await request.json());
}
