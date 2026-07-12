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
      <div className="pattern-tricolor flex flex-col gap-4 rounded-[20px] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Panel de administracion
          </p>
          <h1 className="font-display mt-1 text-2xl text-white">
            {profile.displayName}
          </h1>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
          >
            Salir
          </button>
        </form>
      </div>

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
