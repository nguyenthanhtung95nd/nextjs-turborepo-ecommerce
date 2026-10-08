import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { UsersScreen } from "@/features/users/components/users-screen";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await auth();
  // Defence in depth: the nav already hides this section, but a typed URL must not reach data.
  if (!hasPermission(session, "user:manage")) {
    return <PermissionDenied action="manage users" />;
  }

  return <UsersScreen />;
}
