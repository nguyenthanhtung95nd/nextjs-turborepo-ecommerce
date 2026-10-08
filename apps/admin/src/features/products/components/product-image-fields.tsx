"use client";

import { useFieldArray } from "react-hook-form";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import type {
  ProductFormControl,
  ProductFormErrors,
  ProductFormRegister,
} from "./product-form-types";

interface Props {
  control: ProductFormControl;
  register: ProductFormRegister;
  errors: ProductFormErrors;
}

/**
 * The ordered list of image URLs.
 *
 * Position is the array index rather than a stored field, so reordering is a list operation
 * and there is no second source of truth to keep in sync.
 */
export function ProductImageFields({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "images" });

  return (
    <section aria-label="Images" className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-semibold">Images</h2>
      <div className="grid gap-3 p-4">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No images yet. The first image in the list becomes the thumbnail.
          </p>
        )}

        {fields.map((field, index) => {
          const error = errors.images?.[index]?.url?.message;
          const inputId = `image-url-${index}`;
          return (
            <div key={field.id} className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor={inputId} className="text-xs text-muted-foreground">
                  Image {index + 1} URL
                </Label>
                <Input
                  id={inputId}
                  type="url"
                  inputMode="url"
                  placeholder="https://cdn.example.com/photo.jpg"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  {...register(`images.${index}.url`)}
                />
                {error && (
                  <p id={`${inputId}-error`} className="text-xs text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => remove(index)}
              >
                <Trash2 aria-hidden="true" />
                <span className="sr-only">Remove image {index + 1}</span>
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() => append({ url: "", alt: "" })}
        >
          <ImagePlus aria-hidden="true" />
          Add image URL
        </Button>
      </div>
    </section>
  );
}
