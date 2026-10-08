"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      scope="categories"
      title="Couldn’t load categories"
      error={error}
      reset={reset}
    />
  );
}
