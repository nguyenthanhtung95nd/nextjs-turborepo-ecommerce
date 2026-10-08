import { Label } from "@repo/ui/label";

interface Props {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

/**
 * Label + control + hint/error for one form field.
 *
 * The control stays the caller's own element so it can be registered with react-hook-form.
 * The caller wires `aria-invalid` and `aria-describedby={`${id}-error`}` onto it; this
 * component owns the element those ids point at.
 */
export function FormField({ id, label, hint, error, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
