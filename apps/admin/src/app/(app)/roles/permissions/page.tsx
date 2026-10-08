import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { PermissionCatalogScreen } from "@/features/roles/components/permission-catalog-screen";

export const metadata = { title: "Permission catalog" };

// A static segment, so it takes precedence over /roles/[id] — "permissions" is never read as
// a role id.
export default async function PermissionCatalogPage() {
  const session = await auth();
  if (!hasPermission(session, "role:manage")) {
    return <PermissionDenied action="manage roles" />;
  }

  return <PermissionCatalogScreen />;
}
