import { NextResponse } from "next/server";
import { sessionToken } from "@repo/auth";
import { ApiError, ApiUnavailableError, apiFetch } from "@repo/api-client";
import type { ApiErrorBody } from "@repo/contracts";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Calls the API as the signed-in caller.
 *
 * This is the whole job of every route handler under `app/api`: swap the session cookie for a
 * bearer token. No business rule belongs here — the API already owns them, and a second copy
 * would give two places to change one rule.
 *
 * Server-only: it reads the session, so a client component must never import it.
 *
 * @throws {ApiError} when the caller has no session, or the API refuses.
 */
export async function callApi<T>(path: string, method: Method = "GET", body?: unknown): Promise<T> {
  const token = await sessionToken();
  if (!token) throw new ApiError(401, "Sign in to continue.");
  return apiFetch<T>(path, { method, body, token });
}

/** Forwards one call and hands the answer — or the failure — straight back to the browser. */
export async function proxy(
  path: string,
  method: Method = "GET",
  body?: unknown,
): Promise<NextResponse> {
  try {
    const data = await callApi<unknown>(path, method, body);
    // A 204 from the API arrives as undefined; JSON.stringify(undefined) is not valid JSON.
    return data === undefined ? new NextResponse(null, { status: 204 }) : NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** The one place an exception becomes a response, so every endpoint fails the same shape. */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.message, error.fieldErrors);
  }
  if (error instanceof ApiUnavailableError) {
    console.error("[api-proxy] API unreachable", error);
    return errorResponse(503, "The service is temporarily unavailable.");
  }
  console.error("[api-proxy] unexpected failure", error);
  return errorResponse(500, "Something went wrong.");
}

function errorResponse(
  statusCode: number,
  message: string,
  errors?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ statusCode, message, errors } satisfies ApiErrorBody, {
    status: statusCode,
  });
}
