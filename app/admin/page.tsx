import { OfficialResultForm } from "@/components/admin/official-result-form";
import { PhaseWindowForm } from "@/components/admin/phase-window-form";
import { Surface } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/dal";
import { buildResolvedMatches } from "@/lib/domain/bracket";
import { getBracketCatalog, getPhaseWindows, getAppSettings } from "@/lib/data/matches";
import { getOfficialResults } from "@/lib/data/results";

export default async function AdminPage() {
  await requireAdmin();

  const [{ matches, teams }, settings, phases, results] = await Promise.all([
    getBracketCatalog(),
    getAppSettings(),
    getPhaseWindows(),
    getOfficialResults(),
  ]);

  // Cascada oficial: cada partido se resuelve a partir de los equipos que
  // avanzaron oficialmente en los partidos previos, no de los picks de usuario.
  const officialPicks = matches.map((match) => {
    const result = results.get(match.id);
    return {
      matchId: match.id,
      predictedAdvancingTeamId: result?.advancingTeamId ?? null,
      homeScore: result?.homeScore ?? null,
      awayScore: result?.awayScore ?? null,
    };
  });
  const resolvedById = new Map(
    buildResolvedMatches(matches, teams, officialPicks).map((match) => [match.id, match]),
  );

  return (
    <div className="space-y-6">
      <Surface className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[var(--ink)]">
          Control de ventanas y resultados
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-ink)]">
          Ajusta el deadline inicial, abre o cierra rondas manualmente y registra
          los resultados oficiales que recalculan el ranking.
        </p>
      </Surface>

      <PhaseWindowForm settings={settings} phases={phases} />

      <div className="grid gap-5 xl:grid-cols-2">
        {matches.map((match) => {
          const resolved = resolvedById.get(match.id);
          return (
            <OfficialResultForm
              key={match.id}
              match={{
                ...match,
                homeTeam: resolved?.homeTeam ?? null,
                awayTeam: resolved?.awayTeam ?? null,
              }}
              result={results.get(match.id) ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}
