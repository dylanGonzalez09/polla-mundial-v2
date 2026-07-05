import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { logout } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-soft)_100%)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              Panel de administracion
            </p>
            <h1 className="font-serif text-3xl text-[var(--ink)]">
              {profile.displayName}
            </h1>
          </div>

          <form action={logout}>
            <Button tone="ghost">Salir</Button>
          </form>
        </div>
      </Surface>

      <nav className="flex flex-wrap gap-3">
        <Link
          className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
          href="/admin"
        >
          Resultados oficiales
        </Link>
        <Link
          className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
          href="/admin/correcciones"
        >
          Correcciones de jugadores
        </Link>
      </nav>

      {children}
    </div>
  );
}
