import { PeerBrowser } from "@/components/players/peer-browser";
import { Surface } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { getCurrentProfile } from "@/lib/auth/dal";
import { getBracketCatalog } from "@/lib/data/matches";
import type { RoundKey } from "@/lib/domain/types";
import { getCurrentUserPrediction } from "@/lib/data/predictions";
import { getPeerInitial, getPeerRoundScores } from "@/lib/data/peers";
import { getOfficialResults } from "@/lib/data/results";

export default async function PlayersPage() {
  const [{ matches, teams }, predictionBundle, officialResults, profile] = await Promise.all([
    getBracketCatalog(),
    getCurrentUserPrediction(),
    getOfficialResults(),
    getCurrentProfile(),
  ]);

  if (!predictionBundle.prediction?.isConfirmed) {
    return (
      <div className="space-y-6">
        <PageHero eyebrow="Mundial 2026" title="Jugadores" />
        <Surface className="p-6">
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">
            Confirma primero tu cuadro inicial para desbloquear la vista de los
            demas participantes.
          </p>
        </Surface>
      </div>
    );
  }

  const [initialRows, ...roundRows] = await Promise.all([
    getPeerInitial(),
    ...predictionBundle.submissions.map((submission) =>
      getPeerRoundScores(submission.round),
    ),
  ]);
  const unlockedRounds: RoundKey[] = [
    "r32",
    ...predictionBundle.submissions.map((submission) => submission.round),
  ];

  const peerMap = new Map<
    string,
    {
      userId: string;
      displayName: string;
      hasInitial: boolean;
      totalPoints: number;
      phaseStatus: Partial<Record<RoundKey, boolean>>;
      picks: Map<number, { matchId: number; predictedAdvancingTeamId: number | null; homeScore: number | null; awayScore: number | null }>;
    }
  >();

  for (const row of initialRows) {
    peerMap.set(row.user_id, {
      userId: row.user_id,
      displayName: row.display_name,
      hasInitial: row.has_submitted,
      totalPoints: row.total_points ?? 0,
      phaseStatus: {
        r32: row.has_submitted,
      },
      picks: new Map(
        (row.picks ?? []).map((pick) => [
          pick.match_id,
          {
            matchId: pick.match_id,
            predictedAdvancingTeamId: pick.predicted_advancing_team_id,
            homeScore: pick.home_score,
            awayScore: pick.away_score,
          },
        ]),
      ),
    });
  }

  for (const [index, batch] of roundRows.entries()) {
    const round = predictionBundle.submissions[index]?.round;
    if (!round) {
      continue;
    }

    for (const row of batch) {
      const peer = peerMap.get(row.user_id);
      if (!peer) {
        continue;
      }

      peer.phaseStatus[round] = row.has_submitted;

      if (!row.picks) {
        continue;
      }

      for (const pick of row.picks) {
        const current = peer.picks.get(pick.match_id);
        peer.picks.set(pick.match_id, {
          matchId: pick.match_id,
          predictedAdvancingTeamId: current?.predictedAdvancingTeamId ?? null,
          homeScore: pick.home_score,
          awayScore: pick.away_score,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Visibilidad incremental"
        title="Jugadores"
        subtitle="Solo ves lo que ya desbloqueaste con tus propios envios. Los peers que todavia no enviaron una fase quedan sin marcadores visibles."
      />

      <PeerBrowser
        peers={[
          {
            userId: profile.id,
            displayName: `${profile.displayName} (Tu)`,
            hasInitial: true,
            totalPoints: predictionBundle.prediction?.totalPoints ?? 0,
            phaseStatus: Object.fromEntries(
              unlockedRounds.map((round) => [
                round,
                round === "r32" || predictionBundle.submissions.some((s) => s.round === round),
              ]),
            ) as Partial<Record<RoundKey, boolean>>,
            picks: predictionBundle.picks,
          },
          ...[...peerMap.values()].map((peer) => ({
            userId: peer.userId,
            displayName: peer.displayName,
            hasInitial: peer.hasInitial,
            totalPoints: peer.totalPoints,
            phaseStatus: peer.phaseStatus,
            picks: [...peer.picks.values()],
          })),
        ]}
        matches={matches.map((match) => ({
          ...match,
          homeTeam: teams.find((team) => team.id === match.homeTeamId) ?? null,
          awayTeam: teams.find((team) => team.id === match.awayTeamId) ?? null,
        }))}
        teams={teams}
        unlockedRounds={unlockedRounds}
        officialResults={[...officialResults.values()]}
      />
    </div>
  );
}
