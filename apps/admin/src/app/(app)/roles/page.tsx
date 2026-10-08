import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { RolesScreen } from "@/features/roles/components/roles-screen";

export const metadata = { title: "Roles" };

export default async function RolesPage() {
  const session = await auth();
  // Defence in depth: the nav already hides this section, but a typed URL must not reach data.
  if (!hasPermission(session, "role:manage")) {
    return <PermissionDenied action="manage roles" />;
  }

  return <RolesScreen />;
}
