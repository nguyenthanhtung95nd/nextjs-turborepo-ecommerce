"use client";

import { RouteErrorState } from "@/components/route-error-state";

export default function BrandsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState scope="brands" title="Couldn’t load brands" error={error} reset={reset} />
  );
}
