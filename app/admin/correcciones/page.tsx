import type { PredictionCorrectionMatch } from "@/components/admin/prediction-correction-form";
import {
  PredictionCorrectionBrowser,
  type CorrectionPlayer,
} from "@/components/admin/prediction-correction-browser";
import { PageHero } from "@/components/ui/page-hero";
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

type PlayerRows = {
  userId: string;
  displayName: string;
  predictionId: string;
  isConfirmed: boolean;
  totalPoints: number;
  rows: AdminPredictionCorrectionRow[];
};

function groupByPlayer(rows: AdminPredictionCorrectionRow[]) {
  const players = new Map<string, PlayerRows>();

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
  player: PlayerRows,
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
      round: resolved?.round ?? "r32",
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

  const players: CorrectionPlayer[] = groupByPlayer(rows).map((player) => ({
    userId: player.userId,
    displayName: player.displayName,
    isConfirmed: player.isConfirmed,
    totalPoints: player.totalPoints,
    matches: buildCorrectionMatches(player, matches, teams),
  }));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Correcciones"
        title="Ajustar resultados de jugadores"
        subtitle="Cambia manualmente el marcador o el equipo que avanza en un pick de jugador. Al guardar, la matriz de puntuacion se recalcula desde la base de datos."
      />

      <PredictionCorrectionBrowser players={players} />
    </div>
  );
}
