import { Header } from "@/shared/components/layout/header";
import { authService } from "@/modules/identity/services/auth-service";
import { isSupabaseConfigured } from "@/lib/env";

type DashboardShellProps = {
  title: string;
  breadcrumbs?: string[];
  children: React.ReactNode;
};

export async function DashboardShell({
  title,
  breadcrumbs,
  children,
}: DashboardShellProps) {
  let userName: string | undefined;
  let userEmail: string | undefined;

  if (isSupabaseConfigured()) {
    try {
      const user = await authService.getCurrentUser();
      userName = user?.fullName;
      userEmail = user?.email;
    } catch {
      // Ignore sync errors in shell.
    }
  }

  return (
    <>
      <Header
        title={title}
        breadcrumbs={breadcrumbs}
        userName={userName}
        userEmail={userEmail}
      />
      <main className="flex-1 p-6">{children}</main>
    </>
  );
}
