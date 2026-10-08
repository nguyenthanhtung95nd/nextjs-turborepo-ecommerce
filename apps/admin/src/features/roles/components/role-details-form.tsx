"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { FormField } from "@/components/form-field";
import { Panel } from "@/components/panel";
import { useUpdateRole } from "../api/use-roles";
import { toRoleFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";
import { type RoleFormInput, roleFormSchema } from "@repo/contracts";

interface Props {
  roleId: string;
  name: string;
  description: string | null;
}

export function RoleDetailsForm({ roleId, name, description }: Props) {
  const update = useUpdateRole(roleId);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RoleFormInput>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name, description: description ?? "" },
  });

  async function onSubmit(values: RoleFormInput) {
    setFormError(null);
    const result = await runWrite(() => update.mutateAsync(values), toRoleFailure<RoleFormInput>);
    if (result.ok) {
      // Re-baseline so the form is no longer dirty and a second save is not offered.
      reset(values);
      setSaved(true);
      return;
    }
    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof RoleFormInput, { message });
    }
  }

  return (
    <Panel title="Details">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        {formError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <FormField
          id="role-name"
          label="Name"
          hint="Capitals and underscores, e.g. CATALOG_EDITOR."
          error={errors.name?.message}
        >
          <Input
            id="role-name"
            className="font-mono"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "role-name-error" : undefined}
            {...register("name", { onChange: () => setSaved(false) })}
          />
        </FormField>

        <FormField
          id="role-description"
          label="Description"
          hint="Optional — what this role is for."
          error={errors.description?.message}
        >
          <Input
            id="role-description"
            aria-invalid={Boolean(errors.description)}
            {...register("description", { onChange: () => setSaved(false) })}
          />
        </FormField>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Saving…" : "Save details"}
          </Button>
          {saved && !isDirty && (
            <p role="status" className="text-sm text-muted-foreground">
              Details saved.
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}
