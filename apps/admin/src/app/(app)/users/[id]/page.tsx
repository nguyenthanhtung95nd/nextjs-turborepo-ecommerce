import { auth, hasPermission } from "@repo/auth";
import { PermissionDenied } from "@/components/permission-denied";
import { UserDetailScreen } from "@/features/users/components/user-detail-screen";

// The person's name is fetched in the browser, so the tab title stays generic rather than making
// the server fetch the same record a second time just to name it.
export const metadata = { title: "User" };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasPermission(session, "user:manage")) {
    return <PermissionDenied action="manage users" />;
  }

  const { id } = await params;
  return <UserDetailScreen id={id} signedInUserId={session?.user?.id ?? ""} />;
}
