"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { StatePanel } from "@/components/state-panel";

/**
 * Route boundary for the storefront.
 *
 * The shopper gets a plain sentence and a retry; the cause stays in the server log. Showing
 * `error.message` would expose table names to whoever triggered the failure.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront] render failed", error);
  }, [error]);

  return (
    <div className="py-10">
      <StatePanel
        tone="destructive"
        icon={<AlertTriangle className="size-8" />}
        title="Couldn’t load products"
        description="Something went wrong on our side. Try again in a moment."
      >
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try again
        </button>
      </StatePanel>
    </div>
  );
}
