import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { RoleDetailScreen } from "@/features/roles/components/role-detail-screen";

// The role's name is fetched in the browser, so the tab title stays generic rather than making
// the server fetch the same record a second time just to name it.
export const metadata = { title: "Role" };

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasPermission(session, "role:manage")) {
    return <PermissionDenied action="manage roles" />;
  }

  const { id } = await params;
  return <RoleDetailScreen id={id} />;
}
