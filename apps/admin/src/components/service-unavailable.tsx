import Link from "next/link";
import { PlugZap } from "lucide-react";
import { Button } from "@repo/ui/button";

/**
 * The service could not be reached — which is not the same as being refused.
 *
 * Kept separate from `Forbidden` because the remedy differs and so does the blame: telling
 * someone their account is deactivated when the API is merely down sends them to an
 * administrator for a problem no administrator can see.
 */
export function ServiceUnavailable() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="grid max-w-md justify-items-center gap-4 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <PlugZap aria-hidden="true" className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Can&rsquo;t reach the service</h1>
        <p className="text-sm text-muted-foreground">
          Your account is fine — the admin just can&rsquo;t talk to the API right now. This usually
          clears on its own.
        </p>
        {/* A navigation, not a reload: it re-runs the layout, which is what re-checks the API. */}
        <Button asChild variant="outline">
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </main>
  );
}
