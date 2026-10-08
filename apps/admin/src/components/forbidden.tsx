import { Ban } from "lucide-react";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

/** Why the account is being refused — the two cases need different remedies. */
type Reason = "no-role" | "deactivated";

const MESSAGES: Record<Reason, string> = {
  "no-role": "access to the admin area. This check is enforced on the server.",
  deactivated: "an active account. It has been deactivated, so nothing here is available.",
};

interface Props {
  email: string;
  reason?: Reason;
}

/**
 * Shown when a signed-in user may not be in the admin area at all.
 *
 * Rendered by the server layout, so the gate is enforced rather than merely hidden. Being
 * deactivated and having no staff role both land here, but they are said differently: one is
 * something an administrator can grant, the other is the account itself being switched off.
 */
export function Forbidden({ email, reason = "no-role" }: Props) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-7 shadow-sm">
        <div className="mx-auto mb-4 grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
          <Ban className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Forbidden</h1>
        <p className="mx-auto mb-6 mt-1.5 max-w-sm text-sm text-muted-foreground">
          {email ? (
            <>
              <span className="font-medium text-foreground">{email}</span> doesn&rsquo;t have
            </>
          ) : (
            "Your account doesn't have"
          )}{" "}
          {MESSAGES[reason]}
        </p>
        <SignOutButton />
      </div>
    </main>
  );
}
