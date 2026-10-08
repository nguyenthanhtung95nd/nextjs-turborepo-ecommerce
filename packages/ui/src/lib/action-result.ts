import type { ZodError } from "zod";

export type FieldErrors<TInput> = Partial<Record<keyof TInput, string>>;

/**
 * What a server action returns.
 *
 * A thrown error reaches the client as an opaque digest, so failures the user can act on — a
 * taken email, a wrong current password — come back as data instead.
 */
export type ActionResult<TInput = never> =
  { ok: true } | { ok: false; error: string; fieldErrors?: FieldErrors<TInput> };

export const FIX_FIELDS_MESSAGE = "Please fix the highlighted fields.";

/**
 * Collapses a Zod failure into one message per field.
 *
 * Only the first issue per field survives: showing a user that a password is both "too short" and
 * "must contain a number" is noise when fixing the first may fix the second.
 */
export function zodFieldErrors<TInput>(error: ZodError): ActionResult<TInput> {
  const fieldErrors: FieldErrors<TInput> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as keyof TInput] = issue.message;
    }
  }
  return { ok: false, error: FIX_FIELDS_MESSAGE, fieldErrors };
}

/**
 * Runs one write and reports its outcome as data.
 *
 * Forms read `{ ok }` rather than catching, because a message the user can act on — a taken
 * slug, a refused rule — is not an exception. Each caller supplies its own mapper, so the
 * wording stays with the domain that owns it.
 */
export async function runWrite<TInput>(
  write: () => Promise<unknown>,
  toFailure: (error: unknown) => ActionResult<TInput>,
): Promise<ActionResult<TInput>> {
  try {
    await write();
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}
