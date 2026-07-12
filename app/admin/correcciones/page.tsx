import {
  PredictionCorrectionForm,
  type PredictionCorrectionMatch,
} from "@/components/admin/prediction-correction-form";
import { Surface } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/dal";
import { getBracketCatalog } from "@/lib/data/matches";
import { getAdminPredictionCorrections } from "@/lib/data/predictions";
import { buildResolvedMatches } from "@/lib/domain/bracket";
import { ROUND_LABELS } from "@/lib/domain/rounds";
import type {
  AdminPredictionCorrectionRow,
  PredictionPick,
  Team,
  TournamentMatch,
} from "@/lib/domain/types";

type CorrectionPlayer = {
  userId: string;
  displayName: string;
  predictionId: string;
  isConfirmed: boolean;
  totalPoints: number;
  rows: AdminPredictionCorrectionRow[];
};

function groupByPlayer(rows: AdminPredictionCorrectionRow[]) {
  const players = new Map<string, CorrectionPlayer>();

  for (const row of rows) {
    const existing = players.get(row.userId);
    if (existing) {
      existing.rows.push(row);
      continue;
    }

    players.set(row.userId, {
      userId: row.userId,
      displayName: row.displayName,
      predictionId: row.predictionId,
      isConfirmed: row.isConfirmed,
      totalPoints: row.totalPoints,
      rows: [row],
    });
  }

  return [...players.values()];
}

function buildCorrectionMatches(
  player: CorrectionPlayer,
  matches: TournamentMatch[],
  teams: Team[],
): PredictionCorrectionMatch[] {
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const picks: PredictionPick[] = player.rows.map((row) => ({
    id: row.pickId,
    predictionId: row.predictionId,
    matchId: row.matchId,
    predictedAdvancingTeamId: row.predictedAdvancingTeamId,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    points: row.points,
  }));
  const resolvedById = new Map(
    buildResolvedMatches(matches, teams, picks).map((match) => [match.id, match]),
  );

  return player.rows.map((row) => {
    const resolved = resolvedById.get(row.matchId);
    const contenders = [resolved?.homeTeam ?? null, resolved?.awayTeam ?? null].filter(
      (team): team is Team => team !== null,
    );
    const selectedTeam = row.predictedAdvancingTeamId
      ? teamMap.get(row.predictedAdvancingTeamId) ?? null
      : null;
    const options = [...contenders];

    if (selectedTeam && !options.some((team) => team.id === selectedTeam.id)) {
      options.push(selectedTeam);
    }

    return {
      predictionId: player.predictionId,
      matchId: row.matchId,
      code: resolved?.code ?? `Partido ${row.matchId}`,
      roundLabel: resolved ? ROUND_LABELS[resolved.round] : "Ronda",
      homeTeamName: resolved?.homeTeam?.name ?? "Por definir",
      awayTeamName: resolved?.awayTeam?.name ?? "Por definir",
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      points: row.points,
      predictedAdvancingTeamId: row.predictedAdvancingTeamId,
      contenders: options,
    };
  });
}

export default async function AdminCorreccionesPage() {
  await requireAdmin();

  const [{ matches, teams }, rows] = await Promise.all([
    getBracketCatalog(),
    getAdminPredictionCorrections(),
  ]);
  const players = groupByPlayer(rows);

  return (
    <div className="space-y-6">
      <Surface className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
          Correcciones
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[var(--ink)]">
          Ajustar resultados de jugadores
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-ink)]">
          Cambia manualmente el marcador o el equipo que avanza en un pick de jugador.
          Al guardar, la matriz de puntuacion se recalcula desde la base de datos.
        </p>
      </Surface>

      {players.length === 0 ? (
        <Surface className="p-6">
          <p className="text-sm text-[var(--muted-ink)]">
            No hay predicciones de jugadores para corregir.
          </p>
        </Surface>
      ) : null}

      {players.map((player) => {
        const correctionMatches = buildCorrectionMatches(player, matches, teams);

        return (
          <section key={player.userId} className="space-y-5">
            <Surface className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                    Jugador
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-[var(--ink)]">
                    {player.displayName}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted-ink)]">
                    Estado: {player.isConfirmed ? "confirmado" : "sin confirmar"}
                  </p>
                </div>
                <div className="rounded-3xl border border-[var(--line)] bg-white px-5 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-ink)]">
                    Total
                  </p>
                  <p className="font-serif text-3xl text-[var(--ink)]">
                    {player.totalPoints} pts
                  </p>
                </div>
              </div>
            </Surface>

            <div className="grid gap-5 xl:grid-cols-2">
              {correctionMatches.map((match) => (
                <PredictionCorrectionForm
                  key={`${player.predictionId}-${match.matchId}`}
                  playerName={player.displayName}
                  match={match}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
