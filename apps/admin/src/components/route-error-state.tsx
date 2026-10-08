"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { StatePanel } from "@/components/state-panel";
import { TABLE_SURFACE } from "@/components/responsive-table";

interface Props {
  /** The segment this boundary covers, used to tag the server-side log ("products"). */
  scope: string;
  title: string;
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * The body every route `error.tsx` renders.
 *
 * The user gets a plain sentence and a retry; the cause stays in the server log. Showing
 * `error.message` would leak table names and connection strings to whoever triggered it.
 */
export function RouteErrorState({ scope, title, error, reset }: Props) {
  useEffect(() => {
    console.error(`[${scope}] render failed`, error);
  }, [scope, error]);

  return (
    <div className={TABLE_SURFACE}>
      <StatePanel
        tone="destructive"
        icon={<AlertTriangle className="size-5" />}
        title={title}
        description="Something went wrong on our side. The details have been logged — try again in a moment."
      >
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </StatePanel>
    </div>
  );
}
