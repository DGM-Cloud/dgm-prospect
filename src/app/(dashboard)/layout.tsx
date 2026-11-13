import { Sidebar } from "@/shared/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-nav)] px-4 py-3 text-white md:hidden">
          <p className="text-sm font-semibold">DGM Prospect</p>
        </div>
        {children}
      </div>
    </div>
  );
}
