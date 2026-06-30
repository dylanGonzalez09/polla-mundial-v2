"use client";

import { useMemo, useState } from "react";

import { BracketView } from "@/components/bracket/bracket-view";
import { PhaseTabs } from "@/components/bracket/phase-tabs";
import { Surface } from "@/components/ui/card";
import { buildResolvedMatches, matchesByRound } from "@/lib/domain/bracket";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import { scoreMatch } from "@/lib/domain/scoring";
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
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
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

  const matchOptionsByRound = useMemo(() => {
    return ROUND_ORDER.map((round) => ({
      round,
      options: matches
        .filter((match) => match.round === round)
        .sort((left, right) => left.slotOrder - right.slotOrder)
        .map((match) => {
          const official = officialMap.get(match.id);
          const homeName =
            official?.realHomeTeamName ?? match.homeTeam?.name ?? "Por definir";
          const awayName =
            official?.realAwayTeamName ?? match.awayTeam?.name ?? "Por definir";
          return {
            id: match.id,
            label: `${homeName} vs ${awayName}`,
          };
        }),
    })).filter((group) => group.options.length > 0);
  }, [matches, officialMap]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  );

  const selectedMatchOfficial = useMemo(() => {
    if (!selectedMatch) {
      return null;
    }

    const official = officialMap.get(selectedMatch.id) ?? null;
    const hasOfficial =
      official != null && official.homeScore !== null && official.awayScore !== null;

    return {
      hasOfficial,
      homeTeamName: official?.realHomeTeamName ?? selectedMatch.code,
      awayTeamName: official?.realAwayTeamName ?? selectedMatch.code,
      homeScore: official?.homeScore ?? null,
      awayScore: official?.awayScore ?? null,
      advancingTeamName: official?.advancingTeamName ?? null,
    };
  }, [selectedMatch, officialMap]);

  const matchPicksByPeer = useMemo(() => {
    if (!selectedMatch) {
      return [];
    }

    const official = officialMap.get(selectedMatch.id) ?? null;
    const hasOfficial =
      official != null && official.homeScore !== null && official.awayScore !== null;

    return peers.map((peer) => {
      const resolved = buildResolvedMatches(matches, teams, peer.picks);
      const match = resolved.find((item) => item.id === selectedMatch.id) ?? null;
      const pick = peer.picks.find((item) => item.matchId === selectedMatch.id) ?? null;

      const advancingCorrect =
        hasOfficial &&
        official.advancingTeamId != null &&
        pick?.predictedAdvancingTeamId === official.advancingTeamId;

      const matchupCorrect =
        hasOfficial &&
        official.realHomeTeamId != null &&
        official.realAwayTeamId != null &&
        match?.homeTeam?.id === official.realHomeTeamId &&
        match?.awayTeam?.id === official.realAwayTeamId;

      const hasPick =
        pick != null &&
        (pick.predictedAdvancingTeamId != null ||
          (pick.homeScore != null && pick.awayScore != null));

      const points =
        hasOfficial && hasPick && official
          ? scoreMatch(
              { homeScore: pick?.homeScore ?? null, awayScore: pick?.awayScore ?? null },
              official,
              advancingCorrect,
              matchupCorrect,
              selectedMatch.round === "r32",
            )
          : null;

      const isCorrect = hasOfficial ? advancingCorrect : null;

      return {
        peer,
        homeTeam: match?.homeTeam ?? null,
        awayTeam: match?.awayTeam ?? null,
        predictedTeam: match?.predictedTeam ?? null,
        homeScore: pick?.homeScore ?? null,
        awayScore: pick?.awayScore ?? null,
        points,
        isCorrect,
      };
    });
  }, [selectedMatch, peers, matches, teams, officialMap]);

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
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
          Filtrar por partido
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">
          Elige un cruce especifico (pais vs pais) para ver de un vistazo que
          pronostico cada jugador en ese partido, sin tener que abrir cuadro por
          cuadro. Usa &quot;Limpiar filtro&quot; para volver a la vista por jugador.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            value={selectedMatchId ?? ""}
            onChange={(event) =>
              setSelectedMatchId(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
          >
            <option value="">Selecciona un partido...</option>
            {matchOptionsByRound.map((group) => (
              <optgroup key={group.round} label={ROUND_LABELS[group.round]}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={selectedMatchId == null}
            onClick={() => setSelectedMatchId(null)}
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-ink)] underline decoration-dotted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpiar filtro
          </button>
        </div>
      </Surface>

      {selectedMatch ? (
        <Surface className="overflow-hidden">
          <div className="border-b border-[var(--line)] px-6 py-4 sm:px-8">
            <h2 className="font-serif text-2xl text-[var(--ink)]">
              {matchOptionsByRound
                .flatMap((group) => group.options)
                .find((option) => option.id === selectedMatch.id)?.label ??
                selectedMatch.code}
            </h2>
            {selectedMatchOfficial?.hasOfficial ? (
              <p className="mt-2 text-sm text-[var(--muted-ink)]">
                Resultado oficial: {selectedMatchOfficial.homeTeamName}{" "}
                {selectedMatchOfficial.homeScore} - {selectedMatchOfficial.awayScore}{" "}
                {selectedMatchOfficial.awayTeamName}
                {selectedMatchOfficial.advancingTeamName
                  ? ` · Avanza: ${selectedMatchOfficial.advancingTeamName}`
                  : null}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted-ink)]">
                Este partido todavia no tiene resultado oficial cargado.
              </p>
            )}
          </div>
          <div className="grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr] gap-2 border-b border-[var(--line)] bg-[var(--surface-soft)] px-6 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] sm:px-8">
            <span>Jugador</span>
            <span>Marcador pronosticado</span>
            <span>Resultado</span>
            <span className="text-right">Puntos</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {matchPicksByPeer.map(
              ({
                peer,
                homeTeam,
                awayTeam,
                predictedTeam,
                homeScore,
                awayScore,
                points,
                isCorrect,
              }) => (
              <div
                key={peer.userId}
                className="grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr] items-center gap-2 px-6 py-4 sm:px-8"
              >
                <span className="font-semibold text-[var(--ink)]">
                  {peer.displayName}
                </span>
                <span className="text-sm text-[var(--ink)]">
                  {homeTeam && awayTeam && homeScore != null && awayScore != null
                    ? `${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}`
                    : "Sin marcador"}
                  {predictedTeam ? (
                    <span className="block text-xs text-[var(--muted-ink)]">
                      Pronostico avanza: {predictedTeam.name}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isCorrect === true
                      ? "bg-emerald-100 text-emerald-800"
                      : isCorrect === false
                        ? "bg-red-100 text-red-800"
                        : "bg-[var(--surface-soft)] text-[var(--muted-ink)]"
                  }`}
                >
                  {isCorrect === true
                    ? "Acerto quien avanza"
                    : isCorrect === false
                      ? "Fallo quien avanza"
                      : "Sin resultado oficial"}
                </span>
                <span className="text-right text-sm font-semibold text-[var(--ink)]">
                  {points != null ? `${points} pts` : "—"}
                </span>
              </div>
              ),
            )}
          </div>
        </Surface>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
