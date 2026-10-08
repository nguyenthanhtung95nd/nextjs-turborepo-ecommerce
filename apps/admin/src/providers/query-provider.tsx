"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@repo/api-client";

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

/**
 * Retries only what retrying can fix.
 *
 * A 403 or a 404 means the server answered and the answer will not change, so a second attempt
 * only delays the message the user needs to see. A network failure or a 5xx is worth retrying.
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Created once per browser session rather than per render, so navigating does not throw the
  // cache away — that cache is the reason going back to a filter feels instant.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: STALE_TIME_MS, retry: shouldRetry } },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
