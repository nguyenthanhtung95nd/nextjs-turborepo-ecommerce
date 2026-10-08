"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { useCreateRole } from "../api/use-roles";
import { toRoleFailure } from "../errors";
import { runWrite } from "@repo/ui/action-result";
import { type RoleFormInput, roleFormSchema } from "@repo/contracts";

const BLANK: RoleFormInput = { name: "", description: "" };

/**
 * Creates a role with a name and description only.
 *
 * Permissions are chosen afterwards on the role's own page rather than here: putting the full
 * catalog in a dialog would mean maintaining the same checklist in two places.
 */
export function CreateRoleDialog() {
  const create = useCreateRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormInput>({ resolver: zodResolver(roleFormSchema), defaultValues: BLANK });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    reset(BLANK);
    setFormError(null);
  }

  async function onSubmit(values: RoleFormInput) {
    setFormError(null);
    const result = await runWrite(() => create.mutateAsync(values), toRoleFailure<RoleFormInput>);
    if (result.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof RoleFormInput, { message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          New role
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>New role</DialogTitle>
            <DialogDescription>
              Name it first. You will pick its permissions on the role&rsquo;s own page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-5 pb-5">
            {formError && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            <FormField
              id="new-role-name"
              label="Name"
              hint="Capitals and underscores, e.g. CATALOG_EDITOR."
              error={errors.name?.message}
            >
              <Input
                id="new-role-name"
                autoFocus
                className="font-mono"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "new-role-name-error" : undefined}
                {...register("name")}
              />
            </FormField>

            <FormField
              id="new-role-description"
              label="Description"
              hint="Optional."
              error={errors.description?.message}
            >
              <Input id="new-role-description" {...register("description")} />
            </FormField>
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
              {isSubmitting ? "Creating…" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
