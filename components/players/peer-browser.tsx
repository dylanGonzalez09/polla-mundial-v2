"use client";

import { useMemo, useState } from "react";

import { BracketView } from "@/components/bracket/bracket-view";
import { PhaseTabs } from "@/components/bracket/phase-tabs";
import { Surface } from "@/components/ui/card";
import { buildResolvedMatches, matchesByRound } from "@/lib/domain/bracket";
import { ROUND_LABELS } from "@/lib/domain/rounds";
import type {
  BracketMatchView,
  OfficialResult,
  PredictionPick,
  RoundKey,
  Team,
} from "@/lib/domain/types";

type Peer = {
  userId: string;
  displayName: string;
  hasInitial: boolean;
  totalPoints: number;
  phaseStatus: Partial<Record<RoundKey, boolean>>;
  picks: PredictionPick[];
};

export function PeerBrowser({
  peers,
  matches,
  teams,
  unlockedRounds,
  officialResults,
}: {
  peers: Peer[];
  matches: BracketMatchView[];
  teams: Team[];
  unlockedRounds: RoundKey[];
  officialResults: OfficialResult[];
}) {
  const [activePeerId, setActivePeerId] = useState(peers[0]?.userId ?? "");
  const activePeer = peers.find((peer) => peer.userId === activePeerId) ?? null;
  const pickMap = useMemo(
    () => new Map((activePeer?.picks ?? []).map((pick) => [pick.matchId, pick])),
    [activePeer],
  );
  const resolvedMatches = useMemo(
    () => buildResolvedMatches(matches, teams, activePeer?.picks ?? []),
    [activePeer, matches, teams],
  );
  const byRound = useMemo(() => matchesByRound(resolvedMatches), [resolvedMatches]);
  const resolvedMatchMap = useMemo(
    () => new Map(resolvedMatches.map((match) => [match.id, match])),
    [resolvedMatches],
  );
  const officialResolvedById = useMemo(() => {
    const officialPicks = officialResults.map((result) => ({
      matchId: result.matchId,
      predictedAdvancingTeamId: result.advancingTeamId,
      homeScore: null,
      awayScore: null,
    }));
    return new Map(
      buildResolvedMatches(matches, teams, officialPicks).map((match) => [
        match.id,
        match,
      ]),
    );
  }, [matches, teams, officialResults]);

  const officialMap = useMemo(() => {
    const resultById = new Map(
      officialResults.map((result) => [result.matchId, result]),
    );

    // Construimos una celda para TODOS los partidos (no solo los que ya
    // tienen marcador), para poder mostrar el ocupante oficial de cada cruce
    // en la ronda siguiente aunque ese partido aun no se juegue.
    return new Map(
      matches.map((match) => {
        const result = resultById.get(match.id) ?? null;
        const resolved = officialResolvedById.get(match.id);
        return [
          match.id,
          {
            homeScore: result?.homeScore ?? null,
            awayScore: result?.awayScore ?? null,
            advancingTeamId: result?.advancingTeamId ?? null,
            advancingTeamName:
              teams.find((team) => team.id === result?.advancingTeamId)?.name ??
              null,
            realHomeTeamId: resolved?.homeTeam?.id ?? null,
            realAwayTeamId: resolved?.awayTeam?.id ?? null,
            realHomeTeamName: resolved?.homeTeam?.name ?? null,
            realAwayTeamName: resolved?.awayTeam?.name ?? null,
          },
        ];
      }),
    );
  }, [matches, officialResults, officialResolvedById, teams]);

  const resolveTeams = (match: BracketMatchView) => {
    const resolved = resolvedMatchMap.get(match.id);

    return {
      homeTeam: resolved?.homeTeam ?? null,
      awayTeam: resolved?.awayTeam ?? null,
    };
  };

  if (!peers.length) {
    return (
      <Surface className="p-6">
        <p className="text-sm text-[var(--muted-ink)]">
          Aun no hay jugadores con fases visibles para comparar.
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      <Surface className="p-6">
        <div className="flex flex-wrap gap-2">
          {peers.map((peer) => (
            <button
              key={peer.userId}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                peer.userId === activePeerId
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-soft)] text-[var(--muted-ink)]"
              }`}
              type="button"
              onClick={() => setActivePeerId(peer.userId)}
            >
              {peer.displayName}
            </button>
          ))}
        </div>
      </Surface>

      {activePeer ? (
        <>
          <Surface className="p-6">
            <h2 className="font-serif text-3xl text-[var(--ink)]">
              {activePeer.displayName}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">
              Puntaje total: {activePeer.totalPoints}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {unlockedRounds.map((round) => {
                const submitted = activePeer.phaseStatus[round] ?? false;

                return (
                  <div
                    key={round}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      submitted
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ROUND_LABELS[round]}: {submitted ? "Enviado" : "No enviado"}
                  </div>
                );
              })}
            </div>
          </Surface>

          <div className="rounded-[32px] bg-[linear-gradient(160deg,#12324b_0%,#091c2c_100%)] p-5 sm:p-7">
            <PhaseTabs
              matches={byRound}
              picks={pickMap}
              canEditTeams={() => false}
              canEditScores={() => false}
              onPickWinner={() => {}}
              onChangeScore={() => {}}
              resolveTeams={resolveTeams}
              officialResults={officialMap}
              readOnly
            />
            <BracketView
              matches={byRound}
              picks={pickMap}
              canEditTeams={() => false}
              canEditScores={() => false}
              onPickWinner={() => {}}
              onChangeScore={() => {}}
              resolveTeams={resolveTeams}
              officialResults={officialMap}
              readOnly
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
