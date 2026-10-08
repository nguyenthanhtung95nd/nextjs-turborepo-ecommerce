import { redirect } from "next/navigation";
import { auth } from "@repo/auth";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user && session.user.permissions.length > 0) redirect("/");

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            A
          </span>
          <span className="font-semibold">E-Commerce Admin</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">Staff access to the back office.</p>
        <LoginForm />
      </div>
    </main>
  );
}
