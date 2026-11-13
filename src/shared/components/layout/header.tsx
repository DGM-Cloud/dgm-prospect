"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";

type HeaderProps = {
  title: string;
  breadcrumbs?: string[];
  userName?: string;
  userEmail?: string;
};

export function Header({ title, breadcrumbs = [], userName, userEmail }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    if (!isSupabaseConfigured()) {
      router.push("/login");
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
      <div>
        {breadcrumbs.length > 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {breadcrumbs.join(" / ")}
          </p>
        ) : null}
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {userName ?? "Usuario"}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {userEmail ?? "Sin sesión local"}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-brand-dark)]">
          <UserRound className="h-4 w-4" aria-hidden />
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} type="button">
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
      </div>
    </header>
  );
}
