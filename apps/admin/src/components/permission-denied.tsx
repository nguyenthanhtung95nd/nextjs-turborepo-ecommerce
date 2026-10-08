import { Lock } from "lucide-react";

/**
 * In-shell 403 state for a page the signed-in user may not open.
 *
 * Distinct from `Forbidden`, which replaces the whole shell when the account has no staff role
 * at all. Here the user belongs in the admin area — just not on this page.
 */
export function PermissionDenied({ action }: { action: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" aria-hidden="true" />
      </div>
      <h1 className="text-base font-semibold">Forbidden</h1>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        Your roles don&rsquo;t allow you to {action}. Ask an administrator if you need access.
      </p>
    </div>
  );
}
