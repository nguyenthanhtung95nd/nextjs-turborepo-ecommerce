import { redirect } from "next/navigation";
import { auth, checkSession } from "@repo/auth";
import { AppShell } from "@/components/app-shell";
import { NAV_ITEMS } from "@/components/nav-items";
import { Forbidden } from "@/components/forbidden";
import { ServiceUnavailable } from "@/components/service-unavailable";

// Server-enforced admin gate (defense in depth): must be signed in, still active, AND hold at
// least one staff role. A staff role always grants >=1 permission, so an empty permission union
// == no staff role.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Checked against the database, not the token: deactivation happens after sign-in and cannot
  // reach a JWT that has already been issued.
  const status = await checkSession(session);
  // An outage is not a refusal, and saying so wrongly sends people to an administrator who
  // cannot help.
  if (status === "unreachable") return <ServiceUnavailable />;
  if (status === "inactive") {
    return <Forbidden email={session.user.email ?? ""} reason="deactivated" />;
  }

  const permissions = session.user.permissions;
  if (permissions.length === 0) return <Forbidden email={session.user.email ?? ""} />;

  const nav = NAV_ITEMS.filter((i) => i.permission === null || permissions.includes(i.permission));
  const user = { email: session.user.email ?? "", name: session.user.name ?? null };

  return (
    <AppShell user={user} nav={nav}>
      {children}
    </AppShell>
  );
}
