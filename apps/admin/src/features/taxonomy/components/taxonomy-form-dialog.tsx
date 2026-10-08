"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import type { ActionResult } from "@repo/ui/action-result";
import { slugify } from "../slug";
import { type TaxonomyFormInput, taxonomyFormSchema } from "@repo/contracts";

interface Props {
  title: string;
  description: string;
  submitLabel: string;
  defaults: TaxonomyFormInput;
  /** A server action already bound to its kind (and id, when editing). */
  action: (input: TaxonomyFormInput) => Promise<ActionResult<TaxonomyFormInput>>;
  trigger: React.ReactNode;
}

/**
 * Create/edit form for a category or brand.
 *
 * Two fields do not earn a page of their own, so the form lives in a dialog over the list and
 * the list stays on screen behind it.
 */
export function TaxonomyFormDialog({
  title,
  description,
  submitLabel,
  defaults,
  action,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // A record that already has a slug keeps it: the slug is in the storefront URL, so silently
  // rewriting it while someone fixes a typo in the name would break every link to it.
  const [slugLocked, setSlugLocked] = useState(defaults.slug !== "");

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaxonomyFormInput>({
    resolver: zodResolver(taxonomyFormSchema),
    defaultValues: defaults,
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    // Reopening starts clean — a half-typed, abandoned edit must not reappear later.
    reset(defaults);
    setSlugLocked(defaults.slug !== "");
    setFormError(null);
  }

  async function onSubmit(values: TaxonomyFormInput) {
    setFormError(null);
    const result = await action(values);
    if (result.ok) {
      setOpen(false);
      return;
    }
    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof TaxonomyFormInput, { message });
    }
  }

  const nameField = register("name");
  const slugField = register("slug");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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

            <FormField id="taxonomy-name" label="Name" error={errors.name?.message}>
              <Input
                id="taxonomy-name"
                autoFocus
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "taxonomy-name-error" : undefined}
                {...nameField}
                onChange={(event) => {
                  void nameField.onChange(event);
                  if (!slugLocked) setValue("slug", slugify(event.target.value));
                }}
              />
            </FormField>

            <FormField
              id="taxonomy-slug"
              label="Slug"
              hint="Used in the storefront URL — lowercase letters, numbers and hyphens."
              error={errors.slug?.message}
            >
              <Input
                id="taxonomy-slug"
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={errors.slug ? "taxonomy-slug-error" : undefined}
                {...slugField}
                onChange={(event) => {
                  void slugField.onChange(event);
                  // Clearing the field hands control back to the name.
                  setSlugLocked(event.target.value !== "");
                }}
              />
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
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
