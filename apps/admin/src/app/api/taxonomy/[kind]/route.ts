import { NextResponse, type NextRequest } from "next/server";
import { proxy } from "@/services/api-proxy";
import { TAXONOMY, isTaxonomyKind } from "@/features/taxonomy/kinds";

type Params = { params: Promise<{ kind: string }> };

/** `kind` arrives from the URL, so it is narrowed before it indexes anything. */
async function routeFor(params: Params["params"]): Promise<string | null> {
  const { kind } = await params;
  return isTaxonomyKind(kind) ? TAXONOMY[kind].route : null;
}

const UNKNOWN_KIND = NextResponse.json(
  { statusCode: 404, message: "Unknown record type." },
  { status: 404 },
);

export async function GET(_request: NextRequest, { params }: Params) {
  const route = await routeFor(params);
  return route ? proxy(route) : UNKNOWN_KIND;
}

export async function POST(request: NextRequest, { params }: Params) {
  const route = await routeFor(params);
  return route ? proxy(route, "POST", await request.json()) : UNKNOWN_KIND;
}
