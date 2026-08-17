import { requireRole } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["Admin", "StoreManager"]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div>
          <p className="text-sm font-medium">{user.email}</p>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
