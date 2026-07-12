import { LeagueBadge } from "@/components/ui/league-badge";
import { BottomTabsNav, SidebarNav } from "@/components/nav";
import { UpdateBanner } from "@/components/update-banner";
import { logout } from "@/lib/auth/actions";
import { getLeague } from "@/lib/domain/leagues";
import type { AuthProfile } from "@/lib/domain/types";

export function AppShell({
  profile,
  totalPoints,
  children,
}: {
  profile: AuthProfile;
  totalPoints: number;
  children: React.ReactNode;
}) {
  const league = getLeague(totalPoints);

  return (
    <div className="lg:flex lg:min-h-screen">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[260px] lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--chrome-line)] lg:bg-[var(--chrome)] lg:px-5 lg:py-6">
        <div className="pattern-tricolor -mx-5 -mt-6 mb-5 px-5 py-4">
          <p className="font-display text-lg text-white">POLLA MUNDIAL 26</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3">
          <LeagueBadge tier={league.tier} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--on-dark)]">
              {profile.displayName}
            </p>
            <p className="tabular-nums text-xs font-semibold text-[var(--on-dark-muted)]">
              {league.label} · {totalPoints} pts
            </p>
          </div>
        </div>

        <div className="mt-5 flex-1">
          <SidebarNav isAdmin={profile.isAdmin} />
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-full border border-white/15 bg-white/6 px-4 py-2.5 text-sm font-semibold text-[var(--on-dark-muted)] transition hover:bg-white/12 hover:text-white"
          >
            Salir
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pattern-tricolor flex items-center justify-between px-4 py-3 lg:hidden">
          <p className="font-display text-sm text-white">POLLA 26</p>
          <div className="flex items-center gap-2">
            <LeagueBadge tier={league.tier} size="sm" />
            <span className="tabular-nums text-xs font-semibold text-white">
              {totalPoints} pts
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white"
              >
                Salir
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <UpdateBanner />
          {children}
        </main>

        <BottomTabsNav isAdmin={profile.isAdmin} />
      </div>
    </div>
  );
}
