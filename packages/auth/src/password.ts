import bcrypt from "bcryptjs";

export { MIN_PASSWORD_LENGTH, passwordField } from "@repo/contracts";

// Matches the cost factor of the seeded hashes. bcrypt stores the cost inside each hash.
const BCRYPT_COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/** Constant-time, and reads the salt and cost out of the stored hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
