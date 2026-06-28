import { Surface } from "@/components/ui/card";
import { getRanking } from "@/lib/data/ranking";

export default async function RankingPage() {
  const ranking = await getRanking();

  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-[var(--line)] px-6 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
          Ranking global
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[var(--ink)]">
          Tabla general
        </h1>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {ranking.map((row, index) => (
          <div
            key={row.displayName}
            className="flex items-center justify-between gap-4 px-6 py-4 sm:px-8"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-soft)] text-sm font-semibold text-[var(--ink)]">
                {index + 1}
              </div>
              <div>
                <div className="font-semibold text-[var(--ink)]">{row.displayName}</div>
                <div className="text-sm text-[var(--muted-ink)]">Jugador</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-[var(--ink)]">
                {row.totalPoints}
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-[var(--muted-ink)]">
                puntos
              </div>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
