import { AccountScreen } from "@/features/account/components/account-screen";

export const metadata = { title: "Your account" };

/**
 * Everyone who can reach the admin area owns an account, so this page needs no permission of
 * its own — only a session, which the layout already requires.
 */
export default function AccountSettingsPage() {
  return <AccountScreen />;
}
