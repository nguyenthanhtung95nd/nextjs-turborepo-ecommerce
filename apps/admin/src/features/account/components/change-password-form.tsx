"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { FormField } from "@/components/form-field";
import { Panel } from "@/components/panel";
import { useChangePassword } from "../api/use-account";
import { toPasswordFailure } from "../errors";
import { type ChangePasswordInput, changePasswordSchema } from "@repo/contracts";
import { MIN_PASSWORD_LENGTH } from "@repo/auth/password";

const BLANK: ChangePasswordInput = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: BLANK,
  });

  const change = useChangePassword();

  async function submitPassword(values: ChangePasswordInput) {
    try {
      await change.mutateAsync(values);
      return { ok: true } as const;
    } catch (error) {
      return toPasswordFailure(error);
    }
  }

  async function onSubmit(values: ChangePasswordInput) {
    setFormError(null);
    const result = await submitPassword(values);
    if (result.ok) {
      // Clear the fields rather than leave three passwords sitting in the DOM.
      reset(BLANK);
      setSaved(true);
      return;
    }
    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof ChangePasswordInput, { message });
    }
  }

  return (
    <Panel title="Change password">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid max-w-md gap-4">
        {formError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <FormField
          id="current-password"
          label="Current password"
          error={errors.currentPassword?.message}
        >
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
            {...register("currentPassword", { onChange: () => setSaved(false) })}
          />
        </FormField>

        <FormField
          id="new-password"
          label="New password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={errors.newPassword?.message}
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={errors.newPassword ? "new-password-error" : undefined}
            {...register("newPassword", { onChange: () => setSaved(false) })}
          />
        </FormField>

        <FormField
          id="confirm-password"
          label="Confirm new password"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            {...register("confirmPassword", { onChange: () => setSaved(false) })}
          />
        </FormField>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Saving…" : "Change password"}
          </Button>
          {saved && (
            <p role="status" className="text-sm text-muted-foreground">
              Password changed.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          You stay signed in here. Sessions on other devices are unaffected.
        </p>
      </form>
    </Panel>
  );
}
