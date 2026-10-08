"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function RolesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState scope="roles" title="Couldn’t load roles" error={error} reset={reset} />;
}
