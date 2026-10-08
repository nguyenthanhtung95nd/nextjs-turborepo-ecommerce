"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState scope="products" title="Couldn’t load products" error={error} reset={reset} />
  );
}
