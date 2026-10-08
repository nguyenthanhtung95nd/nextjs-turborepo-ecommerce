"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { type FormState, authenticate } from "@/lib/auth/actions";
import { NEXT_PARAM } from "@/lib/auth/safe-redirect";

const INITIAL: FormState = {};
const ERROR_ID = "sign-in-error";

/**
 * The sign-in form.
 *
 * `useActionState` over a plain `<form action>` rather than a submit handler, so the browser can
 * post it natively: it works before hydration finishes and with JavaScript off, and `type` and
 * `required` give the no-JS path its validation. The client adds a pending state and nothing else.
 */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(authenticate, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <FormAlert id={ERROR_ID}>{state.error}</FormAlert>}

      {/* Carried through the form rather than read from the URL on the server, so the no-JS
          post is identical to the hydrated one. `safeRedirect` re-checks it server-side — this
          value is as attacker-controlled as the query string it came from. */}
      <input type="hidden" name={NEXT_PARAM} value={next} />

      {/* No per-field errors here on purpose: the failure is deliberately not attributable to
          the email or the password, because saying which one was wrong is how you find out
          whether an account exists. */}
      <FormField
        id="email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        defaultValue={state.values?.email}
      />
      <FormField
        id="password"
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
      >
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
