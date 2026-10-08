"use client";

import { RouteErrorState } from "@/components/route-error-state";

// Catches the pages in this group without a boundary of their own; the section routes keep
// their own error.tsx and take precedence.
export default function AppSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState scope="admin" title="Couldn’t load this page" error={error} reset={reset} />
  );
}
