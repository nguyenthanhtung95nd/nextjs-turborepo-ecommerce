import { auth, hasPermission } from "@repo/auth";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();

  return (
    <DashboardScreen
      signedInAs={session?.user?.name ?? session?.user?.email ?? ""}
      canReadProducts={hasPermission(session, "product:read")}
      canManageUsers={hasPermission(session, "user:manage")}
      canManageRoles={hasPermission(session, "role:manage")}
    />
  );
}
