import axios, { type AxiosError } from "axios";
import { ApiError, ApiUnavailableError } from "@repo/api-client";
import type { ApiErrorBody } from "@repo/contracts";

const TIMEOUT_MS = 10_000;

/**
 * The browser's only way to reach data.
 *
 * It calls this app's own route handlers, never the API directly: the access token lives in an
 * `httpOnly` cookie that JavaScript cannot read, so the request carries the cookie and the server
 * attaches the token. `baseURL` is a path, not an origin, which is what keeps it same-origin.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: TIMEOUT_MS,
});

/**
 * Normalises failures into the same two errors the server-side caller throws.
 *
 * Without this a 409 would arrive as an `AxiosError` here and as an `ApiError` in a server action,
 * and every screen would need to handle both.
 */
apiClient.interceptors.response.use(undefined, (error: AxiosError<ApiErrorBody>) => {
  const response = error.response;
  if (!response) throw new ApiUnavailableError(error);

  const body = response.data;
  throw new ApiError(
    response.status,
    body?.message ?? "Something went wrong.",
    body?.errors ?? undefined,
  );
});
