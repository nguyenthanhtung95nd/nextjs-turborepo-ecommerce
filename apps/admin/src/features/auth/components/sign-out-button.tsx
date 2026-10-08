"use client";

import { Loader2, LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@repo/ui/button";
import { useSignOut } from "../api/use-session";

interface Props {
  variant?: ButtonProps["variant"];
  className?: string;
  /** The dropdown renders its own item wrapper, so it asks for the icon and bare styling. */
  withIcon?: boolean;
}

/**
 * Ends the session.
 *
 * Written once because two very different places need it — the account menu and the Forbidden
 * screen — and an account that cannot be signed out of is how someone gets stuck.
 */
export function SignOutButton({ variant = "outline", className, withIcon = false }: Props) {
  const signOut = useSignOut();

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={signOut.isPending}
      onClick={() => signOut.mutate()}
    >
      {signOut.isPending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        withIcon && <LogOut />
      )}
      Sign out
    </Button>
  );
}
