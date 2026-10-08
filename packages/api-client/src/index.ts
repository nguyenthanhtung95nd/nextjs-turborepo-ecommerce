import type { ApiErrorBody } from "@repo/contracts";

const DEFAULT_TIMEOUT_MS = 10_000;

/** A non-2xx response from the API, carrying enough for a caller to map it to its own UI. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The API could not be reached at all — down, unreachable, or slower than the timeout. */
export class ApiUnavailableError extends Error {
  constructor(cause: unknown) {
    super("The API is unavailable.");
    this.name = "ApiUnavailableError";
    this.cause = cause;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Bearer token for authenticated calls. */
  token?: string;
  /** Passed straight to Next's extended fetch; ignored elsewhere. */
  next?: { revalidate?: number | false; tags?: string[] };
  timeoutMs?: number;
}

function baseUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new Error("API_URL is not set.");
  return url.replace(/\/+$/, "");
}

/**
 * Calls the API and returns the parsed body.
 *
 * @throws {ApiError} on any non-2xx response.
 * @throws {ApiUnavailableError} when the request never completed.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, token, next, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      ...(next ? { next } : {}),
    } as RequestInit);
  } catch (cause) {
    throw new ApiUnavailableError(cause);
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      response.status,
      error.message ?? `Request failed with status ${response.status}.`,
      error.errors,
    );
  }

  return payload as T;
}
