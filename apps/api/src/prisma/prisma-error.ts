const PRISMA_CODE_PATTERN = /^P\d{4}$/;

/**
 * Reads a Prisma error code without using `instanceof`.
 *
 * `instanceof Prisma.PrismaClientKnownRequestError` returns false whenever the thrown error came
 * from a different module instance than the one this file imported, which turns every "slug
 * already taken" into "something went wrong". The code is a plain string property either way.
 *
 * @returns The code (`"P2002"`), or `null` when this is not a Prisma request error.
 */
export function prismaErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && PRISMA_CODE_PATTERN.test(code) ? code : null;
}

/**
 * The constraint a P2002 violation names, as a searchable string.
 *
 * Prisma reports it as `meta.target`, usually an array of column names.
 */
export function prismaErrorTarget(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  const meta = (error as { meta?: { target?: unknown } }).meta;
  return String(meta?.target ?? "");
}

/** A unique-constraint violation. */
export const UNIQUE_VIOLATION = "P2002";

/** A foreign-key violation — the row is still referenced, or points at something missing. */
export const FOREIGN_KEY_VIOLATION = "P2003";
