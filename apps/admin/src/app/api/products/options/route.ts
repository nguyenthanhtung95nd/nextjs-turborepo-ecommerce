import { NextResponse } from "next/server";
import type { FacetDto } from "@repo/contracts";
import { callApi, toErrorResponse } from "@/services/api-proxy";

/**
 * Categories and brands in one response.
 *
 * The API keeps them as two generic endpoints; the product form needs both at once, so the
 * joining happens here. Shaping a response around one screen is what this layer is for.
 */
export async function GET() {
  try {
    const [categories, brands] = await Promise.all([
      callApi<FacetDto[]>("/categories"),
      callApi<FacetDto[]>("/brands"),
    ]);
    return NextResponse.json({
      categories: categories.map((item) => ({ id: item.id, name: item.name })),
      brands: brands.map((item) => ({ id: item.id, name: item.name })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
