import { NextResponse, type NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";
import { TAXONOMY, isTaxonomyKind } from "@/features/taxonomy/kinds";

type Params = { params: Promise<{ kind: string; id: string }> };

async function pathFor(params: Params["params"]): Promise<string | null> {
  const { kind, id } = await params;
  return isTaxonomyKind(kind) ? `${TAXONOMY[kind].route}/${encodeURIComponent(id)}` : null;
}

const UNKNOWN_KIND = NextResponse.json(
  { statusCode: 404, message: "Unknown record type." },
  { status: 404 },
);

export async function PATCH(request: NextRequest, { params }: Params) {
  const path = await pathFor(params);
  return path ? proxy(path, "PATCH", await request.json()) : UNKNOWN_KIND;
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const path = await pathFor(params);
  return path ? proxy(path, "DELETE") : UNKNOWN_KIND;
}
