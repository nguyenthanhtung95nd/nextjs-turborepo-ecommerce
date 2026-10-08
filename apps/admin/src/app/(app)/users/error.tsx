"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState scope="users" title="Couldn’t load users" error={error} reset={reset} />;
}
