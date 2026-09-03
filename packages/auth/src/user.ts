import bcrypt from "bcryptjs";
import { prisma } from "@repo/db";
import { permissionUnion } from "./permissions";

export type AuthUser = { id: string; email: string; name: string | null };

// Credentials check for the Auth.js provider. Returns null on ANY failure (unknown email,
// inactive account, or wrong password) so a caller can't tell which — avoids user enumeration.
export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user || !user.is_active) return null;
  if (!(await bcrypt.compare(password, user.password_hash))) return null;

  // id is a Postgres BigInt; JWTs can't serialize BigInt, so expose it as a string.
  return { id: user.id.toString(), email: user.email, name: user.name };
}

// A user's effective permissions: the deduped union across all of their roles.
export async function loadUserPermissions(userId: bigint): Promise<string[]> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      user_roles: {
        select: {
          roles: {
            select: { role_permissions: { select: { permissions: { select: { key: true } } } } },
          },
        },
      },
    },
  });
  if (!user) return [];

  const perRole = user.user_roles.map((ur) =>
    ur.roles.role_permissions.map((rp) => rp.permissions.key),
  );
  return permissionUnion(perRole);
}
