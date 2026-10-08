"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@repo/auth/password";
import { FormAlert } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { type FormState, register } from "@/lib/auth/actions";

const INITIAL: FormState = {};
const ERROR_ID = "register-error";

/**
 * The registration form.
 *
 * Like the sign-in form, a plain `<form action>` so it posts natively before hydration. Field
 * errors come back from the server action because the server is where the rules actually live —
 * the browser's own `required` and `type="email"` are a convenience, not the check.
 */
export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, INITIAL);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <FormAlert id={ERROR_ID}>{state.error}</FormAlert>}

      {/* React 19 resets an uncontrolled form after a form action, so these refill from what the
          server echoed back — otherwise one mistyped password clears all four fields. */}
      <FormField
        id="name"
        name="name"
        label="Name"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={errors.name}
      />
      <FormField
        id="email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <FormField
        id="password"
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        error={errors.password}
      />
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        type="password"
        required
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
      >
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
