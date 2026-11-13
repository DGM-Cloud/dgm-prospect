"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPinned,
  Users,
  Megaphone,
  KanbanSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/shared/utilities/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/explorer", label: "Business Explorer", icon: MapPinned },
  { href: "/prospects", label: "Prospectos", icon: Users },
  { href: "/campaigns", label: "Campañas", icon: Megaphone },
  { href: "/pipeline", label: "Pipeline comercial", icon: KanbanSquare },
  { href: "/settings", label: "Configuración", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-nav)] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/60">
          DGM CLOUD
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight">DGM Prospect</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
