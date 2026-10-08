"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { FormField } from "@/components/form-field";
import { Panel } from "@/components/panel";
import { useUpdateUserProfile } from "../api/use-users";
import { toUserFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";
import { type UserProfileInput, userProfileSchema } from "@repo/contracts";

interface Props {
  userId: string;
  email: string;
  name: string | null;
  joined: string;
}

export function UserProfileForm({ userId, email, name, joined }: Props) {
  const save = useUpdateUserProfile(userId);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: { name: name ?? "" },
  });

  async function onSubmit(values: UserProfileInput) {
    setFormError(null);
    const result = await runWrite(() => save.mutateAsync(values), toUserFailure<UserProfileInput>);
    if (result.ok) {
      // Re-baseline so the form is no longer dirty and a second save is not offered.
      reset(values);
      setSaved(true);
      return;
    }
    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof UserProfileInput, { message });
    }
  }

  return (
    <Panel title="Profile">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        {formError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <FormField id="user-name" label="Name" error={errors.name?.message}>
          <Input
            id="user-name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "user-name-error" : undefined}
            {...register("name", { onChange: () => setSaved(false) })}
          />
        </FormField>

        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <p className="text-sm text-muted-foreground">{email}</p>
          {/* Email is the sign-in identity; changing it is an account-recovery flow, not a
              profile edit. Shown read-only rather than hidden so the record is complete. */}
          <p className="text-xs text-muted-foreground">
            Used to sign in and cannot be changed here.
          </p>
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Joined</span>
          <p className="text-sm text-muted-foreground">{joined}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Saving…" : "Save profile"}
          </Button>
          {saved && !isDirty && (
            <p role="status" className="text-sm text-muted-foreground">
              Profile saved.
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}
