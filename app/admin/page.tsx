import { AdminMatchBrowser } from "@/components/admin/admin-match-browser";
import { PhaseWindowForm } from "@/components/admin/phase-window-form";
import { PageHero } from "@/components/ui/page-hero";
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

  const matchesWithTeams = matches.map((match) => {
    const resolved = resolvedById.get(match.id);
    return {
      ...match,
      homeTeam: resolved?.homeTeam ?? null,
      awayTeam: resolved?.awayTeam ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin"
        title="Control de ventanas y resultados"
        subtitle="Ajusta el deadline inicial, abre o cierra rondas manualmente y registra los resultados oficiales que recalculan el ranking."
      />

      <PhaseWindowForm settings={settings} phases={phases} />

      <AdminMatchBrowser matches={matchesWithTeams} results={results} />
    </div>
  );
}
