/**
 * The form-level message.
 *
 * `role="alert"` so it is announced when it appears — a shopper who submitted with the keyboard
 * may have focus nowhere near the top of the form, and a silently-rendered error reads as the
 * button simply not working.
 */
export function FormAlert({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p
      role="alert"
      id={id}
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  );
}

/** The same shape in the affirmative, for "your password was changed". */
export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-primary/35 bg-accent px-3 py-2 text-sm font-medium text-primary"
    >
      {children}
    </p>
  );
}
