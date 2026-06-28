import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { logout } from "@/lib/auth/actions";
import type { AuthProfile } from "@/lib/domain/types";

const navItems = [
  { href: "/bracket", label: "Bracket" },
  { href: "/players", label: "Jugadores" },
  { href: "/ranking", label: "Ranking" },
];

export function AppShell({
  profile,
  children,
}: {
  profile: AuthProfile;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-5 bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-soft)_100%)] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
                Polla Mundial
              </p>
              <h1 className="font-serif text-3xl text-[var(--ink)]">
                {profile.displayName}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
              {profile.isAdmin ? (
                <Link
                  className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)]"
                  href="/admin"
                >
                  Admin
                </Link>
              ) : null}
              <form action={logout}>
                <Button tone="ghost">Salir</Button>
              </form>
            </div>
          </div>
        </div>
      </Surface>

      {children}
    </div>
  );
}
