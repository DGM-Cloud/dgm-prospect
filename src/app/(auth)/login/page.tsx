import { LoginForm } from "./login-form";
import { isSupabaseConfigured } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{ reason?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">
            DGM CLOUD
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
            DGM Prospect
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Prospección comercial e inteligencia geográfica
          </p>
        </div>

        {!configured || params.reason === "supabase-not-configured" ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-muted-foreground)]">
            <p className="font-medium text-[var(--color-ink)]">
              Supabase Auth no está configurado
            </p>
            <p className="mt-2">
              Copia <code className="text-xs">.env.example</code> a{" "}
              <code className="text-xs">.env</code> y define{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> y{" "}
              <code className="text-xs">SUPABASE_JWT_SECRET</code> con los valores
              de tu proyecto Supabase.
            </p>
          </div>
        ) : (
          <LoginForm nextPath={params.next ?? "/dashboard"} />
        )}
      </div>
    </div>
  );
}
