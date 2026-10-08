interface Props {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  /** Shown under the field and wired up with `aria-describedby`. */
  error?: string;
  /** Always-visible guidance, such as the minimum password length. */
  hint?: string;
}

/**
 * One labelled input with its error and hint.
 *
 * The label is a real `<label htmlFor>`, not a placeholder: a placeholder disappears the moment
 * someone types, which is exactly when they most need to know what the field was for.
 *
 * `aria-describedby` points at whichever of hint and error exist, so the message reaches a screen
 * reader instead of only being visible under the box.
 */
export function FormField({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  required = false,
  defaultValue,
  error,
  hint,
}: Props) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {!required && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`h-11 rounded-lg border bg-background px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          error ? "border-destructive" : "border-border"
        }`}
      />

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
