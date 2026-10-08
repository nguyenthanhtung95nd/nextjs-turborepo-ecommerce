"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { toSignInMessage, useSignIn } from "../api/use-session";

/**
 * The sign-in form.
 *
 * It posts to this app's own session endpoint, which sets the `httpOnly` cookie — the password
 * and the resulting token are both handled server-side, and neither is ever held in JavaScript.
 *
 * `type` and `required` stay on the inputs so the browser still validates before anything is
 * sent. Unlike the earlier version this does need JavaScript: the admin is a single-page app,
 * so a sign-in that worked before hydration would only lead to a screen that does not.
 */
export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const signIn = useSignIn();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    signIn.mutate(
      {
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      },
      { onError: (cause) => setError(toSignInMessage(cause)) },
    );
  }

  // Stays disabled after a success too: the redirect is in flight, and a second submit would
  // fire against a session that already exists.
  const isBusy = signIn.isPending || signIn.isSuccess;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          id="sign-in-error"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "sign-in-error" : undefined}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "sign-in-error" : undefined}
        />
      </div>

      <Button type="submit" disabled={isBusy} className="mt-1 w-full">
        {isBusy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isBusy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
