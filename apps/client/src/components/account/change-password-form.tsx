"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@repo/auth/password";
import type { FieldErrors } from "@repo/ui/action-result";
import { FormAlert, FormSuccess } from "@/components/auth/form-alert";
import { FormField } from "@/components/auth/form-field";
import { changeOwnPassword } from "@/lib/account/actions";
import type { ChangePasswordInput } from "@repo/contracts";

const ERROR_ID = "change-password-error";

type Status =
  | { kind: "idle" }
  | { kind: "done" }
  | { kind: "failed"; error: string; fieldErrors: FieldErrors<ChangePasswordInput> };

/**
 * The change-password form.
 *
 * Takes `FormData` from a native `<form action>` and hands the action a typed object, so the
 * three fields are named once in the markup and once in the schema rather than being threaded
 * through four `useState` hooks.
 *
 * On success the form resets itself: leaving a filled password box on screen after it has been
 * accepted invites a second submit that would now fail, because the "current" password changed.
 */
export function ChangePasswordForm({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const input: ChangePasswordInput = {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    startTransition(async () => {
      const result = await changeOwnPassword(input);
      if (result.ok) {
        setStatus({ kind: "done" });
        return;
      }
      setStatus({
        kind: "failed",
        error: result.error,
        fieldErrors: result.fieldErrors ?? {},
      });
    });
  }

  const errors = status.kind === "failed" ? status.fieldErrors : {};

  return (
    <form
      action={onSubmit}
      // Remounts the inputs after a success, clearing them without a ref or an effect.
      key={status.kind === "done" ? "done" : "editing"}
      className="flex max-w-sm flex-col gap-4"
    >
      {status.kind === "failed" && <FormAlert id={ERROR_ID}>{status.error}</FormAlert>}
      {status.kind === "done" && <FormSuccess>Your password has been changed.</FormSuccess>}

      {/*
        A password form with no username field leaves a password manager unable to tell which
        account the new password belongs to, so it offers to save it against nothing — Chrome
        warns about exactly this. The field is hidden and read-only because it is here for the
        manager, not for the shopper; the server ignores it and uses the session's id.
      */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
        aria-hidden="true"
        tabIndex={-1}
      />

      <FormField
        id="currentPassword"
        name="currentPassword"
        label="Current password"
        type="password"
        required
        autoComplete="current-password"
        error={errors.currentPassword}
      />
      <FormField
        id="newPassword"
        name="newPassword"
        label="New password"
        type="password"
        required
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        error={errors.newPassword}
      />
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        required
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
      >
        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {isPending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
