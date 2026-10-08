"use client";

import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { FormField } from "@/components/form-field";
import { useCreateUser } from "../api/use-users";
import { toUserFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";
import type { RoleOption } from "@/features/users/services";
import { MIN_PASSWORD_LENGTH } from "@repo/auth/password";
import { type CreateUserInput, createUserSchema } from "@repo/contracts";
import { RoleChecklist } from "./role-checklist";

const BLANK: CreateUserInput = { email: "", name: "", password: "", roleIds: [] };

export function CreateUserDialog({ roles }: { roles: readonly RoleOption[] }) {
  const create = useCreateUser();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), defaultValues: BLANK });

  // `useController` rather than `watch`: the checklist needs the current value *and* a setter,
  // and reading `watch()` inside the change handler re-subscribes on every keystroke.
  const { field: roleIds } = useController({ control, name: "roleIds" });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    // Reopening starts clean — an abandoned draft must never resurface, least of all a password.
    reset(BLANK);
    setFormError(null);
  }

  async function onSubmit(values: CreateUserInput) {
    setFormError(null);
    const result = await runWrite(() => create.mutateAsync(values), toUserFailure<CreateUserInput>);
    if (result.ok) {
      setOpen(false);
      return;
    }
    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof CreateUserInput, { message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          New user
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>
              Give them a password to sign in with for the first time. Without a role they are a
              customer and cannot reach the admin area.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto px-5 pb-5">
            {formError && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            <FormField id="new-user-email" label="Email" error={errors.email?.message}>
              <Input
                id="new-user-email"
                type="email"
                autoComplete="off"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "new-user-email-error" : undefined}
                {...register("email")}
              />
            </FormField>

            <FormField
              id="new-user-name"
              label="Name"
              hint="Optional."
              error={errors.name?.message}
            >
              <Input id="new-user-name" autoComplete="off" {...register("name")} />
            </FormField>

            <FormField
              id="new-user-password"
              label="Initial password"
              hint={`At least ${MIN_PASSWORD_LENGTH} characters. They can change it later.`}
              error={errors.password?.message}
            >
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "new-user-password-error" : undefined}
                {...register("password")}
              />
            </FormField>

            <RoleChecklist
              legend="Roles"
              roles={roles}
              selectedIds={roleIds.value}
              onToggle={(roleId, checked) =>
                roleIds.onChange(
                  checked
                    ? [...roleIds.value, roleId]
                    : roleIds.value.filter((id) => id !== roleId),
                )
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
